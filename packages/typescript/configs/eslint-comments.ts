import type { Linter } from 'eslint';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';

const rules: Linter.RulesRecord = {
  'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
};

export default {
  plugins: {
    'eslint-comments': eslintCommentsPlugin,
  },
  rules: {
    ...eslintCommentsPlugin.configs.recommended.rules,
    ...rules,
  },
};
