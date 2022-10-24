module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'standard',
    'plugin:import/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:jsonc/recommended-with-jsonc',
    'plugin:yml/standard',
    'plugin:markdown/recommended',
  ],
  ignorePatterns: [
    'dist/',
    'dist-ssr/',
    'coverage/',
    'lib/',
    'local/',
    'output/',
    'tmp/',
    '*.min.*',
    '*.d.ts',
    'CHANGELOG.md',
    'LICENSE*',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    // Hidden files and directories are ignored by default, so they need to be explicitly unignored to be linted
    '!.github/',
    '!.*.cjs',
    '!.*.mjs',
    '!.vscode',
  ],
  overrides: [
    {
      // Code blocks in Markdown files
      files: ['**/*.md/*.*'],
      rules: {
        // 'no-alert': 'off',
        'no-alert': 'error',
        'no-console': 'off',
        'no-restricted-imports': 'off',
        'no-undef': 'off',
        'no-unused-expressions': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      files: ['*.json', '*.json5'],
      parser: 'jsonc-eslint-parser',
      rules: {
        'jsonc/array-bracket-spacing': ['warn', 'never'],
        'jsonc/indent': ['warn', 2],
        'jsonc/key-spacing': ['error', { beforeColon: false, afterColon: true }],
        'jsonc/no-octal-escape': 'error',
        'jsonc/object-curly-newline': ['error', { multiline: true, consistent: true }],
        'jsonc/object-curly-spacing': ['error', 'always'],
        'jsonc/object-property-newline': ['error', { allowMultiplePropertiesPerLine: true }],
        'comma-dangle': 'off',
        'quotes': 'off',
        'quote-props': 'off',
      },
    },
    {
      files: ['*.json5'],
      parser: 'jsonc-eslint-parser',
      rules: {
        'jsonc/comma-dangle': ['warn', 'always'],
        'jsonc/comma-style': ['error', 'last'],
      },
    },
    {
      files: ['*.yaml', '*.yml'],
      parser: 'yaml-eslint-parser',
      rules: {
        'spaced-comment': 'off',
      },
    },
    {
      files: ['*.cjs', '*.js', '*.mjs'],
      rules: {
      },
    },
    {
      files: ['scripts/**/*.*'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['*.test.[jt]s'],
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    {
      files: ['package.json'],
      parser: 'jsonc-eslint-parser',
      rules: {
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

              'engines',
              'os',
              'cpu',

              'repository',
              'bugs',
              'homepage',
              'funding', // Unlisted
              'license',

              'author',
              'contributors',
              'publisher', // Unlisted

              'bin',
              'type',
              'main',
              'exports',
              'types',
              'typesVersions',
              'module',
              'browser',
              'files',
              'directories',
              'workspaces',
              'config',
              'scripts',

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
              'publishConfig',
              'simple-git-hooks',
              'unpkg',
            ],
          },
          {
            pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies$',
            order: { type: 'asc' },
          },
          {
            pathPattern: '^exports.*$',
            order: [
              'types',
              'require',
              'import',
            ],
          },
        ],
      },
    },
  ],
  plugins: [
    'html',
    'simple-import-sort',
    'unicorn',
  ],
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.mjs'] },
    },
  },
  rules: {
    // Best practices
    'consistent-return': 'error',
    'complexity': ['warn', 11],
    'eqeqeq': ['error', 'always'],
    'no-alert': 'error',
    'no-cond-assign': ['error', 'always'],
    'no-return-assign': 'error',
    'require-await': 'off',

    // Stylistic rules
    'brace-style': ['warn', 'stroustrup', { allowSingleLine: true }],
    'camelcase': 'off',
    'comma-dangle': ['warn', 'always-multiline'],
    'curly': ['error', 'multi-or-nest', 'consistent'],
    'indent': ['warn', 2, { SwitchCase: 1, VariableDeclarator: 1, outerIIFEBody: 1 }],
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-constant-condition': ['warn', { checkLoops: false }],
    'no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 1 }],
    'no-param-reassign': 'off',
    'no-restricted-syntax': [
      'error',
      'DebuggerStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-return-await': 'off',
    'no-trailing-spaces': 'warn',
    'no-underscore-dangle': ['warn', { allowAfterThis: true }],
    'no-unused-expressions': ['warn', {
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true,
    }],
    'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
    'object-curly-newline': ['warn', { consistent: true }],
    'object-curly-spacing': ['warn', 'always'],
    'padded-blocks': 'off',
    'quote-props': ['warn', 'as-needed', { unnecessary: false }],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'sort-imports': ['warn', {
      ignoreCase: false,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      allowSeparatedGroups: false,
    }],
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      asyncArrow: 'always',
      named: 'never',
    }],

    // ES6 rules
    'no-var': 'off',
    'object-shorthand': ['warn', 'always', {
      avoidQuotes: true,
      ignoreConstructors: false,
    }],
    'prefer-const': ['error', {
      destructuring: 'any',
      ignoreReadBeforeAssign: true,
    }],
    'prefer-exponentiation-operator': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',

    // eslint-comments
    'eslint-comments/disable-enable-pair': 'off',

    // simple-import-sort
    'simple-import-sort/exports': 'warn',
    'simple-import-sort/imports': ['warn', {
      groups: [
        ['^node:'], // built-ins
        ['^@?\\w'], // packages
        ['^\\u0000"'], // side-effect imports
        // absolute internal imports
        // TODO: Inject package aliases via `config.settings`
        // [`^(${packageAliases.join('|')})(/.*|$)`],
        // relative internal imports
        ['^\\.'],
        ['^\\u0020*(?:\\u0020*import|\\u0020*export)'],
        ['^[^.]'], // scss imports
      ],
    }],

    // unicorn
    'unicorn/error-message': 'warn', // Pass an error message when throwing errors
    'unicorn/escape-case': 'error', // Uppercase regex escapes
    'unicorn/no-instanceof-array': 'error', // Prefer `Array.isArray` over `instanceof`
    'unicorn/no-new-buffer': 'error', // Prevent deprecated `new Buffer()`
    'unicorn/no-unsafe-regex': 'warn', // Keep regex literals safe
    'unicorn/number-literal-case': 'error', // Lowercase number formatting for octal, hex, binary (0x1'error' instead of 0X1'error')
    'unicorn/prefer-includes': 'warn', // Prefer `includes` over `indexOf` when checking for existence
    'unicorn/prefer-string-starts-ends-with': 'warn', // Prefer `String#startsWith` & `String#endsWith` over more complex alternatives
    'unicorn/prefer-text-content': 'warn', // Prefer `textContent` over `innerText`
    'unicorn/prefer-type-error': 'warn', // Prefer a TypeError when an error is thrown while checking `typeof`
    'unicorn/throw-new-error': 'error', // Use `new` when throwing an error

    'n/no-callback-literal': 'off',

    // YML
    'yml/quotes': ['error', { prefer: 'single', avoidEscape: false }],
    'yml/no-empty-document': 'off',
  },
};
