import noUndefinedWithNumberRule from './rules/no-undefined-with-number.js';
import noUnusedMapRule from './rules/no-unused-map.js';
import preferFunctionDeclarationRule from './rules/prefer-function-declaration.js';

// Define the plugin
const skyPilotPlugin = {
  rules: {
    'no-undefined-with-number': noUndefinedWithNumberRule,
    'no-unused-map': noUnusedMapRule,
    'prefer-function-declaration': preferFunctionDeclarationRule,
  },
};

// Define the configs that can be extended
const configs = {
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
} as const;

// Export the plugin
export default { configs };
