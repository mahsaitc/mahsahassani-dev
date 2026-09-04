'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, get, upload } from '@/lib/admin-fetch';
import type { ApiMedia, MediaKind, Paged } from '@/lib/api-types';
import { Badge, Button } from '@/components/admin/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5099';

/** Uploaded paths are API-relative; the browser needs the API origin to load them. */
export const assetUrl = (path: string) => (path.startsWith('http') ? path : `${API_BASE}${path}`);

/**
 * Choose an existing upload or add a new one, without leaving the form being
 * edited. Both paths write the same value: the stored public path.
 */
export function MediaPicker({
  kind,
  value,
  onChange,
}: {
  kind: MediaKind;
  value: string;
  onChange: (path: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiMedia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const page = await get<Paged<ApiMedia>>(`media?kind=${kind}&pageSize=60`);
      setItems(page.items);
    } catch {
      setItems([]);
      setError('Could not load the media library.');
    }
  }

  useEffect(() => {
    if (open && items === null) void load();
  }, [open]);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);

    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);

    try {
      const asset = await upload<ApiMedia>('media', form);
      onChange(asset.publicPath);
      setItems((current) => (current ? [asset, ...current] : [asset]));
      setOpen(false);
    } catch (err) {
      // The API's rejection reason is written for display, so show it verbatim.
      setError(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {value ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-black/30 px-2.5 py-2">
            {kind === 'Image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(value)} alt="" className="size-8 shrink-0 rounded object-cover" />
            ) : (
              <Badge tone="neutral">{kind}</Badge>
            )}
            <span className="truncate text-xs text-muted-foreground">{value.split('/').pop()}</span>
          </div>
        ) : (
          <span className="flex-1 text-xs text-muted-foreground">Nothing selected</span>
        )}

        <Button type="button" variant="ghost" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Choose'}
        </Button>

        {value && (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            Clear
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {open && (
        <div className="rounded-md border border-border p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Library</span>
            <label className="cursor-pointer text-xs text-gold hover:underline">
              {busy ? 'Uploading...' : 'Upload new'}
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                disabled={busy}
                accept={kind === 'Image' ? 'image/*' : kind === 'Video' ? 'video/mp4,video/webm' : 'application/pdf'}
                onChange={onFile}
              />
            </label>
          </div>

          {items === null ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nothing uploaded yet. Use “Upload new”.
            </p>
          ) : (
            <ul className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {items.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(asset.publicPath);
                      setOpen(false);
                    }}
                    className="w-full rounded border border-border p-1 text-left hover:border-gold/50"
                  >
                    {asset.kind === 'Image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assetUrl(asset.publicPath)} alt="" className="aspect-video w-full rounded object-cover" />
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded bg-black/40 text-[0.65rem] text-muted-foreground">
                        {asset.kind}
                      </div>
                    )}
                    <span className="mt-1 block truncate text-[0.65rem] text-muted-foreground">
                      {asset.originalFileName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
