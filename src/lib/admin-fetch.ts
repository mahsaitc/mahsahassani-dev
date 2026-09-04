'use client';

import type { ProblemDetails } from '@/lib/api-types';

/**
 * Thrown for any non-2xx dashboard response. Carries the per-field map from
 * ASP.NET's ValidationProblem so forms can show errors beside the input that
 * caused them rather than as one opaque banner.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, problem: ProblemDetails | null) {
    super(problem?.detail || problem?.title || 'The request failed.');
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = problem?.errors ?? {};
  }

  /** First message for a field, matched case-insensitively against the API's PascalCase keys. */
  fieldError(name: string): string | undefined {
    const key = Object.keys(this.fieldErrors).find((k) => k.toLowerCase() === name.toLowerCase());
    return key ? this.fieldErrors[key][0] : undefined;
  }
}

async function parseProblem(response: Response): Promise<ProblemDetails | null> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return null;
  }
}

/** JSON request through the server-side proxy. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/proxy/${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) throw new ApiError(response.status, await parseProblem(response));
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/** Multipart upload; the browser sets the boundary, so no Content-Type here. */
export async function upload<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`/api/admin/proxy/${path}`, { method: 'POST', body: form });
  if (!response.ok) throw new ApiError(response.status, await parseProblem(response));
  return (await response.json()) as T;
}

export const get = <T,>(path: string) => api<T>(path);
export const post = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const put = <T,>(path: string, body: unknown) =>
  api<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const del = (path: string) => api<void>(path, { method: 'DELETE' });
