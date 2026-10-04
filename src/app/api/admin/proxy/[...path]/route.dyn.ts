import { NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/admin-session';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5099';

/**
 * Forwards dashboard requests to the API with the session cookie's token
 * attached as a bearer header.
 *
 * Keeping this hop server-side means the JWT never enters browser JavaScript,
 * and the API needs no CORS grant for the admin surface. Multipart uploads pass
 * straight through as a stream so large videos are not buffered twice.
 */
async function forward(request: Request, segments: string[]) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ detail: 'Your session has expired. Sign in again.' }, { status: 401 });
  }

  const path = segments.map(encodeURIComponent).join('/');
  const search = new URL(request.url).search;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  // Preserve the multipart boundary; set JSON explicitly for everything else.
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const hasBody = request.method !== 'GET' && request.method !== 'DELETE';

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/api/${path}${search}`, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Required by undici when streaming a request body through.
      duplex: hasBody ? 'half' : undefined,
      cache: 'no-store',
    } as RequestInit & { duplex?: string });
  } catch {
    return NextResponse.json(
      { detail: 'Could not reach the content API. Is the backend running?' },
      { status: 503 },
    );
  }

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await upstream.text();
  const body = text.length > 0 ? text : null;

  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Context) {
  return forward(request, (await params).path);
}

export async function POST(request: Request, { params }: Context) {
  return forward(request, (await params).path);
}

export async function PUT(request: Request, { params }: Context) {
  return forward(request, (await params).path);
}

export async function DELETE(request: Request, { params }: Context) {
  return forward(request, (await params).path);
}
