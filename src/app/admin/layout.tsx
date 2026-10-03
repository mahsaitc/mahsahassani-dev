import type { Metadata } from 'next';
import { DocumentShell } from '@/components/document-shell';

export const metadata: Metadata = {
  title: 'Dashboard',
  // The dashboard must never reach an index, even if a URL leaks.
  robots: { index: false, follow: false },
};

/** The dashboard is English and ltr regardless of the visitor's locale. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <DocumentShell locale="en">{children}</DocumentShell>;
}
