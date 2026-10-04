'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, api } from '@/lib/admin-fetch';
import { Banner, Button, Field, Input, Panel } from '@/components/admin/ui';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setBanner(null);

    // Checked here rather than server-side: the API has no reason to know about
    // a confirmation field that exists only to catch typing mistakes.
    if (next !== confirmValue) {
      setErrors({ confirm: 'The two new passwords do not match.' });
      return;
    }

    setBusy(true);

    try {
      await api('auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });

      // Changing the password bumps the token version, so this session's cookie
      // is now stale — sign out cleanly rather than let the next call 401.
      await fetch('/api/admin/logout', { method: 'POST' });
      router.replace('/admin/login');
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        const currentError = error.fieldError('currentPassword');
        const newError = error.fieldError('newPassword');
        if (currentError) mapped.current = currentError;
        if (newError) mapped.next = newError;
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) setBanner({ kind: 'error', text: error.message });
      } else {
        setBanner({ kind: 'error', text: 'Could not change the password.' });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-lg font-medium">Change password</h1>

      {banner && (
        <div className="mb-4">
          <Banner kind={banner.kind}>{banner.text}</Banner>
        </div>
      )}

      <Panel>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Current password" required error={errors.current}>
            <Input
              type="password"
              value={current}
              invalid={Boolean(errors.current)}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>

          <Field label="New password" required error={errors.next} hint="At least 12 characters.">
            <Input
              type="password"
              value={next}
              invalid={Boolean(errors.next)}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>

          <Field label="Confirm new password" required error={errors.confirm}>
            <Input
              type="password"
              value={confirmValue}
              invalid={Boolean(errors.confirm)}
              onChange={(e) => setConfirmValue(e.target.value)}
              autoComplete="new-password"
              required
            />
          </Field>

          <p className="text-xs text-muted-foreground">
            Changing your password signs out every device, including this one.
          </p>

          <Button type="submit" disabled={busy}>
            {busy ? 'Saving...' : 'Change password'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
