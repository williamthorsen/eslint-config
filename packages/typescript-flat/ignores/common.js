export default [
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
  'CHANGELOG.md',
  'LICENSE*',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];
