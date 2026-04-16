export interface SavedReading {
  id: number;
  module: string;
  title: string;
  input_data: Record<string, unknown>;
  result_data: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const readingsApi = {
  list: (): Promise<SavedReading[]> => apiFetch("/api/readings"),

  save: (payload: {
    module: string;
    title: string;
    input_data?: Record<string, unknown>;
    result_data?: Record<string, unknown>;
    notes?: string;
  }): Promise<SavedReading> =>
    apiFetch("/api/readings", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: number, payload: { notes?: string; title?: string }): Promise<SavedReading> =>
    apiFetch(`/api/readings/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  remove: (id: number): Promise<{ success: boolean }> =>
    apiFetch(`/api/readings/${id}`, { method: "DELETE" }),

  share: (id: number): Promise<{ token: string; expiresAt: string }> =>
    apiFetch(`/api/readings/${id}/share`, { method: "POST" }),

  getShared: (token: string): Promise<SavedReading> => apiFetch(`/api/share/${token}`),
};
