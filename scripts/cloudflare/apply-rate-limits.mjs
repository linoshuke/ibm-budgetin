/**
 * Apply Cloudflare "legacy" Rate Limiting rules for auth endpoints.
 *
 * This repo intentionally treats Vercel Functions as stateless. If Upstash
 * isn't configured (see src/lib/rate-limit.ts), you should enforce limits at
 * the CDN/WAF layer.
 *
 * Usage (PowerShell):
 *   $env:CLOUDFLARE_ZONE_ID="..."
 *   $env:CLOUDFLARE_API_TOKEN="..."
 *   node scripts/cloudflare/apply-rate-limits.mjs --dry-run
 *   node scripts/cloudflare/apply-rate-limits.mjs --apply
 *
 * Notes:
 * - The script is idempotent by matching on `description`.
 * - Cloudflare API token needs Zone/Rate Limits permissions.
 */

const API_BASE = "https://api.cloudflare.com/client/v4";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const dryRun = args.has("--dry-run") || !args.has("--apply");
  const apply = args.has("--apply") && !args.has("--dry-run");
  return { dryRun, apply };
}

function normalizeRule(rule) {
  // Keep only fields we care about for comparison.
  return {
    threshold: rule.threshold,
    period: rule.period,
    action: rule.action,
    match: rule.match,
    description: rule.description,
    disabled: Boolean(rule.disabled),
  };
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function cfFetch(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const errors = json?.errors?.map((e) => e.message).filter(Boolean).join("; ");
    throw new Error(`Cloudflare API error (${res.status} ${res.statusText}): ${errors || "unknown"}`);
  }
  return json.result;
}

async function listRateLimits({ zoneId, token }) {
  const pageSize = 50;
  let page = 1;
  const all = [];
  while (true) {
    const result = await cfFetch(
      `/zones/${zoneId}/rate_limits?per_page=${pageSize}&page=${page}`,
      { token },
    );
    all.push(...result);
    if (result.length < pageSize) break;
    page += 1;
  }
  return all;
}

async function createRateLimit({ zoneId, token, rule }) {
  return cfFetch(`/zones/${zoneId}/rate_limits`, { method: "POST", token, body: rule });
}

async function updateRateLimit({ zoneId, token, id, rule }) {
  return cfFetch(`/zones/${zoneId}/rate_limits/${id}`, { method: "PUT", token, body: rule });
}

function buildRules() {
  // Keep descriptions stable; we use them as the idempotency key.
  const commonRequestMatch = { methods: ["POST"], schemes: ["https"] };
  return [
    {
      threshold: 5,
      period: 60,
      action: { mode: "block", timeout: 600 },
      match: {
        request: { ...commonRequestMatch, url: "*/api/auth/login*" },
        // Prefer Cloudflare's connecting IP when present.
        headers: [{ name: "cf-connecting-ip", op: "present" }],
      },
      description: "Auth login rate limit",
    },
    {
      threshold: 3,
      period: 60,
      action: { mode: "block", timeout: 1800 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/register*" } },
      description: "Auth register rate limit",
    },
    {
      threshold: 3,
      period: 60,
      action: { mode: "block", timeout: 1800 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/password-reset*" } },
      description: "Auth password reset rate limit",
    },
    {
      threshold: 3,
      period: 60,
      action: { mode: "block", timeout: 1800 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/resend*" } },
      description: "Auth resend verification rate limit",
    },
    {
      threshold: 6,
      period: 300,
      action: { mode: "block", timeout: 900 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/mfa*" } },
      description: "Auth MFA verify/enroll rate limit",
    },
    {
      threshold: 3,
      period: 60,
      action: { mode: "block", timeout: 1800 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/email-update*" } },
      description: "Auth email update rate limit",
    },
    {
      threshold: 3,
      period: 60,
      action: { mode: "block", timeout: 1800 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/password-update*" } },
      description: "Auth password update rate limit",
    },
    {
      threshold: 10,
      period: 60,
      action: { mode: "block", timeout: 600 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/anonymous*" } },
      description: "Auth anonymous sign-in rate limit",
    },
    {
      threshold: 5,
      period: 60,
      action: { mode: "block", timeout: 600 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/link*" } },
      description: "Auth link identity rate limit",
    },
    {
      threshold: 5,
      period: 60,
      action: { mode: "block", timeout: 600 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/unlink*" } },
      description: "Auth unlink identity rate limit",
    },
    {
      threshold: 5,
      period: 60,
      action: { mode: "block", timeout: 600 },
      match: { request: { ...commonRequestMatch, url: "*/api/auth/metadata-update*" } },
      description: "Auth metadata update rate limit",
    },
  ];
}

async function main() {
  const { dryRun, apply } = parseArgs(process.argv);
  const zoneId = requiredEnv("CLOUDFLARE_ZONE_ID");
  const token = requiredEnv("CLOUDFLARE_API_TOKEN");
  const desiredRules = buildRules();

  const existing = await listRateLimits({ zoneId, token });
  const byDescription = new Map(existing.map((r) => [r.description, r]));

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const desired of desiredRules) {
    const current = byDescription.get(desired.description);
    if (!current) {
      console.log(`[create] ${desired.description}`);
      if (apply) {
        await createRateLimit({ zoneId, token, rule: desired });
      }
      created += 1;
      continue;
    }

    const a = normalizeRule(current);
    const b = normalizeRule({ ...desired, disabled: Boolean(current.disabled) });

    if (deepEqual(a, b)) {
      console.log(`[keep]   ${desired.description}`);
      unchanged += 1;
      continue;
    }

    console.log(`[update] ${desired.description}`);
    if (dryRun) {
      console.log("  current:", JSON.stringify(a));
      console.log("  desired:", JSON.stringify(b));
    }
    if (apply) {
      await updateRateLimit({ zoneId, token, id: current.id, rule: desired });
    }
    updated += 1;
  }

  console.log(
    `Done. created=${created} updated=${updated} unchanged=${unchanged} mode=${apply ? "apply" : "dry-run"}`,
  );
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exitCode = 1;
});
