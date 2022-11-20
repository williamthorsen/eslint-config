// This configuration file uses the new flat syntax.
// See https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new

import standardConfig from 'eslint-config-standard';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';
import htmlPlugin from 'eslint-plugin-html';
import jsoncPlugin from 'eslint-plugin-jsonc';
import markdownPlugin from 'eslint-plugin-markdown';
import ymlPlugin from 'eslint-plugin-yml';
import jsonParser from 'jsonc-eslint-parser';
import yamlParser from 'yaml-eslint-parser';

import jsPlugins from './jsPlugins.mjs';

export default [
  'eslint:recommended',
  // HTML
  {
    files: ['**/*.html'],
    plugins: {
      html: htmlPlugin,
    },
  },
  // JavaScript
  {
    files: ['**/*.cjs', '**/*.js', '**/*.jsx', '**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
      },
    },
    plugins: jsPlugins,
    rules: {
      // TODO: Replace eslint-config-standard with selected inline rules
      ...Object.fromEntries(
        Object.entries(standardConfig.rules).filter(([ruleName]) => !ruleName.startsWith('import/')),
      ),
      ...eslintCommentsPlugin.configs.recommended.rules,

      // Best practices
      'consistent-return': 'error',
      'complexity': ['warn', 11],
      'eqeqeq': ['error', 'always'],
      'no-alert': 'error',
      'no-cond-assign': ['error', 'always'],
      'no-console': ['error', { allow: ['error', 'info', 'warn'] }],
      'no-dupe-class-members': 'error',
      'no-loss-of-precision': 'error',
      'no-param-reassign': 'off',
      'no-redeclare': ['error', { builtinGlobals: true }],
      'no-restricted-syntax': [
        'error',
        'DebuggerStatement',
        'LabeledStatement',
        'WithStatement',
      ],
      'no-return-assign': 'error',
      'no-return-await': 'off',
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
      'no-var': 'off',
      'require-await': 'off',
      'object-shorthand': ['warn', 'always', { avoidQuotes: true, ignoreConstructors: false }],
      'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }],
      'prefer-exponentiation-operator': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',

      // Stylistic rules
      'arrow-spacing': ['warn', { before: true, after: true }],
      'block-spacing': ['warn', 'always'],
      'brace-style': ['warn', 'stroustrup', { allowSingleLine: true }],
      'camelcase': 'off',
      'comma-dangle': ['warn', 'always-multiline'],
      'comma-spacing': ['warn', { before: false, after: true }],
      'comma-style': ['warn', 'last'],
      'computed-property-spacing': ['warn', 'never', { enforceForClassMembers: true }],
      'curly': ['warn', 'multi-or-nest', 'consistent'],
      'dot-notation': ['warn', { allowKeywords: true }],
      'eol-last': 'warn',
      'func-call-spacing': ['warn', 'never'],
      'generator-star-spacing': ['warn', { before: true, after: true }],
      'indent': ['warn', 2, {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        MemberExpression: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        ignoreComments: false,
        ignoredNodes: ['TemplateLiteral *', 'JSXElement', 'JSXElement > *', 'JSXAttribute', 'JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression', 'JSXSpreadAttribute', 'JSXExpressionContainer', 'JSXOpeningElement', 'JSXClosingElement', 'JSXFragment', 'JSXOpeningFragment', 'JSXClosingFragment', 'JSXText', 'JSXEmptyExpression', 'JSXSpreadChild'],
        offsetTernaryExpressions: true,
      }],
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
      'no-constant-condition': ['warn', { checkLoops: false }],
      'no-extra-parens': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 1 }],
      'no-trailing-spaces': 'warn',
      'no-underscore-dangle': ['warn', { allowAfterThis: true }],
      'no-unused-expressions': ['warn', {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      }],
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

      // eslint-comments
      'eslint-comments/disable-enable-pair': ['warn', { allowWholeFile: true }],

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
    },
  },
  // JSON
  {
    files: ['**/*.json', '**/*.json5'],
    languageOptions: {
      parser: jsonParser,
    },
    plugins: {
      jsonc: jsoncPlugin,
    },
    rules: {
      ...jsoncPlugin.rules['recommended-with-jsonc'],
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
    files: ['**/*.json5'],
    languageOptions: {
      parser: jsonParser,
    },
    plugins: {
      jsonc: jsoncPlugin,
    },
    rules: {
      // TODO: Enable these rules
      // 'plugin:jsonc/recommended-with-jsonc',
      'jsonc/comma-dangle': ['warn', 'always'],
      'jsonc/comma-style': ['error', 'last'],
    },
  },
  {
    files: ['**/*.yaml', '**/*.yml'],
    languageOptions: {
      parser: yamlParser,
    },
    plugins: {
      yml: ymlPlugin,
    },
    rules: {
      ...ymlPlugin.rules.recommended,
      'yml/quotes': ['error', { prefer: 'single', avoidEscape: true }],
      'yml/no-empty-document': 'off',
      'spaced-comment': 'off',
    },
  },
  // Markdown: Code blocks in Markdown files
  {
    files: ['**/*.md'],
    plugins: {
      markdown: markdownPlugin,
    },
    processor: 'markdown/markdown',
    rules: {
      // 'no-alert': 'off',
      'no-alert': 'error',
      'no-console': 'off',
      'no-restricted-imports': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
  // Scripts
  {
    files: ['scripts/**/*.*'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.test.js'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
  // package.json
  {
    files: ['package.json'],
    languageOptions: {
      parser: jsonParser,
    },
    plugins: {
      jsonc: jsoncPlugin,
    },
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

            'homepage',
            'repository',
            'bugs',
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
  {
    ignores: [
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
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
];

export { jsPlugins };
