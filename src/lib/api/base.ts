export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://hottam-api.j-810.workers.dev";

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, init);
}
