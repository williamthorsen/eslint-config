import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';

import { ensurePluginRules } from '../utils/ensurePluginRules.ts';
import memoizedFunctionsReturnedByHookRule from './rules/memoized-functions-returned-by-hook.ts';

// Define the plugin
const skyPilotReactPlugin: ESLint.Plugin = {
  rules: ensurePluginRules({
    'memoized-functions-returned-by-hook': memoizedFunctionsReturnedByHookRule,
  }),
};

// Define the configs that can be extended. The annotation is explicit rather than `satisfies`:
// declaration emit cannot name `@eslint/core`'s `Plugin`, which the inferred type would reference.
const configs: { recommended: Config; strict: Config } = {
  recommended: {
    plugins: {
      'sky-pilot-react': skyPilotReactPlugin,
    },
    rules: {
      'sky-pilot-react/memoized-functions-returned-by-hook': 'warn',
    },
  },
  strict: {
    plugins: {
      'sky-pilot-react': skyPilotReactPlugin,
    },
    rules: {
      'sky-pilot-react/memoized-functions-returned-by-hook': 'error',
    },
  },
};

// Export the plugin
export default { configs };
