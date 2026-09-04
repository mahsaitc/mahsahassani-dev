import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  // The dashboard must never reach an index, even if a URL leaks.
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
