import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

/**
 * ESLint 9 flat config. eslint-config-next 15 still ships eslintrc presets, so
 * FlatCompat adapts `next/core-web-vitals` — the same rules the old
 * .eslintrc.json extended.
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: ['.next/**', '.next-*/**', 'out/**', 'node_modules/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
];

export default config;
