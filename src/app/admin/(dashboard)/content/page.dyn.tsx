'use client';

import { useEffect, useState } from 'react';
import { ApiError, del, get, post, put } from '@/lib/admin-fetch';
import type { ApiSkill, ApiTestimonial, ApiTimelineEntry } from '@/lib/api-types';
import { Badge, Banner, Button, EmptyState, Field, Input, Panel, PersianField, Select, Textarea } from '@/components/admin/ui';
import { useConfirm } from '@/components/admin/confirm-dialog';

type Tab = 'settings' | 'skills' | 'timeline' | 'testimonials';

const tabs: { id: Tab; label: string }[] = [
  { id: 'settings', label: 'About & contact' },
  { id: 'skills', label: 'Skills' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'testimonials', label: 'Testimonials' },
];

/**
 * Settings are free-form key/value pairs so new copy does not need a migration.
 * These are the keys the public site reads; anything else is ignored by it but
 * still stored.
 */
const settingFields: { key: string; label: string; multiline?: boolean; hint?: string; translatable?: boolean }[] = [
  { key: 'hero.headline', label: 'Hero headline', multiline: true, hint: 'One line per row. The last row gets the gold accent.', translatable: true },
  { key: 'hero.intro', label: 'Hero intro', multiline: true, hint: 'Wrap a phrase in **stars** to highlight it.', translatable: true },
  { key: 'about.headline', label: 'About headline', translatable: true },
  { key: 'about.body', label: 'About body', multiline: true, translatable: true },
  { key: 'contact.email', label: 'Contact email' },
  { key: 'contact.phone', label: 'Phone', hint: 'Shown on the resume. Leave blank to omit it.' },
  { key: 'contact.location', label: 'Location', translatable: true },
  { key: 'contact.availability', label: 'Availability line', hint: 'Shown in the hero badge and footer.', translatable: true },
  { key: 'social.github', label: 'GitHub URL' },
  { key: 'social.linkedin', label: 'LinkedIn URL' },
];

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('settings');
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const { confirm, dialog } = useConfirm();

  return (
    <>
      {dialog}
      <div className="mb-6">
        <h1 className="text-lg font-medium">Page content</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Everything on the site outside the blog and project pages.
        </p>
      </div>

      <div className="mb-5 flex gap-1.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setBanner(null);
            }}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              tab === t.id
                ? 'border-gold/40 text-gold'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {banner && (
        <div className="mb-4">
          <Banner kind={banner.kind}>{banner.text}</Banner>
        </div>
      )}

      {tab === 'settings' && <SettingsTab onResult={setBanner} />}
      {tab === 'skills' && <SkillsTab onResult={setBanner} confirm={confirm} />}
      {tab === 'timeline' && <TimelineTab onResult={setBanner} confirm={confirm} />}
      {tab === 'testimonials' && <TestimonialsTab onResult={setBanner} confirm={confirm} />}
    </>
  );
}

type Notify = (b: { kind: 'error' | 'success'; text: string } | null) => void;
type Confirm = (message: string, options?: { detail?: string; confirmLabel?: string }) => Promise<boolean>;

function SettingsTab({ onResult }: { onResult: Notify }) {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setValues(await get<Record<string, string>>('content/settings'));
      } catch {
        setValues({});
        onResult({ kind: 'error', text: 'Could not load settings.' });
      }
    })();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!values) return;

    setBusy(true);
    try {
      await put('content/settings', { values });
      onResult({ kind: 'success', text: 'Saved.' });
    } catch (error) {
      onResult({ kind: 'error', text: error instanceof ApiError ? error.message : 'Save failed.' });
    } finally {
      setBusy(false);
    }
  }

  if (values === null) return <Panel><p className="py-6 text-center text-sm text-muted-foreground">Loading...</p></Panel>;

  return (
    <Panel>
      <form onSubmit={save} className="space-y-4">
        {settingFields.map((field) => (
          <Field key={field.key} label={field.label} hint={field.hint}>
            {field.multiline ? (
              <Textarea
                rows={5}
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v!, [field.key]: e.target.value }))}
              />
            ) : (
              <Input
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v!, [field.key]: e.target.value }))}
              />
            )}
          </Field>
        ))}

        {/*
          Persian copy lives under a `.fa` suffixed key rather than a parallel
          column: settings are already key/value, so this needs no migration.
        */}
        {settingFields
          .filter((field) => field.translatable)
          .map((field) => (
            <PersianField
              key={`${field.key}.fa`}
              label={field.label}
              multiline={field.multiline}
              rows={5}
              value={values[`${field.key}.fa`] ?? ''}
              onChange={(v) => setValues((current) => ({ ...current!, [`${field.key}.fa`]: v }))}
            />
          ))}

        <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
      </form>
    </Panel>
  );
}

