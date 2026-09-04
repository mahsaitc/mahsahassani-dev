'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Banner, Button, Field, Input } from '@/components/admin/ui';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        setError(problem?.detail ?? 'Sign-in failed.');
        return;
      }

      // Full navigation so middleware sees the freshly set cookie.
      router.replace(params.get('next') ?? '/admin');
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">mahsahassani.dev</p>
        <h1 className="mt-2 text-2xl font-medium">Dashboard</h1>
      </div>

      {error && <Banner kind="error">{error}</Banner>}

      <Field label="Email" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          autoFocus
        />
      </Field>

      <Field label="Password" required>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Repeated failures are rate limited for a minute.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
