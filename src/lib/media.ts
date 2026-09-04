import fs from 'node:fs';
import path from 'node:path';

/**
 * Resolves a `/media/...` path against ./public at build time and returns it
 * only if the file is actually there.
 *
 * Demo clips are referenced in `projects.ts` before they exist. Without this
 * check the cards render a "Hover for demo" hint and the case study renders a
 * play button that lead nowhere — the same dead-affordance problem as linking a
 * demo URL with no deployment behind it. Drop an .mp4 into public/media and the
 * control appears on the next build, with no data edit required.
 *
 * Server-side only: this reads the filesystem, so never import it into a
 * client component.
 */
export function videoIfPresent(publicPath?: string): string | undefined {
  if (!publicPath) return undefined;
  const onDisk = path.join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
  return fs.existsSync(onDisk) ? publicPath : undefined;
}
