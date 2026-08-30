import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';

import { ensurePluginRules } from '../utils/ensurePluginRules.ts';
import noFloatingDisposableRule from './rules/no-floating-disposable.ts';
import noSplitImportsRule from './rules/no-split-imports.ts';
import noUndefinedWithNumberRule from './rules/no-undefined-with-number.ts';
import noUnpublishedBarrelRule from './rules/no-unpublished-barrel.ts';
import noUnusedMapRule from './rules/no-unused-map.ts';
import preferFunctionDeclarationRule from './rules/prefer-function-declaration.ts';

// Define the plugin
const skyPilotPlugin: ESLint.Plugin = {
  meta: {
    name: 'eslint-plugin-sky-pilot',
  },
  rules: ensurePluginRules({
    'no-floating-disposable': noFloatingDisposableRule,
    'no-split-imports': noSplitImportsRule,
    'no-undefined-with-number': noUndefinedWithNumberRule,
    'no-unpublished-barrel': noUnpublishedBarrelRule,
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
      'sky-pilot/no-floating-disposable': 'warn',
      'sky-pilot/no-split-imports': 'warn',
      'sky-pilot/no-undefined-with-number': 'error',
      'sky-pilot/no-unpublished-barrel': 'warn',
      'sky-pilot/no-unused-map': 'warn',
      'sky-pilot/prefer-function-declaration': 'warn',
    },
  },
  strict: {
    plugins: {
      'sky-pilot': skyPilotPlugin,
    },
    rules: {
      'sky-pilot/no-floating-disposable': 'error',
      'sky-pilot/no-split-imports': 'error',
      'sky-pilot/no-undefined-with-number': 'error',
      'sky-pilot/no-unpublished-barrel': 'error',
      'sky-pilot/no-unused-map': 'error',
      'sky-pilot/prefer-function-declaration': 'error',
    },
  },
};

// Export the plugin
export default { configs };
