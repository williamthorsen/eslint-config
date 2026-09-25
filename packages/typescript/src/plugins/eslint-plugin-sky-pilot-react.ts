import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';

import { ensurePluginRules } from '../utils/ensurePluginRules.ts';
import memoizedFunctionsReturnedByHookRule from './rules/memoized-functions-returned-by-hook.ts';

const skyPilotReactPlugin: ESLint.Plugin = {
  rules: ensurePluginRules({
    'memoized-functions-returned-by-hook': memoizedFunctionsReturnedByHookRule,
  }),
};

// Annotate explicitly: declaration emit cannot name `@eslint/core`'s `Plugin`, which an inferred type would reference.
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

export default { configs };
