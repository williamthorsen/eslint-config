import tseslint, { type ConfigArray } from 'typescript-eslint';

async function createConfig(): Promise<ConfigArray> {
  const reactPlugin = await import('eslint-plugin-react');
  const reactHooksPlugin = await import('eslint-plugin-react-hooks');

  return tseslint.config({
    extends: [reactPlugin.default.configs.flat.recommended, reactHooksPlugin.default.configs['recommended-latest']],
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
