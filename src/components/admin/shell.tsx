'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserSummary } from '@/lib/api-types';
import { Badge } from '@/components/admin/ui';

const nav = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/posts', label: 'Blog' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/content', label: 'Page content' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/resume', label: 'Resume' },
  { href: '/admin/users', label: 'Accounts', adminOnly: true },
  { href: '/admin/audit', label: 'Activity' },
];

export function AdminShell({ user, children }: { user: UserSummary; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Editors never see the accounts link; the API enforces the same rule, so
  // hiding it is a usability choice rather than the access control itself.
  const items = nav.filter((item) => !item.adminOnly || user.role === 'Admin');

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border px-3 py-5 lg:flex">
          <Link href="/admin" className="px-2.5 pb-5">
            <span className="text-xs uppercase tracking-[0.2em] text-gold">mahsahassani.dev</span>
            <span className="mt-0.5 block text-sm text-foreground">Dashboard</span>
          </Link>

          <nav className="flex-1 space-y-0.5">
            {items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block rounded-md px-2.5 py-2 text-sm transition-colors',
                    active ? 'bg-gold/10 text-gold' : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border pt-4">
            <div className="px-2.5">
              <p className="truncate text-sm text-foreground">{user.displayName}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone={user.role === 'Admin' ? 'gold' : 'neutral'}>{user.role}</Badge>
              </div>
            </div>
            <div className="mt-3 space-y-0.5">
              <Link
                href="/admin/users/password"
                className="block rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Change password
              </Link>
              <button
                onClick={signOut}
                className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
              <Link
                href="/"
                target="_blank"
                className="block rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                View site
              </Link>
            </div>
          </div>
        </aside>

        {/* Horizontal nav takes over below the sidebar breakpoint. */}
        <div className="min-w-0 flex-1">
          <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-xs',
                  (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                    ? 'bg-gold/10 text-gold'
                    : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
