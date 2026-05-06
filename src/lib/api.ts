/** Base URL for the Express API (OTP, news, Postgres-backed resources). */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  const s = raw != null ? String(raw).trim() : '';
  if (s) return s.replace(/\/$/, '');
  return 'http://localhost:3001';
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function apiSend<T = unknown>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as T & { message?: string };
  if (!res.ok) {
    const msg = typeof data === 'object' && data && 'message' in data ? String(data.message) : res.statusText;
    throw new Error(msg || res.statusText);
  }
  return data;
}
