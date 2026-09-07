export const commonIgnores: string[] = [
  '**/*.md/*.ts', // Markdown-embedded TS has no owning tsconfig, so the project service cannot type it.
  '**/*.sh', // No config parses shell. Publishing the glob is what lets a consumer drop their own copy.
  '**/dist/**',
  '**/dist-ssr/**',
  '**/coverage/**',
  '**/local/**',
  '**/tmp/**',
  '*.min.*',
  'CHANGELOG*',
  'LICENSE*',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];
