'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, api, get, upload } from '@/lib/admin-fetch';
import type { ApiResumeVersion } from '@/lib/api-types';
import { Badge, Banner, Button, EmptyState, Panel } from '@/components/admin/ui';
import { useConfirm } from '@/components/admin/confirm-dialog';
import { assetUrl } from '@/components/admin/media-picker';

const humanSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

export default function ResumePage() {
  const [versions, setVersions] = useState<ApiResumeVersion[] | null>(null);
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirm();

  async function load() {
    try {
      setVersions(await get<ApiResumeVersion[]>('resume/versions'));
    } catch {
      setVersions([]);
      setBanner({ kind: 'error', text: 'Could not load resume versions.' });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setBanner(null);

    const form = new FormData();
    form.append('file', file);
    if (note.trim()) form.append('note', note.trim());

    try {
      await upload<ApiResumeVersion>('resume', form);
      setBanner({ kind: 'success', text: 'Uploaded. The download button now serves this file.' });
      setNote('');
      await load();
    } catch (error) {
      setBanner({ kind: 'error', text: error instanceof ApiError ? error.message : 'Upload failed.' });
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function restore(version: ApiResumeVersion) {
    const ok = await confirm('Make this the current resume?', {
      detail: `Visitors will download the file from ${new Date(
        version.uploadedAtUtc,
      ).toLocaleDateString()} instead of the current one.`,
      confirmLabel: 'Make current',
    });
    if (!ok) return;

    try {
      await api(`resume/versions/${version.id}/restore`, { method: 'POST' });
      setBanner({ kind: 'success', text: 'Restored.' });
      await load();
    } catch {
      setBanner({ kind: 'error', text: 'Could not restore that version.' });
    }
  }

  return (
    <>
      {dialog}
      <div className="mb-6">
        <h1 className="text-lg font-medium">Resume</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          The public download button always serves the current version. The five most recent replaced
          versions are kept.
        </p>
      </div>

      {banner && (
        <div className="mb-4">
          <Banner kind={banner.kind}>{banner.text}</Banner>
        </div>
      )}

      <Panel title="Upload a new version" className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Note (optional)
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. added TaskFlow"
              className="w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold/50"
            />
          </label>

          <label className="inline-flex cursor-pointer items-center rounded-md bg-gold/90 px-3.5 py-2 text-sm font-medium text-black hover:bg-gold">
            {busy ? 'Uploading...' : 'Choose PDF'}
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={busy}
              onChange={onFile}
            />
          </label>
        </div>
      </Panel>

      <Panel title="Versions">
        {versions === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : versions.length === 0 ? (
          <EmptyState
            title="No resume uploaded"
            hint="Until one is uploaded, the public download button stays hidden."
          />
        ) : (
          <ul className="divide-y divide-border">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      {new Date(v.uploadedAtUtc).toLocaleString()}
                    </span>
                    {v.isCurrent && <Badge tone="green">Current</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {humanSize(v.sizeBytes)}
                    {v.note && ` · ${v.note}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={assetUrl(v.publicPath)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Open
                  </a>
                  {!v.isCurrent && (
                    <Button variant="ghost" onClick={() => restore(v)}>
                      Make current
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
