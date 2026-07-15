import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import type { Linter } from 'eslint';
import { defineConfig } from 'eslint/config';

/**
 * The plugin exposes "recommended" as its only config, in the legacy plugin format, with rules
 * namespaced under `@eslint-community/eslint-comments/`. Registering the plugin under the shorter
 * `eslint-comments` key and remapping the recommended rules onto it presents them under the
 * `eslint-comments/` namespace.
 */

const recommendedRules: Linter.RulesRecord = {};
const recommendedEntries = Object.entries(eslintCommentsPlugin.configs.recommended.rules ?? {});
for (const [name, value] of recommendedEntries) {
  if (value !== undefined) {
    recommendedRules[name.replace('@eslint-community/eslint-comments/', 'eslint-comments/')] = value;
  }
}

const modifiedRules: Linter.RulesRecord = {
  'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
};

const config = defineConfig({
  plugins: {
    'eslint-comments': eslintCommentsPlugin,
  },
  rules: {
    ...recommendedRules,
    ...modifiedRules,
  },
});

export default config;
