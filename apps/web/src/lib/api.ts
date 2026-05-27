import { createClient } from '@supabase/supabase-js';

const apiBase = import.meta.env.VITE_API_URL ?? '/api';

export const supabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
    : null;

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`);
  await ensureOk(response, path);
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
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
    // Fall through to the generic response below.
  }
  if (typeof parsedMessage === 'string') throw new Error(parsedMessage);

  throw new Error(body || `Request to ${target} failed with HTTP ${response.status}.`);
}
