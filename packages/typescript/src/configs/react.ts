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
      ensureExtendsElement(reactHooksPlugin.configs.flat['recommended-latest']),
      ensureExtendsElement(skyPilotReactPlugin.configs.recommended),
    ],
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
    settings: {
      react: {
        // `'detect'` resolves the React version via `context.getFilename()`, removed in ESLint 10,
        // so eslint-plugin-react@7 crashes on it. Pin a default; consumers override this setting to
        // match their React version (flat-config `settings` merge, last wins).
        version: '19.0',
      },
    },
  });
}

export default createConfig;
