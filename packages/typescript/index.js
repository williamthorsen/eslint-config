/* eslint-disable object-property-newline */

const basic = require('@williamthorsen/eslint-config-basic');
const basicMarkdownRules = basic.overrides.find(override => override.files[0] === '**/*.md/*.*')?.rules || {};
const basicJsRules = basic.overrides.find(override => override.files[0] === '*.cjs', '*.js', '*.jsx', '*.mjs').rules || {};

module.exports = {
  extends: [
    '@williamthorsen/eslint-config-basic',
  ],
  overrides: [
    ...basic.overrides,
    {
      // Code blocks in Markdown files
      files: ['**/*.md/*.*'],
      rules: {
        ...basicMarkdownRules,
        '@typescript-eslint/no-redeclare': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/comma-dangle': 'off',
      },
    },
    {
      files: ['*.d.ts'],
      rules: {
        'import/no-duplicates': 'off',
      },
    },
    {
      files: ['*.cjs', '*.js', '*.mjs'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/indent': 'off',
        'indent': ['warn', 2, { SwitchCase: 1 }],
        'no-dupe-class-members': 'error',
      },
    },
    {
      files: ['*.cts', '*.mts', '*.ts', '*.tsx'],
      extends: [
        'plugin:eslint-comments/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'standard-with-typescript',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        ...basicJsRules,

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
        '@typescript-eslint/no-extra-parents': 'warn', 'no-extra-parens': 'off',
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
      files: ['*.test.ts'],
      rules: {
        'no-unused-expressions': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    module: 'es2020',
    parser: '@typescript-eslint/parser',
    project: './tsconfig.json',
    sourceType: 'module',
  },
  rules: {},
  settings: {
    'import/resolver': {
      node: { extensions: ['.cjs', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx', '.d.ts'] },
    },
  },
};
