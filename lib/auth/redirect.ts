export function safeNextPath(value: string | null | undefined, fallback = "/workspace") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
