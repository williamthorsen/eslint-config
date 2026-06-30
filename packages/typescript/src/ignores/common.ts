export const commonIgnores: string[] = [
  '**/*.md/*.ts', // disabled for now: not correctly recognized by the `include` block in `tsconfig.eslint.json`
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
