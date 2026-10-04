'use client';

import { useEffect, useState } from 'react';
import { ApiError, del, get, post, put } from '@/lib/admin-fetch';
import type { ApiPost, PostStatus } from '@/lib/api-types';
import { Badge, Banner, Button, EmptyState, Field, Input, Panel, PersianField, Select, Textarea } from '@/components/admin/ui';
import { useConfirm } from '@/components/admin/confirm-dialog';
import { MediaPicker } from '@/components/admin/media-picker';

const blank = {
  title: '',
  slug: '',
  excerpt: '',
  bodyMarkdown: '',
  coverImagePath: '',
  tags: '',
  status: 'Draft' as PostStatus,
  titleFa: '',
  excerptFa: '',
  bodyMarkdownFa: '',
};

type Draft = typeof blank;

/** Mirrors the API's slug rule so the field can fill itself as you type a title. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PostsPage() {
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [editing, setEditing] = useState<ApiPost | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  async function load() {
    try {
      setPosts(await get<ApiPost[]>('posts'));
    } catch (error) {
      setBanner({ kind: 'error', text: error instanceof Error ? error.message : 'Could not load posts.' });
      setPosts([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startNew() {
    setEditing('new');
    setDraft(blank);
    setErrors({});
  }

  function startEdit(p: ApiPost) {
    setEditing(p);
    setDraft({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      bodyMarkdown: p.bodyMarkdown,
      coverImagePath: p.coverImagePath ?? '',
      tags: p.tags.join(', '),
      status: p.status,
      titleFa: p.titleFa ?? '',
      excerptFa: p.excerptFa ?? '',
      bodyMarkdownFa: p.bodyMarkdownFa ?? '',
    });
    setErrors({});
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setBanner(null);

    const payload = {
      ...draft,
      coverImagePath: draft.coverImagePath || null,
      titleFa: draft.titleFa || null,
      excerptFa: draft.excerptFa || null,
      bodyMarkdownFa: draft.bodyMarkdownFa || null,
    };

    try {
      if (editing === 'new') {
        await post<ApiPost>('posts', payload);
      } else if (editing) {
        await put<ApiPost>(`posts/${editing.id}`, payload);
      }
      setEditing(null);
      setBanner({ kind: 'success', text: 'Saved.' });
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const field of ['title', 'slug', 'excerpt', 'bodyMarkdown']) {
          const message = error.fieldError(field);
          if (message) mapped[field] = message;
        }
        setErrors(mapped);
        // A failure with no field map (409, 503) still needs to be visible.
        if (Object.keys(mapped).length === 0) setBanner({ kind: 'error', text: error.message });
      } else {
        setBanner({ kind: 'error', text: 'Save failed.' });
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: ApiPost) {
    const ok = await confirm(`Delete "${p.title}"?`, {
      detail: 'This removes the post permanently. Published posts disappear from the blog immediately.',
    });
    if (!ok) return;

    try {
      await del(`posts/${p.id}`);
      setBanner({ kind: 'success', text: `Deleted "${p.title}".` });
      await load();
    } catch (error) {
      setBanner({ kind: 'error', text: error instanceof Error ? error.message : 'Delete failed.' });
    }
  }

  if (editing) {
    const isNew = editing === 'new';
    return (
      <>
        {dialog}
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-medium">{isNew ? 'New post' : 'Edit post'}</h1>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Back
            </Button>
          </div>

          {banner && <div className="mb-4"><Banner kind={banner.kind}>{banner.text}</Banner></div>}

          <form onSubmit={save} className="space-y-4">
            <Field label="Title" required error={errors.title}>
              <Input
                value={draft.title}
                invalid={Boolean(errors.title)}
                onChange={(e) => {
                  const title = e.target.value;
                  // Only auto-fill the slug while it still tracks the title, so a
                  // hand-edited slug is never silently overwritten.
                  setDraft((d) => ({
                    ...d,
                    title,
                    slug: d.slug === slugify(d.title) || d.slug === '' ? slugify(title) : d.slug,
                  }));
                }}
                required
              />
            </Field>

            <Field label="Slug" required error={errors.slug} hint="Lower-case letters, numbers and hyphens.">
              <Input
                value={draft.slug}
                invalid={Boolean(errors.slug)}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                required
              />
            </Field>

            <Field label="Excerpt" error={errors.excerpt} hint="Shown on the blog index. Up to 400 characters.">
              <Textarea
                rows={2}
                value={draft.excerpt}
                invalid={Boolean(errors.excerpt)}
                onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
              />
            </Field>

            <Field label="Content (Markdown)" required error={errors.bodyMarkdown}>
              <Textarea
                rows={18}
                value={draft.bodyMarkdown}
                invalid={Boolean(errors.bodyMarkdown)}
                onChange={(e) => setDraft((d) => ({ ...d, bodyMarkdown: e.target.value }))}
                className="font-mono text-xs leading-relaxed"
                required
              />
            </Field>

            <PersianField
              label="Title"
              value={draft.titleFa}
              onChange={(v) => setDraft((d) => ({ ...d, titleFa: v }))}
            />

            <PersianField
              label="Excerpt"
              multiline
              rows={2}
              value={draft.excerptFa}
              onChange={(v) => setDraft((d) => ({ ...d, excerptFa: v }))}
            />

            {/*
              The English posts carry audited technical claims. A Persian body
              needs the same fact-check before publishing — see PRE-LAUNCH.md.
            */}
            <PersianField
              label="Content (Markdown)"
              multiline
              rows={14}
              value={draft.bodyMarkdownFa}
              onChange={(v) => setDraft((d) => ({ ...d, bodyMarkdownFa: v }))}
            />

            <Field label="Tags" hint="Comma separated.">
              <Input value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} />
            </Field>

            <Field label="Cover image">
              <MediaPicker
                kind="Image"
                value={draft.coverImagePath}
                onChange={(path) => setDraft((d) => ({ ...d, coverImagePath: path ?? '' }))}
              />
            </Field>

            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as PostStatus }))}
              >
                <option value="Draft">Draft — not visible on the site</option>
                <option value="Published">Published — live on the blog</option>
              </Select>
            </Field>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>

              {/* Preview needs a saved post: the key is issued server-side. */}
              {!isNew && editing.previewKey && (
                <a
                  href={`/blog/${editing.slug}?preview=${editing.previewKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-xs text-gold hover:underline"
                >
                  Preview draft →
                </a>
              )}
            </div>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      {dialog}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium">Blog</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {posts ? `${posts.length} post${posts.length === 1 ? '' : 's'}` : 'Loading...'}
          </p>
        </div>
        <Button onClick={startNew} className="shrink-0 whitespace-nowrap">New post</Button>
      </div>

      {banner && <div className="mb-4"><Banner kind={banner.kind}>{banner.text}</Banner></div>}

      <Panel>
        {posts === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : posts.length === 0 ? (
          <EmptyState title="No posts yet" hint="Create your first post to see it here." />
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-foreground">{p.title}</span>
                    <Badge tone={p.status === 'Published' ? 'green' : 'muted'}>{p.status}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    /{p.slug}
                    {p.publishedAtUtc && ` · ${new Date(p.publishedAtUtc).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" onClick={() => startEdit(p)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => remove(p)}>
                    Delete
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
