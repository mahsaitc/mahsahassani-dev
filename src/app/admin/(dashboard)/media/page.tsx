'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, del, get, upload } from '@/lib/admin-fetch';
import type { ApiMedia, MediaKind, Paged } from '@/lib/api-types';
import { Badge, Banner, Button, EmptyState, Panel } from '@/components/admin/ui';
import { useConfirm } from '@/components/admin/confirm-dialog';
import { assetUrl } from '@/components/admin/media-picker';

const kinds: (MediaKind | 'All')[] = ['All', 'Image', 'Video', 'Document'];

const humanSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

export default function MediaPage() {
  const [items, setItems] = useState<ApiMedia[] | null>(null);
  const [filter, setFilter] = useState<MediaKind | 'All'>('All');
  const [uploadKind, setUploadKind] = useState<MediaKind>('Image');
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirm();

  async function load() {
    try {
      const query = filter === 'All' ? 'media?pageSize=100' : `media?kind=${filter}&pageSize=100`;
      setItems((await get<Paged<ApiMedia>>(query)).items);
    } catch {
      setItems([]);
      setBanner({ kind: 'error', text: 'Could not load the media library.' });
    }
  }

  useEffect(() => {
    void load();
  }, [filter]);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setBanner(null);

    const form = new FormData();
    form.append('file', file);
    form.append('kind', uploadKind);

    try {
      await upload<ApiMedia>('media', form);
      setBanner({ kind: 'success', text: `Uploaded ${file.name}.` });
      await load();
    } catch (error) {
      setBanner({ kind: 'error', text: error instanceof ApiError ? error.message : 'Upload failed.' });
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function remove(asset: ApiMedia) {
    const ok = await confirm(`Delete ${asset.originalFileName}?`, {
      detail: 'The file is removed from disk permanently. Anything still pointing at it will lose its media.',
    });
    if (!ok) return;

    try {
      await del(`media/${asset.id}`);
      setBanner({ kind: 'success', text: 'Deleted.' });
      await load();
    } catch (error) {
      // A 409 names the post or project still using the file.
      setBanner({ kind: 'error', text: error instanceof ApiError ? error.message : 'Delete failed.' });
    }
  }

  return (
    <>
      {dialog}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">Media</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Images up to 5 MB, videos up to 25 MB, PDFs up to 10 MB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={uploadKind}
            onChange={(e) => setUploadKind(e.target.value as MediaKind)}
            className="rounded-md border border-border bg-black/30 px-2.5 py-2 text-sm"
          >
            <option value="Image">Image</option>
            <option value="Video">Video</option>
            <option value="Document">Document</option>
          </select>

          <label className="inline-flex cursor-pointer items-center rounded-md bg-gold/90 px-3.5 py-2 text-sm font-medium text-black hover:bg-gold">
            {busy ? 'Uploading...' : 'Upload'}
            <input ref={fileInput} type="file" className="hidden" disabled={busy} onChange={onFile} />
          </label>
        </div>
      </div>

      {banner && <div className="mb-4"><Banner kind={banner.kind}>{banner.text}</Banner></div>}

      <div className="mb-4 flex gap-1.5">
        {kinds.map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              filter === k ? 'border-gold/40 text-gold' : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <Panel>
        {items === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <EmptyState title="Nothing uploaded yet" hint="Upload images, demo clips or documents to reuse across the site." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-md border border-border">
                {asset.kind === 'Image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(asset.publicPath)} alt="" className="aspect-video w-full object-cover" />
                ) : asset.kind === 'Video' ? (
                  <video src={assetUrl(asset.publicPath)} className="aspect-video w-full bg-black object-cover" muted preload="metadata" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-black/40 text-xs text-muted-foreground">
                    PDF
                  </div>
                )}

                <div className="p-2.5">
                  <p className="truncate text-xs text-foreground" title={asset.originalFileName}>
                    {asset.originalFileName}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[0.65rem] text-muted-foreground">{humanSize(asset.sizeBytes)}</span>
                    <Badge tone="muted">{asset.kind}</Badge>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <a
                      href={assetUrl(asset.publicPath)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded border border-border py-1 text-center text-[0.7rem] text-muted-foreground hover:text-foreground"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => remove(asset)}
                      className="flex-1 rounded border border-red-500/40 py-1 text-[0.7rem] text-red-400 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
