import { DocumentShell } from '@/components/document-shell';
import NotFound from './[locale]/not-found';

/**
 * Last-resort 404 for paths that match no segment at all. The root layout is a
 * pass-through, so this page brings its own document.
 */
export default function RootNotFound() {
  return (
    <DocumentShell locale="en">
      <NotFound />
    </DocumentShell>
  );
}
