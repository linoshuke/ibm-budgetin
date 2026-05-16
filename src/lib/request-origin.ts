function normalizeForwarded(value: string | null) {
  if (!value) return "";
  return value.split(",")[0]?.trim() ?? "";
}

export function getRequestOrigin(request: Request) {
  try {
    const urlOrigin = new URL(request.url).origin;
    const forwardedHost = normalizeForwarded(request.headers.get("x-forwarded-host"));
    const host = forwardedHost || request.headers.get("host") || new URL(request.url).host;
    const forwardedProto = normalizeForwarded(request.headers.get("x-forwarded-proto"));
    const proto = forwardedProto || new URL(request.url).protocol.replace(":", "");

    if (!host) return urlOrigin;
    return `${proto}://${host}`;
  } catch {
    return "";
  }
}

