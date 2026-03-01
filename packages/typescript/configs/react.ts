import { defineConfig } from 'eslint/config';
import { type ConfigArray } from 'typescript-eslint';

import skyPilotReactPlugin from '../plugins/eslint-plugin-sky-pilot-react.ts';
import { ensureExtendsElement } from '../utils/ensureExtendsElement.ts';

async function createConfig(): Promise<ConfigArray> {
  const { default: reactPlugin } = await import('eslint-plugin-react');
  const { default: reactHooksPlugin } = await import('eslint-plugin-react-hooks');

  return defineConfig({
    extends: [
      reactPlugin.configs.flat.recommended, //
      ensureExtendsElement(reactHooksPlugin.configs['recommended-latest']),
      ensureExtendsElement(skyPilotReactPlugin.configs.recommended),
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
