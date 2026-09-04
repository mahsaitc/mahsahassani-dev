import { Download, Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { site } from '@/lib/site';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/fx/reveal';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/contact-form';

export function Contact({
  email,
  phone,
  location,
  github,
  linkedin,
}: {
  email?: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
} = {}) {
  const contactEmail = email?.trim() || site.email;
  const contactLocation = location?.trim() || site.location;
  const contactPhone = phone?.trim() || site.phone;
  const githubUrl = github?.trim() || site.github.url;
  const linkedinUrl = linkedin?.trim() || site.linkedin.url;

  return (
    <section id="contact" className="section-pad relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[60%] bg-gradient-to-t from-gold/[0.06] to-transparent"
      />

      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Contact"
              title="Tell me what you are building."
              description="Roles, contracts, or an architecture problem that has outgrown a group chat — all welcome."
            />

            <Reveal delay={0.12} className="mt-10 space-y-3">
              <a
                href={`mailto:${contactEmail}`}
                className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors duration-300 hover:border-gold/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-foreground/[0.03] text-gold">
                  <Mail className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </span>
                  <span className="block truncate text-sm text-foreground group-hover:text-gold">
                    {contactEmail}
                  </span>
                </span>
              </a>

              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-gold/40"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-foreground/[0.03] text-gold">
                    <Phone className="size-4" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Phone
                    </span>
                    <span className="block text-sm text-foreground">{contactPhone}</span>
                  </span>
                </a>
              )}

              <div className="flex items-center gap-4 rounded-xl border border-border p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-foreground/[0.03] text-gold">
                  <MapPin className="size-4" />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Based in
                  </span>
                  <span className="block text-sm text-foreground">{contactLocation}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="outline">
                  <a href={site.resumePath} download>
                    <Download />
                    Résumé (PDF)
                  </a>
                </Button>
                <Button asChild variant="ghost">
                  <a href={githubUrl} target="_blank" rel="noreferrer noopener">
                    <Github />
                    GitHub
                  </a>
                </Button>
                <Button asChild variant="ghost">
                  <a href={linkedinUrl} target="_blank" rel="noreferrer noopener">
                    <Linkedin />
                    LinkedIn
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <Card>
              <CardBody className="md:p-9">
                <ContactForm />
              </CardBody>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
