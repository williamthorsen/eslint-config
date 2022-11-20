import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';
import jsoncPlugin from 'eslint-plugin-jsonc';
import markdownPlugin from 'eslint-plugin-markdown';
import nPlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import unicornPlugin from 'eslint-plugin-unicorn';
import yamlPlugin from 'eslint-plugin-yml';
import jsonParser from 'jsonc-eslint-parser';
import yamlParser from 'yaml-eslint-parser';

const commonIgnores = [
  '**/*.md/*.ts', // disabled for now: not correctly recognized by the `include` block in `tsconfig.eslint.json`
  '**/dist/**/*',
  '**/dist-ssr/**/*',
  '**/coverage/**/*',
  '**/lib/**/*',
  '**/local/**/*',
  '**/output/**/*',
  '**/tmp/**/*',
  '*.min.*',
  '*.d.ts',
  'CHANGELOG.md',
  'LICENSE*',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
];

const eslintRecommendedRules = {
  'constructor-super': 'error',
  'for-direction': 'error',
  'getter-return': 'error',
  'no-async-promise-executor': 'error',
  'no-case-declarations': 'error',
  'no-class-assign': 'error',
  'no-compare-neg-zero': 'error',
  'no-cond-assign': 'error',
  'no-const-assign': 'error',
  'no-constant-condition': 'error',
  'no-control-regex': 'error',
  'no-debugger': 'error',
  'no-delete-var': 'error',
  'no-dupe-args': 'error',
  'no-dupe-class-members': 'error',
  'no-dupe-else-if': 'error',
  'no-dupe-keys': 'error',
  'no-duplicate-case': 'error',
  'no-empty': 'error',
  'no-empty-character-class': 'error',
  'no-empty-pattern': 'error',
  'no-ex-assign': 'error',
  'no-extra-boolean-cast': 'error',
  'no-extra-semi': 'error',
  'no-fallthrough': 'error',
  'no-func-assign': 'error',
  'no-global-assign': 'error',
  'no-import-assign': 'error',
  'no-inner-declarations': 'error',
  'no-invalid-regexp': 'error',
  'no-irregular-whitespace': 'error',
  'no-loss-of-precision': 'error',
  'no-misleading-character-class': 'error',
  'no-mixed-spaces-and-tabs': 'error',
  'no-new-symbol': 'error',
  'no-nonoctal-decimal-escape': 'error',
  'no-obj-calls': 'error',
  'no-octal': 'error',
  'no-prototype-builtins': 'error',
  'no-redeclare': 'error',
  'no-regex-spaces': 'error',
  'no-self-assign': 'error',
  'no-setter-return': 'error',
  'no-shadow-restricted-names': 'error',
  'no-sparse-arrays': 'error',
  'no-this-before-super': 'error',
  'no-unexpected-multiline': 'error',
  'no-unreachable': 'error',
  'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error',
  'no-unsafe-optional-chaining': 'error',
  'no-unused-labels': 'error',
  'no-unused-vars': 'error',
  'no-useless-backreference': 'error',
  'no-useless-catch': 'error',
  'no-useless-escape': 'error',
  'no-with': 'error',
  'require-yield': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',
};

