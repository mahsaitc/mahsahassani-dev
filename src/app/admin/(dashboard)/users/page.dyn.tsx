'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError, get, post, put } from '@/lib/admin-fetch';
import type { UserRole, UserSummary } from '@/lib/api-types';
import { Badge, Banner, Button, Field, Input, Panel, Select } from '@/components/admin/ui';

const blank = { email: '', displayName: '', password: '', role: 'Editor' as UserRole };

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setUsers(await get<UserSummary[]>('auth/users'));
    } catch (error) {
      setUsers([]);
      // An Editor reaching this page gets a 403 from the API, which is the
      // real enforcement; the nav link is merely hidden for them.
      setBanner({
        kind: 'error',
        text: error instanceof ApiError && error.status === 403
          ? 'Only admins can manage accounts.'
          : 'Could not load accounts.',
      });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setBanner(null);

    try {
      await post<UserSummary>('auth/users', draft);
      setBanner({ kind: 'success', text: `Created ${draft.email}.` });
      setDraft(blank);
      setCreating(false);
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const f of ['email', 'displayName', 'password', 'role']) {
          const m = error.fieldError(f);
          if (m) mapped[f] = m;
        }
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) setBanner({ kind: 'error', text: error.message });
      } else {
        setBanner({ kind: 'error', text: 'Could not create the account.' });
      }
    } finally {
      setBusy(false);
    }
  }

  async function update(user: UserSummary, changes: Partial<Pick<UserSummary, 'role' | 'isActive'>>) {
    try {
      await put(`auth/users/${user.id}`, {
        displayName: user.displayName,
        role: changes.role ?? user.role,
        isActive: changes.isActive ?? user.isActive,
      });
      await load();
    } catch (error) {
      // The API refuses to strip the last admin or deactivate the caller.
      setBanner({
        kind: 'error',
        text: error instanceof ApiError
          ? error.fieldError('role') ?? error.fieldError('isActive') ?? error.message
          : 'Update failed.',
      });
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">Accounts</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Admins manage accounts and content. Editors manage content only.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/admin/users/password"
            className="whitespace-nowrap rounded-md border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Change my password
          </Link>
          <Button onClick={() => setCreating((c) => !c)} className="shrink-0 whitespace-nowrap">
            {creating ? 'Cancel' : 'New account'}
          </Button>
        </div>
      </div>

      {banner && (
        <div className="mb-4">
          <Banner kind={banner.kind}>{banner.text}</Banner>
        </div>
      )}

      {creating && (
        <Panel title="Create account" className="mb-6">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                value={draft.email}
                invalid={Boolean(errors.email)}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                required
              />
            </Field>

            <Field label="Display name" required error={errors.displayName}>
              <Input
                value={draft.displayName}
                invalid={Boolean(errors.displayName)}
                onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                required
              />
            </Field>

            <Field label="Password" required error={errors.password} hint="At least 12 characters.">
              <Input
                type="password"
                value={draft.password}
                invalid={Boolean(errors.password)}
                onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                autoComplete="new-password"
                required
              />
            </Field>

            <Field label="Role" required error={errors.role}>
              <Select
                value={draft.role}
                onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as UserRole }))}
              >
                <option value="Editor">Editor — content only</option>
                <option value="Admin">Admin — content and accounts</option>
              </Select>
            </Field>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>
                {busy ? 'Creating...' : 'Create account'}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        {users === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No accounts to show.</p>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-foreground">{u.displayName}</span>
                    <Badge tone={u.role === 'Admin' ? 'gold' : 'neutral'}>{u.role}</Badge>
                    {!u.isActive && <Badge tone="muted">Disabled</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {u.email}
                    {u.lastLoginAtUtc
                      ? ` · last in ${new Date(u.lastLoginAtUtc).toLocaleDateString()}`
                      : ' · never signed in'}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Select
                    value={u.role}
                    onChange={(e) => update(u, { role: e.target.value as UserRole })}
                    className="w-auto py-1.5 text-xs"
                  >
                    <option value="Editor">Editor</option>
                    <option value="Admin">Admin</option>
                  </Select>
                  <Button variant="ghost" onClick={() => update(u, { isActive: !u.isActive })}>
                    {u.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
