const REOPEN_KEY = "huyen-bi-reopen";

export function storeReopenData(module: string, inputData: Record<string, unknown>) {
  try {
    sessionStorage.setItem(REOPEN_KEY, JSON.stringify({ module, inputData }));
  } catch {}
}

export function popReopenData(module: string): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(REOPEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { module: string; inputData: Record<string, unknown> };
    if (parsed.module !== module) return null;
    sessionStorage.removeItem(REOPEN_KEY);
    return parsed.inputData;
  } catch {
    return null;
  }
}

export function displayToInputDate(dob: string): string {
  if (!dob) return "";
  const parts = dob.split("/");
  if (parts.length !== 3) return dob;
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
