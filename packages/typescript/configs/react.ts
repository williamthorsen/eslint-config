import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export const config = tseslint.config({
  extends: [reactPlugin.configs.flat.recommended, reactHooksPlugin.configs['recommended-latest']],
  rules: {
    'react/prop-types': 'off', // Not needed in TypeScript projects.
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+ projects.,
    'react/jsx-uses-react': 'off', // Not needed in React 17+ projects.
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
});

export default config;
