export const commonIgnores: string[] = [
  '**/*.md/*.ts', // Markdown-embedded TS has no owning tsconfig, so the project service cannot type it.
  '**/dist/**',
  '**/dist-ssr/**',
  '**/coverage/**',
  '**/lib/**',
  '**/local/**',
  '**/output/**',
  '**/tmp/**',
  '*.min.*',
  '*.d.ts',
  'CHANGELOG*',
  'LICENSE*',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];
