const DEFAULT_API = 'http://127.0.0.1:3000';

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  return DEFAULT_API;
}

export type ApiErrorBody = { error?: string; details?: unknown };

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  let body: BodyInit | undefined = init.body ?? undefined;
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }
  const res = await fetch(url, { ...init, headers, body });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error(`Respuesta no JSON (${res.status})`);
    }
  }
  if (!res.ok) {
    const err = data as ApiErrorBody;
    throw new Error(err?.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}
