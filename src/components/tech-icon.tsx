import type { IconKey } from '@/data/skills';
import {
  SiDotnet,
  SiReact,
  SiTypescript,
  SiNextdotjs,
  SiTailwindcss,
  SiPostgresql,
  SiRedis,
  SiDocker,
  SiGithubactions,
  SiGit,
  SiNginx,
  SiAnthropic,
} from 'react-icons/si';
import { cn } from '@/lib/utils';

type SvgProps = { className?: string };

/**
 * EF Core, SignalR, xUnit and C# have no icon in the simple-icons set, so they
 * get hand-drawn marks. They are stroke-based and inherit currentColor, which
 * keeps them visually consistent with the filled brand glyphs at small sizes.
 */
function EfCoreMark({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.8" />
      <path d="M5 5.5v6c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-6" />
      <path d="M5 11.5v6c0 1.55 3.13 2.8 7 2.8" />
      <path d="M19 13.5v3.2m0 0 2.2 1.3m-2.2-1.3-2.2 1.3" />
      <circle cx="19" cy="17" r="3.2" />
    </svg>
  );
}

function SignalRMark({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4" strokeLinecap="round" />
      <path d="M16.2 16.2a6 6 0 0 0 0-8.4" strokeLinecap="round" />
      <path d="M4.9 4.9a10 10 0 0 0 0 14.2" strokeLinecap="round" />
      <path d="M19.1 19.1a10 10 0 0 0 0-14.2" strokeLinecap="round" />
    </svg>
  );
}

function XUnitMark({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M9 2.8v5.4L4.4 17a2.6 2.6 0 0 0 2.3 3.9h10.6a2.6 2.6 0 0 0 2.3-3.9L15 8.2V2.8" strokeLinejoin="round" />
      <path d="M7.6 2.8h8.8" strokeLinecap="round" />
      <path d="M9.4 15.6l1.9 1.9 3.6-3.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CSharpMark({ className }: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M11.3 8.6a3.6 3.6 0 1 0 0 6.8" strokeLinecap="round" />
      <path d="M14.6 7.4 13.4 16.6M18.2 7.4 17 16.6" strokeLinecap="round" />
      <path d="M13.1 10.4h6M12.6 13.6h6" strokeLinecap="round" />
    </svg>
  );
}

const registry: Record<IconKey, (p: SvgProps) => React.JSX.Element> = {
  dotnet: (p) => <SiDotnet {...p} />,
  csharp: CSharpMark,
  efcore: EfCoreMark,
  signalr: SignalRMark,
  react: (p) => <SiReact {...p} />,
  typescript: (p) => <SiTypescript {...p} />,
  nextjs: (p) => <SiNextdotjs {...p} />,
  tailwind: (p) => <SiTailwindcss {...p} />,
  postgres: (p) => <SiPostgresql {...p} />,
  redis: (p) => <SiRedis {...p} />,
  docker: (p) => <SiDocker {...p} />,
  githubactions: (p) => <SiGithubactions {...p} />,
  git: (p) => <SiGit {...p} />,
  nginx: (p) => <SiNginx {...p} />,
  xunit: XUnitMark,
  openai: (p) => <SiAnthropic {...p} />,
};

/**
 * `name` is widened to string because icon keys are typed by hand in the
 * dashboard. An unrecognised key renders nothing rather than throwing, so a
 * typo costs one missing glyph instead of the whole Skills section.
 */
export function TechIcon({ name, className }: { name: IconKey | (string & {}); className?: string }) {
  const Icon = registry[name as IconKey];
  if (!Icon) return null;
  return <Icon className={cn('size-6', className)} />;
}
