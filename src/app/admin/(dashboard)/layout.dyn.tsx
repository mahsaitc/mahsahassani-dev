import { redirect } from 'next/navigation';
import { getSessionToken } from '@/lib/admin-session';
import { AdminShell } from '@/components/admin/shell';
import type { UserSummary } from '@/lib/api-types';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5099';

/**
 * Resolves the signed-in user server-side on every dashboard load. Middleware
 * only checks that a cookie exists; this confirms the token is still accepted
 * by the API, so a revoked or expired session lands back on the login page
 * instead of rendering a shell that then fails every request.
 */
async function loadUser(): Promise<UserSummary | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return response.ok ? ((await response.json()) as UserSummary) : null;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await loadUser();
  if (!user) redirect('/admin/login');

  return <AdminShell user={user}>{children}</AdminShell>;
}
