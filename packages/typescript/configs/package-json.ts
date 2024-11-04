import type { Linter } from 'eslint';
import jsoncPlugin from 'eslint-plugin-jsonc';
import jsoncParser from 'jsonc-eslint-parser';

const rules: Linter.RulesRecord = {
  'jsonc/sort-keys': [
    'warn',
    {
      pathPattern: '^$',
      // Standard sort order from https://www.npmjs.com/package/format-package
      order: [
        'name',
        'version',
        'private',
        'description',
        'keywords',

        'homepage',
        'bugs',
        'repository',
        'funding', // Unlisted
        'license',

        'author',
        'contributors',
        'publisher', // Unlisted

        'type',
        'exports',
        'main',
        'unpkg',
        'module',
        'browser',
        'types',
        'typesVersions',
        'bin',
        'directories',
        'files',
        'workspaces',
        'scripts',
        'simple-git-hooks',
        'config',

        // Extension manifest; see https://code.visualstudio.com/api/references/extension-manifest
        'activationEvents',
        'badges',
        'categories',
        'contributes',
        'displayName',
        'extensionDependencies',
        'extensionKind',
        'extensionPack',
        'galleryBanner',
        'icon',
        'markdown',
        'qna',
        'preview',
        'sideEffects',

        // Dependencies
        'dependencies',
        'devDependencies',
        'optionalDependencies',
        'peerDependencies',
        'peerDependenciesMeta',
        'overrides',
        'resolutions',

        // Configurations
        'eslintConfig',
        'husky',
        'jsdelivr',
        'lint-staged',
        'man',
        'packageManager',
        'pnpm',

        'engines',
        'os',
        'cpu',

        'publishConfig',
      ],
    },
    {
      pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies$',
      order: { type: 'asc' },
    },
    {
      pathPattern: '^exports.*$',
      order: [
        'import',
        'types',
        'require',
      ],
    },
  ],
};

export default {
  files: ['package.json'],
  languageOptions: {
    parser: jsoncParser,
  },
  plugins: {
    'jsonc': jsoncPlugin,
  },
  rules,
};
