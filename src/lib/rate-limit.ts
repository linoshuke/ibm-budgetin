import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";
import { isIP } from "node:net";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
};

type RateLimitOptions = {
  request: Request;
  key: string;
  limit: number;
  windowMs: number;
  extraKeys?: Array<string | number | undefined | null>;
};

const MAX_ENTRIES = 10_000;
const DEFAULT_PREFIX = "ratelimit";

let redisClient: Redis | null | undefined;
let redisConfigured = false;
let redisDisabled = false;
let redisFallbackWarned = false;

function getRedis() {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  redisConfigured = Boolean(url && token);
  if (!url || !token) {
    console.warn("[rate-limit] Upstash env missing, assuming WAF/CDN handles rate limiting.");
    redisClient = null;
    return redisClient;
  }

  if (redisDisabled) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function getStore() {
  const globalStore = globalThis as typeof globalThis & {
    __rateLimitStore?: Map<string, RateLimitEntry>;
  };
  if (!globalStore.__rateLimitStore) {
    globalStore.__rateLimitStore = new Map();
  }
  return globalStore.__rateLimitStore;
}

function getClientIp(request: Request) {
  const trustedHeaders = [
    "x-vercel-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
  ];

  for (const header of trustedHeaders) {
    const raw = request.headers.get(header);
    const candidate = raw?.split(",")[0]?.trim();
    if (candidate && isIP(candidate)) {
      return candidate;
    }
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const candidate = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .find((part) => isIP(part));
    if (candidate) return candidate;
  }

  return "unknown";
}

function hashKeyPart(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildResult(limit: number, count: number, resetAt: number, now = Date.now()): RateLimitResult {
  const remaining = Math.max(0, limit - count);
  const ok = count <= limit;
  const resetSeconds = Math.ceil(resetAt / 1000);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(ok ? remaining : 0),
    "X-RateLimit-Reset": String(resetSeconds),
  };

  if (!ok) {
    headers["Retry-After"] = String(Math.max(1, Math.ceil((resetAt - now) / 1000)));
  }

  return {
    ok,
    limit,
    remaining,
    resetAt,
    headers,
  };
}

async function rateLimitRedis(
  redis: Redis,
  bucketKey: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const pipeline = redis.pipeline();
  pipeline.incr(bucketKey);
  pipeline.pttl(bucketKey);
  const [countRaw, ttlRaw] = await pipeline.exec();

  const count = Number(countRaw ?? 0);
  let ttl = Number(ttlRaw ?? -1);

  if (count === 1 || ttl < 0) {
    await redis.pexpire(bucketKey, windowMs);
    ttl = windowMs;
  }

  const resetAt = now + ttl;
  return buildResult(limit, count, resetAt, now);
}

function rateLimitMemory(
  bucketKey: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const store = getStore();
  const now = Date.now();

  let entry = store.get(bucketKey);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count += 1;
  store.set(bucketKey, entry);

  if (store.size > MAX_ENTRIES) {
    for (const [storedKey, storedEntry] of store.entries()) {
      if (storedEntry.resetAt < now) {
        store.delete(storedKey);
      }
    }
  }

  return buildResult(limit, entry.count, entry.resetAt, now);
}

export async function rateLimit({
  request,
  key,
  limit,
  windowMs,
  extraKeys,
}: RateLimitOptions): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const prefix = process.env.RATE_LIMIT_REDIS_PREFIX ?? DEFAULT_PREFIX;
  const extraKeyParts =
    extraKeys
      ?.filter((part) => part !== undefined && part !== null)
      .map((part) => hashKeyPart(String(part).toLowerCase())) ?? [];
  const bucketKey = [prefix, key, ip, ...extraKeyParts].join(":");
  const redis = getRedis();

  if (redis) {
    try {
      return await rateLimitRedis(redis, bucketKey, limit, windowMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!redisFallbackWarned) {
        console.warn("[rate-limit] Redis rate limit fallback to memory:", message);
        redisFallbackWarned = true;
      }

      if (message.toLowerCase().includes("noperm")) {
        redisDisabled = true;
        redisClient = null;
      }
      return rateLimitMemory(bucketKey, limit, windowMs);
    }
  }

  if (redisConfigured) {
    return rateLimitMemory(bucketKey, limit, windowMs);
  }

  // No redis backend configured (e.g., handled at WAF/CDN) -- return a pass result.
  return buildResult(limit, 0, Date.now() + windowMs);
}
