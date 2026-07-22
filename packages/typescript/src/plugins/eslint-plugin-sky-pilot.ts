import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';

import { ensurePluginRules } from '../utils/ensurePluginRules.ts';
import noUndefinedWithNumberRule from './rules/no-undefined-with-number.ts';
import noUnusedMapRule from './rules/no-unused-map.ts';
import preferFunctionDeclarationRule from './rules/prefer-function-declaration.ts';

// Define the plugin
const skyPilotPlugin: ESLint.Plugin = {
  meta: {
    name: 'eslint-plugin-sky-pilot',
  },
  rules: ensurePluginRules({
    'no-undefined-with-number': noUndefinedWithNumberRule,
    'no-unused-map': noUnusedMapRule,
    'prefer-function-declaration': preferFunctionDeclarationRule,
  }),
};

// Define the configs that can be extended. The annotation is explicit rather than `satisfies`:
// declaration emit cannot name `@eslint/core`'s `Plugin`, which the inferred type would reference.
const configs: { recommended: Config; strict: Config } = {
  recommended: {
    plugins: {
      'sky-pilot': skyPilotPlugin,
    },
    rules: {
      'sky-pilot/no-undefined-with-number': 'error',
      'sky-pilot/no-unused-map': 'warn',
      'sky-pilot/prefer-function-declaration': 'warn',
    },
  },
  strict: {
    plugins: {
      'sky-pilot': skyPilotPlugin,
    },
    rules: {
      'sky-pilot/no-undefined-with-number': 'error',
      'sky-pilot/no-unused-map': 'error',
      'sky-pilot/prefer-function-declaration': 'error',
    },
  },
};

// Export the plugin
export default { configs };
