'use client';

import { useEffect, useState } from 'react';
import { ApiError, api, del, get, post, put } from '@/lib/admin-fetch';
import type { ApiProject } from '@/lib/api-types';
import { Badge, Banner, Button, EmptyState, Field, Input, Panel, PersianField, Textarea } from '@/components/admin/ui';
import { useConfirm } from '@/components/admin/confirm-dialog';
import { MediaPicker } from '@/components/admin/media-picker';

const blank = {
  name: '',
  slug: '',
  tagline: '',
  summary: '',
  repoName: '',
  demoUrl: '',
  techTags: '',
  year: String(new Date().getFullYear()),
  featured: false,
  mediaAlt: '',
  videoPath: '',
  posterPath: '',
  taglineFa: '',
  summaryFa: '',
};

type Draft = typeof blank;

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[] | null>(null);
  const [editing, setEditing] = useState<ApiProject | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { confirm, dialog } = useConfirm();

  async function load() {
    try {
      setProjects(await get<ApiProject[]>('projects'));
    } catch {
      setProjects([]);
      setBanner({ kind: 'error', text: 'Could not load projects.' });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(p: ApiProject) {
    setEditing(p);
    setDraft({
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      summary: p.summary,
      repoName: p.repoName,
      demoUrl: p.demoUrl ?? '',
      taglineFa: p.taglineFa ?? '',
      summaryFa: p.summaryFa ?? '',
      techTags: p.tech.join(', '),
      year: p.year,
      featured: p.featured,
      mediaAlt: p.mediaAlt,
      videoPath: p.videoPath ?? '',
      posterPath: p.posterPath ?? '',
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
      demoUrl: draft.demoUrl || null,
      taglineFa: draft.taglineFa || null,
      summaryFa: draft.summaryFa || null,
      videoPath: draft.videoPath || null,
      posterPath: draft.posterPath || null,
    };

    try {
      if (editing === 'new') await post<ApiProject>('projects', payload);
      else if (editing) await put<ApiProject>(`projects/${editing.id}`, payload);

      setEditing(null);
      setBanner({ kind: 'success', text: 'Saved.' });
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const f of ['name', 'slug', 'tagline', 'summary', 'repoName', 'demoUrl', 'year', 'mediaAlt']) {
          const m = error.fieldError(f);
          if (m) mapped[f] = m;
        }
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) setBanner({ kind: 'error', text: error.message });
      } else {
        setBanner({ kind: 'error', text: 'Save failed.' });
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: ApiProject) {
    const ok = await confirm(`Delete "${p.name}"?`, {
      detail: 'The case-study page and its card disappear from the site. Uploaded media is kept in the library.',
    });
    if (!ok) return;

    try {
      await del(`projects/${p.id}`);
      await load();
      setBanner({ kind: 'success', text: `Deleted "${p.name}".` });
    } catch {
      setBanner({ kind: 'error', text: 'Delete failed.' });
    }
  }

  /** Moves one entry and immediately persists the whole order. */
  async function move(index: number, direction: -1 | 1) {
    if (!projects) return;
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;

    const next = [...projects];
    [next[index], next[target]] = [next[target], next[index]];
    setProjects(next);

    try {
      await put('projects/reorder', { orderedIds: next.map((p) => p.id) });
    } catch {
      setBanner({ kind: 'error', text: 'Could not save the new order.' });
      await load();
    }
  }

  async function generatePoster(p: ApiProject) {
    try {
      await api(`projects/${p.id}/generate-poster`, { method: 'POST' });
      setBanner({ kind: 'success', text: 'Poster generated from the video.' });
      await load();
    } catch (error) {
      // ffmpeg missing returns 503 with an explanation; show it as-is.
      setBanner({ kind: 'error', text: error instanceof ApiError ? error.message : 'Poster generation failed.' });
    }
  }

  if (editing) {
    const isNew = editing === 'new';
    return (
      <>
        {dialog}
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-medium">{isNew ? 'New project' : 'Edit project'}</h1>
            <Button variant="ghost" onClick={() => setEditing(null)}>Back</Button>
          </div>

          {banner && <div className="mb-4"><Banner kind={banner.kind}>{banner.text}</Banner></div>}

          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={errors.name}>
                <Input
                  value={draft.name}
                  invalid={Boolean(errors.name)}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      name,
                      slug: d.slug === slugify(d.name) || d.slug === '' ? slugify(name) : d.slug,
                    }));
                  }}
                  required
                />
              </Field>

              <Field label="Slug" required error={errors.slug} hint="Used in the case-study URL.">
                <Input
                  value={draft.slug}
                  invalid={Boolean(errors.slug)}
                  onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <Field label="Tagline" required error={errors.tagline}>
              <Input
                value={draft.tagline}
                invalid={Boolean(errors.tagline)}
                onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
                required
              />
            </Field>

            <PersianField
              label="Tagline"
              value={draft.taglineFa}
              onChange={(v) => setDraft((d) => ({ ...d, taglineFa: v }))}
            />

            <Field label="Summary" required error={errors.summary} hint="Shown on the card and at the top of the case study.">
              <Textarea
                rows={4}
                value={draft.summary}
                invalid={Boolean(errors.summary)}
                onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                required
              />
            </Field>

            <PersianField
              label="Summary"
              multiline
              rows={4}
              value={draft.summaryFa}
              onChange={(v) => setDraft((d) => ({ ...d, summaryFa: v }))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="GitHub repo name"
                required
                error={errors.repoName}
                hint="Repository name only — live stats resolve against it."
              >
                <Input
                  value={draft.repoName}
                  invalid={Boolean(errors.repoName)}
                  onChange={(e) => setDraft((d) => ({ ...d, repoName: e.target.value }))}
                  required
                />
              </Field>

              <Field label="Year" error={errors.year}>
                <Input
                  value={draft.year}
                  invalid={Boolean(errors.year)}
                  onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}
                />
              </Field>
            </div>

            <Field
              label="Demo URL"
              error={errors.demoUrl}
              hint="Leave empty when nothing is deployed — the demo button then stays hidden."
            >
              <Input
                type="url"
                value={draft.demoUrl}
                invalid={Boolean(errors.demoUrl)}
                onChange={(e) => setDraft((d) => ({ ...d, demoUrl: e.target.value }))}
              />
            </Field>

            <Field label="Tech tags" hint="Comma separated. These drive the homepage filter bar.">
              <Input value={draft.techTags} onChange={(e) => setDraft((d) => ({ ...d, techTags: e.target.value }))} />
            </Field>

            <Field label="Demo video" hint="mp4 or webm. The card falls back to the poster when empty.">
              <MediaPicker
                kind="Video"
                value={draft.videoPath}
                onChange={(path) => setDraft((d) => ({ ...d, videoPath: path ?? '' }))}
              />
            </Field>

            <Field label="Poster image" hint="Used as the still frame and as the fallback when there is no video.">
              <MediaPicker
                kind="Image"
                value={draft.posterPath}
                onChange={(path) => setDraft((d) => ({ ...d, posterPath: path ?? '' }))}
              />
            </Field>

            <Field label="Media alt text" error={errors.mediaAlt}>
              <Input
                value={draft.mediaAlt}
                invalid={Boolean(errors.mediaAlt)}
                onChange={(e) => setDraft((d) => ({ ...d, mediaAlt: e.target.value }))}
              />
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                className="size-4 accent-[#c9a227]"
              />
              Featured
            </label>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
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
          <h1 className="text-lg font-medium">Projects</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Order here is the order on the homepage.</p>
        </div>
        <Button
          onClick={() => { setEditing('new'); setDraft(blank); setErrors({}); }}
          className="shrink-0 whitespace-nowrap"
        >
          New project
        </Button>
      </div>

      {banner && <div className="mb-4"><Banner kind={banner.kind}>{banner.text}</Banner></div>}

      <Panel>
        {projects === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : projects.length === 0 ? (
          <EmptyState title="No projects yet" hint="Add one to see it on the homepage." />
        ) : (
          <ul className="divide-y divide-border">
            {projects.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex shrink-0 flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${p.name} up`}
                    className="px-1 text-xs text-muted-foreground hover:text-gold disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === projects.length - 1}
                    aria-label={`Move ${p.name} down`}
                    className="px-1 text-xs text-muted-foreground hover:text-gold disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm text-foreground">{p.name}</span>
                    {p.featured && <Badge tone="gold">Featured</Badge>}
                    {!p.videoPath && !p.posterPath && <Badge tone="muted">No media</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    /{p.slug} · {p.repoName}
                    {p.tech.length > 0 && ` · ${p.tech.join(', ')}`}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {p.videoPath && !p.posterPath && (
                    <Button variant="ghost" onClick={() => generatePoster(p)}>Poster</Button>
                  )}
                  <Button variant="ghost" onClick={() => startEdit(p)}>Edit</Button>
                  <Button variant="danger" onClick={() => remove(p)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
