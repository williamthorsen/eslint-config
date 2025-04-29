import type { Linter } from 'eslint';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';

/**
 * As at v3.2.0, the "recommended" config is the only available config.
 * The config is in the legacy plugin format, so this file converts it to the modern format.
 */

const modifiedRules: Linter.RulesRecord = {
  'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
};

const config: Linter.Config = {
  plugins: {
    'eslint-comments': eslintCommentsPlugin,
  },
  rules: {
    ...eslintCommentsPlugin.configs.recommended.rules,
    ...modifiedRules,
  },
};

export default config;
