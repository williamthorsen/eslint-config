import type { Linter } from 'eslint';

export const eslintCommentsRules: Linter.RulesRecord = {
  'eslint-comments/disable-enable-pair': ['warn', { allowWholeFile: true }],
};
