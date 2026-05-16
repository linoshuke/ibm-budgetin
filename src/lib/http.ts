export const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

export function withNoStore(extra?: Record<string, string>) {
  if (!extra) return NO_STORE_HEADERS;
  return { ...NO_STORE_HEADERS, ...extra };
}
