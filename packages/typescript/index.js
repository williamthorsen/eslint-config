const basic = require('@williamthorsen/eslint-config-basic');
const basicMarkdownRules = basic.overrides.find(override => override.files === '**/*.md/*.*')?.rules || {};

module.exports = {
  extends: [
    'standard-with-typescript',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
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
      files: ['*.cjs', '*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.cts', '*.mts', '*.ts', '*.tsx'],
      rules: {
        // Best practices
        'no-unused-vars': 'off',
        'import/no-unresolved': 'off',

        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
        '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', disallowTypeAnnotations: false }],
        '@typescript-eslint/no-inferrable-types': 'warn',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-unused-vars': ['error', {
          args: 'all',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        }],
        '@typescript-eslint/no-useless-constructor': 'warn',

        // Stylistic
        'brace-style': 'off',
        'comma-dangle': 'off',
        'comma-spacing': 'off',
        'keyword-spacing': 'off',
        'indent': 'off',
        'lines-between-class-members': 'off',
        'no-dupe-class-members': 'off',
        'no-extra-parens': 'off',
        'no-empty-function': 'off',
        'no-loss-of-precision': 'off',
        'no-redeclare': 'off',
        'no-use-before-define': 'off',
        'no-useless-constructor': 'off',
        'object-curly-spacing': 'off',
        'quotes': 'off',
        'semi': 'off',
        'space-before-blocks': 'off',
        'space-before-function-paren': 'off',

        '@typescript-eslint/brace-style': ['warn', 'stroustrup', { allowSingleLine: true }],
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
        }],
        '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
        '@typescript-eslint/explicit-module-boundary-types': 'warn',
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
        }],
        '@typescript-eslint/lines-between-class-members': ['warn', 'always', {
          exceptAfterOverload: true,
          exceptAfterSingleLine: true,
        }],
        '@typescript-eslint/member-delimiter-style': 'warn',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/quotes': ['warn', 'single', { avoidEscape: true }],
        '@typescript-eslint/semi': ['error', 'always'],
        '@typescript-eslint/space-before-blocks': ['warn', 'always'],
        '@typescript-eslint/space-before-function-paren': ['warn', {
          anonymous: 'always',
          asyncArrow: 'always',
          named: 'never',
        }],
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