export default [
  // JavaScript
  {
    files: ['**/*.cjs', '**/*.js', '**/*.jsx', '**/*.mjs'],
    ignores: [
      ...commonIgnores,
      '!.*.cjs',
      '!.*.mjs',
    ],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: true,
      },
    },
    plugins: {
      'eslint-comments': eslintCommentsPlugin,
      'n': nPlugin,
      'promise': promisePlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'unicorn': unicornPlugin,
    },
    rules: {
      ...eslintRecommendedRules,
      ...eslintCommentsPlugin.configs.recommended.rules,

      // Best practices
      'consistent-return': 'error',
      'complexity': ['warn', 11],
      'eqeqeq': ['error', 'always'],
      'no-alert': 'error',
      'no-cond-assign': ['error', 'always'],
      'no-console': ['error', { allow: ['error', 'info', 'warn'] }],
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
      'no-undef': 'error',
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
      'no-underscore-dangle': ['warn', { allow: ['__dirname', '__filename'], allowAfterThis: true }],
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
    ignores: commonIgnores,
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
    ignores: commonIgnores,
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
    ignores: [
      ...commonIgnores,
      '!.github/**/*.yml',
    ],
    languageOptions: {
      parser: yamlParser,
    },
    plugins: {
      yml: yamlPlugin,
    },
    rules: {
      ...yamlPlugin.rules.recommended,
      'yml/quotes': ['error', { prefer: 'single', avoidEscape: true }],
      'yml/no-empty-document': 'off',
      'spaced-comment': 'off',
    },
  },
  // Markdown: Code blocks in Markdown files
  {
    files: ['**/*.md'],
    ignores: commonIgnores,
    plugins: {
      markdown: markdownPlugin,
    },
    processor: 'markdown/markdown',
    rules: {
      'no-alert': 'error',
      'no-console': 'off',
      'no-restricted-imports': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',

      '@typescript-eslint/no-redeclare': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/comma-dangle': 'off',
    },
  },
  // Scripts
  {
    files: ['scripts/**/*.*'],
    ignores: commonIgnores,
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
    ignores: commonIgnores,
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
            'bugs',
            'repository',
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
    files: ['**/*.d.ts'],
    ignores: commonIgnores,
    rules: {
      'import/no-duplicates': 'off',
    },
  },
  {
    files: ['**/*.cts', '**/*.mts', '**/*.ts', '**/*.tsx'],
    ignores: commonIgnores,
    languageOptions: {
      globals: {
        console: 'readonly',
        process: true,
      },
      parser: tsParser,
      parserOptions: {
        module: 'es2022',
        parser: '@typescript-eslint/parser',
        project: ['./tsconfig.eslint.json', './packages/*/tsconfig.eslint.json'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Best practices
      '@typescript-eslint/ban-types': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', disallowTypeAnnotations: false }],
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'all',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-useless-constructor': 'warn',

      '@typescript-eslint/brace-style': ['warn', 'stroustrup', { allowSingleLine: true }], 'brace-style': 'off',
      '@typescript-eslint/comma-dangle': ['warn', {
        'arrays': 'always-multiline',
        'exports': 'always-multiline',
        'functions': 'ignore',
        'imports': 'always-multiline',
        'objects': 'always-multiline',
        // TypeScript only
        'enums': 'always-multiline',
        'generics': 'always-multiline',
        'tuples': 'ignore',
      }], 'comma-dangle': 'off',
      'keyword-spacing': 'off',
      'no-dupe-class-members': 'off',
      'no-useless-constructor': 'off',
      'space-before-blocks': 'off',

      '@typescript-eslint/indent': ['warn', 2, {
        ignoredNodes: [
          'TemplateLiteral *',
          'JSXElement',
          'JSXElement > *',
          'JSXAttribute',
          'JSXIdentifier',
          'JSXNamespacedName',
          'JSXMemberExpression',
          'JSXSpreadAttribute',
          'JSXExpressionContainer',
          'JSXOpeningElement',
          'JSXClosingElement',
          'JSXFragment',
          'JSXOpeningFragment',
          'JSXClosingFragment',
          'JSXText',
          'JSXEmptyExpression',
          'JSXSpreadChild',
          'TSTypeParameterInstantiation',
          'FunctionExpression > .params[decorators.length > 0]',
          'FunctionExpression > .params > :matches(Decorator, :not(:first-child))',
          'ClassBody.body > PropertyDefinition[decorators.length > 0] > .key',
        ],
        SwitchCase: 1,
      }], 'indent': 'off',
      '@typescript-eslint/lines-between-class-members': ['warn', 'always', {
        exceptAfterOverload: true,
        exceptAfterSingleLine: true,
      }], 'lines-between-class-members': 'off',
      '@typescript-eslint/member-delimiter-style': 'warn',
      '@typescript-eslint/no-empty-function': 'off', 'no-empty-function': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-extra-parens': 'warn', 'no-extra-parens': 'off',
      '@typescript-eslint/no-loss-of-precision': 'error', 'no-loss-of-precision': 'off',
      '@typescript-eslint/object-curly-spacing': ['warn', 'always'], 'object-curly-spacing': 'off',
      '@typescript-eslint/quotes': ['warn', 'single', { avoidEscape: true }], 'quotes': 'off',
      '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: true }], 'no-redeclare': 'off',
      '@typescript-eslint/semi': ['error', 'always'], 'semi': 'off',
      '@typescript-eslint/space-before-blocks': ['warn', 'always'],
      '@typescript-eslint/space-before-function-paren': ['warn', {
        anonymous: 'always',
        asyncArrow: 'always',
        named: 'never',
      }], 'space-before-function-paren': 'off',
      '@typescript-eslint/type-annotation-spacing': 'warn',
    },
  },
  {
    files: ['**/*.test.ts'],
    ignores: commonIgnores,
    rules: {
      'no-unused-expressions': 'off',
    },
  },
];
