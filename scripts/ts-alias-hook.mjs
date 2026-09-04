import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Lets plain `node` load the app's TypeScript data modules, so build scripts can
 * import the same source the site renders instead of duplicating content.
 * Node 26 strips the types itself; this only fixes module resolution.
 *
 * Handles both import styles used in src/:
 *   - the `@/*` -> `src/*` alias from tsconfig.json
 *   - extensionless relative specifiers (`./site`), which TypeScript allows
 *     but Node's ESM resolver does not.
 */
const srcRoot = path.join(process.cwd(), 'src');

/** First existing file among the usual TypeScript resolution candidates. */
function probe(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const found = probe(path.join(srcRoot, specifier.slice(2)));
      if (!found) throw new Error(`ts-alias-hook: cannot resolve "${specifier}" under src/`);
      return { url: pathToFileURL(found).href, shortCircuit: true };
    }

    // Relative import with no extension, resolved against the importing file.
    if (specifier.startsWith('.') && !path.extname(specifier) && context.parentURL) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const found = probe(path.resolve(parentDir, specifier));
      if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
    }

    return nextResolve(specifier, context);
  },
});
