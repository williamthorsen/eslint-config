import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const config = tseslint.config({
  extends: [reactPlugin.configs.flat.recommended, reactHooksPlugin.configs['recommended-latest']],
  rules: {
    'react/prop-types': 'off', // Not needed in TypeScript projects.
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
});

export default config;
