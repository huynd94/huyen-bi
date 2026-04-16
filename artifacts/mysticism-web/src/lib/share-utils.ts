// URL-based result sharing utilities
// Encodes/decodes result data into URL search params for shareable links

export function encodeShareParams(data: Record<string, string>): string {
  const params = new URLSearchParams(data);
  return params.toString();
}

export function decodeShareParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  params.forEach((val, key) => { result[key] = val; });
  return result;
}

export function buildShareUrl(path: string, data: Record<string, string>): string {
  const base = window.location.origin + (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "");
  return `${base}${path}?${encodeShareParams(data)}`;
}

export function copyShareUrl(path: string, data: Record<string, string>): Promise<void> {
  const url = buildShareUrl(path, data);
  return navigator.clipboard.writeText(url);
}

// Hook-friendly: reads URL search params on mount
export function readShareParams(): Record<string, string> {
  return decodeShareParams(window.location.search);
}
