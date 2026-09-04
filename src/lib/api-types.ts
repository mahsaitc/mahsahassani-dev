/**
 * Shapes returned by the MahsaSite API. Kept hand-written rather than generated
 * so the public site can depend on them without a build step, and so the fields
 * the front end actually uses are obvious at a glance.
 */

export type UserRole = 'Admin' | 'Editor';
export type PostStatus = 'Draft' | 'Published';
export type MediaKind = 'Image' | 'Video' | 'Document';

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
}

export interface ApiPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  coverImagePath: string | null;
  tags: string[];
  status: PostStatus;
  publishedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  /** Only present on dashboard reads; withheld from public responses. */
  previewKey: string | null;
  titleFa: string | null;
  excerptFa: string | null;
  bodyMarkdownFa: string | null;
}

export interface ApiProject {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  repoName: string;
  demoUrl: string | null;
  tech: string[];
  year: string;
  featured: boolean;
  sortOrder: number;
  videoPath: string | null;
  posterPath: string | null;
  mediaAlt: string;
  /** Persian override. Null means not written yet — fall back to English. */
  taglineFa: string | null;
  summaryFa: string | null;
}

export interface ApiSkill {
  id: string;
  groupName: string;
  groupOrder: number;
  /** Section subheading, denormalised onto each skill in the group. */
  groupBlurb: string;
  groupNameFa: string | null;
  groupBlurbFa: string | null;
  noteFa: string | null;
  name: string;
  iconKey: string;
  level: number;
  note: string;
  sortOrder: number;
}

export interface ApiTimelineEntry {
  id: string;
  period: string;
  /** Selects the icon on the public timeline. */
  kind: 'work' | 'education' | 'milestone' | 'certification' | 'project';
  title: string;
  organisation: string;
  description: string;
  points: string[];
  tags: string[];
  periodFa: string | null;
  titleFa: string | null;
  organisationFa: string | null;
  descriptionFa: string | null;
  verified: boolean;
  sortOrder: number;
}

export interface ApiTestimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
  sourceUrl: string | null;
  quoteFa: string | null;
  roleFa: string | null;
  published: boolean;
  sortOrder: number;
}

export interface ApiMedia {
  id: string;
  fileName: string;
  originalFileName: string;
  publicPath: string;
  kind: MediaKind;
  contentType: string;
  sizeBytes: number;
  uploadedAtUtc: string;
}

export interface ApiResumeVersion {
  id: string;
  fileName: string;
  publicPath: string;
  sizeBytes: number;
  isCurrent: boolean;
  uploadedAtUtc: string;
  note: string | null;
}

export interface ApiAuditEntry {
  id: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  ipAddress: string | null;
  atUtc: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** ASP.NET ProblemDetails, plus the per-field map that ValidationProblem adds. */
export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

/**
 * Icon keys are free text in the CMS, so the component resolves them against
 * its map and falls back when a key is unknown rather than crashing.
 */
export type IconKeyLike = string;
