import type { Linter } from 'eslint';
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments';

const rules: Linter.RulesRecord = {
  'eslint-comments/disable-enable-pair': ['warn', { allowWholeFile: true }],
};

export default {
  plugins: {
    'eslint-comments': eslintCommentsPlugin,
  },
  rules,
};
