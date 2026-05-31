import { createClient } from '@supabase/supabase-js';
import { mockDelete, mockGet, mockPost } from './mockApi';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const apiBase   = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

// Read the URL hash SYNCHRONOUSLY at module-load time.
// Supabase processes and REMOVES the hash via microtasks, which run before any
// useEffect fires. By the time auth.ts's restore() runs, the hash is gone.
// Capturing it here (before createClient starts async init) is the only reliable window.
const _initHash = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.hash.substring(1))
  : new URLSearchParams();
export const initialAuthUrlType: string | null  = _initHash.get('type');
export const initialAuthToken:   string | null  = _initHash.get('access_token');

export const supabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        import.meta.env.VITE_SUPABASE_ANON_KEY as string
      )
    : null;

// Token getter — filled in by AuthProvider via setTokenGetter().
let _getToken: (() => string | null) | null = null;

export function setTokenGetter(fn: () => string | null) {
  _getToken = fn;
}

function authHeaders(): HeadersInit {
  const token = _getToken?.();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function apiGet<T>(path: string): Promise<T> {
  if (DEMO_MODE && !path.startsWith('/admin/') && !path.startsWith('/superadmin/') && !path.startsWith('/auth/')) {
    return Promise.resolve(mockGet<T>(path));
  }
  const response = await fetch(`${apiBase}${path}`, { headers: authHeaders() });
  await ensureOk(response, path);
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (DEMO_MODE && !path.startsWith('/admin/') && !path.startsWith('/superadmin/') && !path.startsWith('/auth/')) {
    return Promise.resolve(mockPost<T>(path, body));
  }
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  await ensureOk(response, path);
  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });
  await ensureOk(response, path);
  return response.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  if (DEMO_MODE && !path.startsWith('/admin/') && !path.startsWith('/superadmin/')) {
    return Promise.resolve(mockDelete<T>(path));
  }
  const response = await fetch(`${apiBase}${path}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  await ensureOk(response, path);
  return response.json() as Promise<T>;
}

async function ensureOk(response: Response, path: string) {
  if (response.ok) return;

  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();
  const target = `${apiBase}${path}`;

  if (contentType.includes('text/html') || body.trim().startsWith('<!DOCTYPE') || body.trim().startsWith('<html')) {
    throw new Error(
      `BennnSam API is not available at ${target}. On cPanel, deploy the Node API and set VITE_API_URL to its /api URL before building the frontend.`
    );
  }

  let parsedMessage: unknown;
  try {
    const parsed = JSON.parse(body) as { error?: unknown; message?: unknown };
    parsedMessage = parsed.error ?? parsed.message;
  } catch {
    // fall through
  }
  if (typeof parsedMessage === 'string') throw new Error(parsedMessage);
  throw new Error(body || `Request to ${target} failed with HTTP ${response.status}.`);
}