const blankSkill = { groupName: '', groupOrder: 0, groupBlurb: '', name: '', iconKey: '', level: 80, note: '', groupNameFa: '', groupBlurbFa: '', noteFa: '' };

function SkillsTab({ onResult, confirm }: { onResult: Notify; confirm: Confirm }) {
  const [skills, setSkills] = useState<ApiSkill[] | null>(null);
  const [draft, setDraft] = useState(blankSkill);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    try {
      setSkills(await get<ApiSkill[]>('content/skills'));
    } catch {
      setSkills([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    try {
      if (editingId) await put(`content/skills/${editingId}`, draft);
      else await post('content/skills', draft);

      setDraft(blankSkill);
      setEditingId(null);
      onResult({ kind: 'success', text: 'Saved.' });
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const f of ['groupName', 'name', 'iconKey', 'level', 'note']) {
          const m = error.fieldError(f);
          if (m) mapped[f] = m;
        }
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) onResult({ kind: 'error', text: error.message });
      }
    }
  }

  async function remove(skill: ApiSkill) {
    if (!(await confirm(`Remove ${skill.name}?`))) return;
    await del(`content/skills/${skill.id}`);
    await load();
    onResult({ kind: 'success', text: 'Removed.' });
  }

  return (
    <div className="space-y-5">
      <Panel title={editingId ? 'Edit skill' : 'Add skill'}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Group" required error={errors.groupName} hint="e.g. Back end">
            <Input
              value={draft.groupName}
              invalid={Boolean(errors.groupName)}
              onChange={(e) => setDraft((d) => ({ ...d, groupName: e.target.value }))}
              required
            />
          </Field>

          <Field label="Group blurb" hint="Subheading for the whole group.">
            <Input
              value={draft.groupBlurb}
              onChange={(e) => setDraft((d) => ({ ...d, groupBlurb: e.target.value }))}
            />
          </Field>

          <Field label="Group order" hint="Lower groups appear first.">
            <Input
              type="number"
              value={draft.groupOrder}
              onChange={(e) => setDraft((d) => ({ ...d, groupOrder: Number(e.target.value) }))}
            />
          </Field>

          <Field label="Name" required error={errors.name}>
            <Input
              value={draft.name}
              invalid={Boolean(errors.name)}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              required
            />
          </Field>

          <Field label="Icon key" required error={errors.iconKey} hint="Matches the site's icon map, e.g. dotnet.">
            <Input
              value={draft.iconKey}
              invalid={Boolean(errors.iconKey)}
              onChange={(e) => setDraft((d) => ({ ...d, iconKey: e.target.value }))}
              required
            />
          </Field>

          <Field label="Level" error={errors.level} hint="0-100. Drives the meter bar only.">
            <Input
              type="number"
              min={0}
              max={100}
              value={draft.level}
              invalid={Boolean(errors.level)}
              onChange={(e) => setDraft((d) => ({ ...d, level: Number(e.target.value) }))}
            />
          </Field>

          <Field label="Note" error={errors.note}>
            <Input
              value={draft.note}
              invalid={Boolean(errors.note)}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            />
          </Field>

          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <PersianField
              label="Group"
              value={draft.groupNameFa}
              onChange={(v) => setDraft((d) => ({ ...d, groupNameFa: v }))}
            />
            <PersianField
              label="Group blurb"
              value={draft.groupBlurbFa}
              onChange={(v) => setDraft((d) => ({ ...d, groupBlurbFa: v }))}
            />
            <PersianField
              label="Note"
              value={draft.noteFa}
              onChange={(v) => setDraft((d) => ({ ...d, noteFa: v }))}
            />
          </div>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{editingId ? 'Save changes' : 'Add skill'}</Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setDraft(blankSkill);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Panel>

      <Panel title="Skills">
        {skills === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
        ) : skills.length === 0 ? (
          <EmptyState title="No skills yet" hint="The skills section stays hidden until you add some." />
        ) : (
          <ul className="divide-y divide-border">
            {skills.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{s.name}</span>
                    <Badge tone="muted">{s.groupName}</Badge>
                    <span className="text-xs text-muted-foreground">{s.level}%</span>
                  </div>
                  {s.note && <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.note}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(s.id);
                      setDraft({
                        groupName: s.groupName,
                        groupOrder: s.groupOrder,
                        groupBlurb: s.groupBlurb,
                        groupNameFa: s.groupNameFa ?? '',
                        groupBlurbFa: s.groupBlurbFa ?? '',
                        noteFa: s.noteFa ?? '',
                        name: s.name,
                        iconKey: s.iconKey,
                        level: s.level,
                        note: s.note,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => remove(s)}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

const blankTimeline = { period: '', kind: 'work', title: '', organisation: '', description: '', points: '', tags: '', verified: false, periodFa: '', titleFa: '', organisationFa: '', descriptionFa: '' };

function TimelineTab({ onResult, confirm }: { onResult: Notify; confirm: Confirm }) {
  const [entries, setEntries] = useState<ApiTimelineEntry[] | null>(null);
  const [draft, setDraft] = useState(blankTimeline);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    try {
      setEntries(await get<ApiTimelineEntry[]>('content/timeline'));
    } catch {
      setEntries([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    try {
      if (editingId) await put(`content/timeline/${editingId}`, draft);
      else await post('content/timeline', draft);

      setDraft(blankTimeline);
      setEditingId(null);
      onResult({ kind: 'success', text: 'Saved.' });
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const f of ['period', 'title', 'organisation', 'description']) {
          const m = error.fieldError(f);
          if (m) mapped[f] = m;
        }
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) onResult({ kind: 'error', text: error.message });
      }
    }
  }

  async function remove(entry: ApiTimelineEntry) {
    if (!(await confirm(`Delete "${entry.title}"?`))) return;
    await del(`content/timeline/${entry.id}`);
    await load();
    onResult({ kind: 'success', text: 'Deleted.' });
  }

  return (
    <div className="space-y-5">
      <Panel title={editingId ? 'Edit entry' : 'Add entry'}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Period" required error={errors.period} hint="e.g. 2025 — Present">
            <Input
              value={draft.period}
              invalid={Boolean(errors.period)}
              onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value }))}
              required
            />
          </Field>

          <Field label="Title" required error={errors.title}>
            <Input
              value={draft.title}
              invalid={Boolean(errors.title)}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              required
            />
          </Field>

          <Field
            label="Organisation"
            error={errors.organisation}
            hint="Institution or issuer. Leave blank rather than guessing."
          >
            <Input
              value={draft.organisation}
              invalid={Boolean(errors.organisation)}
              onChange={(e) => setDraft((d) => ({ ...d, organisation: e.target.value }))}
            />
          </Field>

          <Field label="Kind" hint="Selects the icon on the public timeline.">
            <Select value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value }))}>
              <option value="work">Work</option>
              <option value="education">Education</option>
              <option value="certification">Certification</option>
              <option value="project">Project</option>
              <option value="milestone">Milestone</option>
            </Select>
          </Field>

          <Field label="Tags" hint="Comma separated.">
            <Input value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Bullet points" hint="One per line.">
              <Textarea
                rows={4}
                value={draft.points}
                onChange={(e) => setDraft((d) => ({ ...d, points: e.target.value }))}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Description" error={errors.description}>
              <Textarea
                rows={3}
                value={draft.description}
                invalid={Boolean(errors.description)}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </Field>
          </div>

          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <PersianField label="Period" value={draft.periodFa}
              onChange={(v) => setDraft((d) => ({ ...d, periodFa: v }))} />
            <PersianField label="Title" value={draft.titleFa}
              onChange={(v) => setDraft((d) => ({ ...d, titleFa: v }))} />
            <PersianField label="Organisation" value={draft.organisationFa}
              onChange={(v) => setDraft((d) => ({ ...d, organisationFa: v }))} />
            <PersianField label="Description" multiline value={draft.descriptionFa}
              onChange={(v) => setDraft((d) => ({ ...d, descriptionFa: v }))} />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.verified}
              onChange={(e) => setDraft((d) => ({ ...d, verified: e.target.checked }))}
              className="size-4 accent-[#c9a227]"
            />
            Verified — unverified entries are hidden from the public timeline and the resume PDF
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{editingId ? 'Save changes' : 'Add entry'}</Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setDraft(blankTimeline);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Panel>

      <Panel title="Timeline">
        {entries === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
        ) : entries.length === 0 ? (
          <EmptyState title="No entries yet" />
        ) : (
          <ul className="divide-y divide-border">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-foreground">{e.title}</span>
                    <Badge tone="muted">{e.period}</Badge>
                    {e.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="muted">Unverified</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.organisation}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(e.id);
                      setDraft({
                        period: e.period,
                        kind: e.kind,
                        title: e.title,
                        organisation: e.organisation,
                        description: e.description,
                        points: e.points.join('\n'),
                        tags: e.tags.join(', '),
                        verified: e.verified,
                        periodFa: e.periodFa ?? '',
                        titleFa: e.titleFa ?? '',
                        organisationFa: e.organisationFa ?? '',
                        descriptionFa: e.descriptionFa ?? '',
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => remove(e)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

const blankTestimonial = { quote: '', name: '', role: '', initials: '', sourceUrl: '', published: false, quoteFa: '', roleFa: '' };

function TestimonialsTab({ onResult, confirm }: { onResult: Notify; confirm: Confirm }) {
  const [items, setItems] = useState<ApiTestimonial[] | null>(null);
  const [draft, setDraft] = useState(blankTestimonial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    try {
      setItems(await get<ApiTestimonial[]>('content/testimonials/all'));
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const payload = {
      ...draft,
      sourceUrl: draft.sourceUrl || null,
      quoteFa: draft.quoteFa || null,
      roleFa: draft.roleFa || null,
    };

    try {
      if (editingId) await put(`content/testimonials/${editingId}`, payload);
      else await post('content/testimonials', payload);

      setDraft(blankTestimonial);
      setEditingId(null);
      onResult({ kind: 'success', text: 'Saved.' });
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const f of ['quote', 'name', 'role', 'initials', 'sourceUrl']) {
          const m = error.fieldError(f);
          if (m) mapped[f] = m;
        }
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) onResult({ kind: 'error', text: error.message });
      }
    }
  }

  async function remove(item: ApiTestimonial) {
    if (!(await confirm(`Delete the testimonial from ${item.name}?`))) return;
    await del(`content/testimonials/${item.id}`);
    await load();
    onResult({ kind: 'success', text: 'Deleted.' });
  }

  return (
    <div className="space-y-5">
      <Panel title={editingId ? 'Edit testimonial' : 'Add testimonial'}>
        <p className="mb-4 text-xs text-muted-foreground">
          Only publish quotes you have permission to attribute. The section stays hidden while nothing
          is published.
        </p>

        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Quote" required error={errors.quote}>
              <Textarea
                rows={3}
                value={draft.quote}
                invalid={Boolean(errors.quote)}
                onChange={(e) => setDraft((d) => ({ ...d, quote: e.target.value }))}
                required
              />
            </Field>
          </div>

          <Field label="Name" required error={errors.name}>
            <Input
              value={draft.name}
              invalid={Boolean(errors.name)}
              onChange={(e) => {
                const name = e.target.value;
                const auto = name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase();
                setDraft((d) => ({ ...d, name, initials: d.initials === '' ? auto : d.initials }));
              }}
              required
            />
          </Field>

          <Field label="Role" required error={errors.role} hint="Title and company.">
            <Input
              value={draft.role}
              invalid={Boolean(errors.role)}
              onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
              required
            />
          </Field>

          <Field label="Initials" required error={errors.initials}>
            <Input
              maxLength={3}
              value={draft.initials}
              invalid={Boolean(errors.initials)}
              onChange={(e) => setDraft((d) => ({ ...d, initials: e.target.value }))}
              required
            />
          </Field>

          <Field label="Source URL" error={errors.sourceUrl} hint="Link to the original recommendation.">
            <Input
              type="url"
              value={draft.sourceUrl}
              invalid={Boolean(errors.sourceUrl)}
              onChange={(e) => setDraft((d) => ({ ...d, sourceUrl: e.target.value }))}
            />
          </Field>

          <div className="sm:col-span-2 grid gap-4">
            {/* Only ever a translation the person quoted has approved. */}
            <PersianField label="Quote" multiline value={draft.quoteFa}
              onChange={(v) => setDraft((d) => ({ ...d, quoteFa: v }))} />
            <PersianField label="Role" value={draft.roleFa}
              onChange={(v) => setDraft((d) => ({ ...d, roleFa: v }))} />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
              className="size-4 accent-[#c9a227]"
            />
            Published — visible on the site
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{editingId ? 'Save changes' : 'Add testimonial'}</Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setDraft(blankTestimonial);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Panel>

      <Panel title="Testimonials">
        {items === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <EmptyState
            title="No testimonials yet"
            hint="The section is hidden on the site until a real one is published."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((t) => (
              <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{t.name}</span>
                      <Badge tone={t.published ? 'green' : 'muted'}>
                        {t.published ? 'Published' : 'Hidden'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.role}</p>
                    <p className="mt-1.5 line-clamp-2 text-xs italic text-muted-foreground/80">
                      “{t.quote}”
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(t.id);
                        setDraft({
                          quote: t.quote,
                          name: t.name,
                          role: t.role,
                          initials: t.initials,
                          sourceUrl: t.sourceUrl ?? '',
                          quoteFa: t.quoteFa ?? '',
                          roleFa: t.roleFa ?? '',
                          published: t.published,
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => remove(t)}>Delete</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
