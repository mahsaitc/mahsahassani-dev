'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { navItems, site } from '@/lib/site';
import { useTranslations } from 'next-intl';
import { LanguageToggle } from '@/components/language-toggle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/fx/magnetic';

export function SiteHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const onHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>('');
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24));

  /**
   * Scroll spy via IntersectionObserver rather than scroll math: the browser
   * does the work off the main thread and it stays correct when sections resize.
   */
  useEffect(() => {
    if (!onHome) return;
    // 'hero' is observed but is not a nav item: when it wins, nothing is active.
    const ids = ['hero', ...navItems.map((n) => n.href.slice(1))];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id === 'hero' ? '' : visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [onHome]);

  // Lock the page behind the mobile sheet.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const href = (h: string) => (onHome ? h : `/${h}`);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[75] transition-all duration-500',
          scrolled ? 'py-3' : 'py-5',
        )}
      >
        <div className="container">
          <div
            className={cn(
              'flex items-center justify-between rounded-full px-4 py-2 transition-all duration-500 md:px-5',
              scrolled ? 'glass shadow-lift' : 'border border-transparent',
            )}
          >
            <Link
              href="/"
              className="group flex items-center gap-3"
              aria-label={`${site.name} — home`}
            >
              <span className="relative grid size-9 place-items-center rounded-full border border-gold/40 bg-gold/5 font-display text-sm tracking-[0.08em] text-gold transition-colors duration-500 group-hover:border-gold/80">
                {site.initials}
              </span>
              <span className="hidden text-sm font-medium tracking-wide text-foreground sm:block">
                {site.name}
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label={t('primaryNav')}>
              {navItems.map((item) => {
                const id = item.href.slice(1);
                const isActive = onHome && active === id;
                return (
                  <Link
                    key={item.href}
                    href={href(item.href)}
                    className={cn(
                      'relative rounded-full px-4 py-2 text-sm transition-colors duration-300',
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full border border-gold/25 bg-gold/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <LanguageToggle className="hidden sm:inline-flex" />
              <Magnetic className="hidden md:block">
                <Button asChild size="sm" variant="outline">
                  <a href={site.resumePath} download>
                    {t('resume')}
                    <ArrowUpRight className="rtl:-scale-x-100" />
                  </a>
                </Button>
              </Magnetic>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? t('closeMenu') : t('openMenu')}
                aria-expanded={open}
                className="grid size-10 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-gold/50 lg:hidden"
              >
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[74] bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <nav
              className="container flex h-full flex-col justify-center gap-2"
              aria-label="Mobile"
            >
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                >
                  <Link
                    href={href(item.href)}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border/60 py-5 font-display text-4xl text-foreground transition-colors hover:text-gold"
                  >
                    {t(item.key)}
                  </Link>
                </motion.div>
              ))}
              <motion.a
                href={site.resumePath}
                download
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-gold"
              >
                Download résumé <ArrowUpRight className="size-4" />
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
