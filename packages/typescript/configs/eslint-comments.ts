import type { Linter } from 'eslint';
import { mapPlugins } from '../utils/mapPlugins.js';

const rules: Linter.RulesRecord = {
  'eslint-comments/disable-enable-pair': ['warn', { allowWholeFile: true }],
};

export default {
  plugins: mapPlugins(['eslint-comments']),
  rules,
};
