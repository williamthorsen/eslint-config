import tseslint, { type ConfigArray } from 'typescript-eslint';

import skyPilotReact from '../plugins/eslint-plugin-sky-pilot-react.js';

async function createConfig(): Promise<ConfigArray> {
  const { default: reactPlugin } = await import('eslint-plugin-react');
  const { default: reactHooksPlugin } = await import('eslint-plugin-react-hooks');

  return tseslint.config({
    extends: [
      reactPlugin.configs.flat.recommended, //
      reactHooksPlugin.configs['recommended-latest'],
      skyPilotReact.configs.recommended,
    ],
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  });
}

export default createConfig;
