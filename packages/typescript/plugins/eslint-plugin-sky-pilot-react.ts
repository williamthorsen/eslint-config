import type { TSESLint } from '@typescript-eslint/utils';

import memoizedFunctionsReturnedByHookRule from './rules/memoized-functions-returned-by-hook.ts';

// Define the plugin
const skyPilotReactPlugin: TSESLint.FlatConfig.Plugin = {
  rules: {
    'memoized-functions-returned-by-hook': memoizedFunctionsReturnedByHookRule,
  },
};

// Define the configs that can be extended
const configs = {
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
      'sky-pilot': skyPilotReactPlugin,
    },
    rules: {
      'sky-pilot-react/memoized-functions-returned-by-hook': 'error',
    },
  },
} as const;

// Export the plugin
export default { configs };
