import type { ESLint } from 'eslint';
import type { Config } from 'eslint/config';

import { ensurePluginRules } from '#src/utils/ensurePluginRules.ts';

import helpersLastRule from './rules/helpers-last.ts';
import noFloatingDisposableRule from './rules/no-floating-disposable.ts';
import noJsExtensionForTsRule from './rules/no-js-extension-for-ts.ts';
import noRealTimeSleepRule from './rules/no-real-time-sleep.ts';
import noSplitImportsRule from './rules/no-split-imports.ts';
import noTypeCycleRule from './rules/no-type-cycle.ts';
import noUndefinedWithNumberRule from './rules/no-undefined-with-number.ts';
import noUnpublishedBarrelRule from './rules/no-unpublished-barrel.ts';
import noUnusedMapRule from './rules/no-unused-map.ts';
import preferFunctionDeclarationRule from './rules/prefer-function-declaration.ts';

const skyPilotPlugin: ESLint.Plugin = {
  meta: {
    name: 'eslint-plugin-sky-pilot',
  },
  rules: ensurePluginRules({
    'helpers-last': helpersLastRule,
    'no-floating-disposable': noFloatingDisposableRule,
    'no-js-extension-for-ts': noJsExtensionForTsRule,
    'no-real-time-sleep': noRealTimeSleepRule,
    'no-split-imports': noSplitImportsRule,
    'no-type-cycle': noTypeCycleRule,
    'no-undefined-with-number': noUndefinedWithNumberRule,
    'no-unpublished-barrel': noUnpublishedBarrelRule,
    'no-unused-map': noUnusedMapRule,
    'prefer-function-declaration': preferFunctionDeclarationRule,
  }),
};

/** A preset, which always registers the plugin, so that another block can reuse the registration. */
type Preset = Config & { plugins: NonNullable<Config['plugins']> };

// Annotate explicitly: declaration emit cannot name `@eslint/core`'s `Plugin`, which an inferred type would reference.
const configs: { recommended: Preset; strict: Preset } = {
  recommended: {
    plugins: {
      'sky-pilot': skyPilotPlugin,
    },
    rules: {
      'sky-pilot/no-floating-disposable': 'warn',
      'sky-pilot/no-js-extension-for-ts': 'error',
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
      'sky-pilot/no-js-extension-for-ts': 'error',
      'sky-pilot/no-split-imports': 'error',
      'sky-pilot/no-undefined-with-number': 'error',
      'sky-pilot/no-unpublished-barrel': 'error',
      'sky-pilot/no-unused-map': 'error',
      'sky-pilot/prefer-function-declaration': 'error',
    },
  },
};

export default { configs };
