import Link from 'next/link';
import { Github, Linkedin, Mail, ArrowUpRight } from 'lucide-react';
import { site, navItems } from '@/lib/site';
import { loadSiteCopy } from '@/lib/content';

export async function SiteFooter() {
  const year = new Date().getFullYear();
  // Loaded here rather than passed in: the footer renders on every route, and
  // threading contact copy through each page would be the only reason to.
  const copy = await loadSiteCopy();

  return (
    <footer className="relative border-t border-border/60">
      <div className="container py-16">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full border border-gold/40 bg-gold/5 font-display text-sm text-gold">
                {site.initials}
              </span>
              <span className="font-display text-xl text-foreground">{site.name}</span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {site.tagline} Building back ends that hold their shape and front ends that respect
              the people using them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-gold">Navigate</h2>
              <ul className="space-y-2.5">
                {navItems.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={`/${n.href}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-gold">Elsewhere</h2>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href={copy.github}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Github className="size-3.5" /> GitHub
                  </a>
                </li>
                <li>
                  <a
                    href={copy.linkedin}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Linkedin className="size-3.5" /> LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${copy.email}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Mail className="size-3.5" /> Email
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-gold">Status</h2>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald" />
                </span>
                {copy.availability}
              </p>
              <a
                href={site.resumePath}
                download
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-gold transition-opacity hover:opacity-80"
              >
                Download résumé <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 h-px w-full gold-rule" />

        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {site.name}. All rights reserved.
          </p>
          <p className="font-mono">Next.js · TypeScript · Tailwind · Framer Motion</p>
        </div>
      </div>
    </footer>
  );
}
