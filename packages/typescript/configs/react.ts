import tseslint, { type ConfigArray } from 'typescript-eslint';

async function createConfig(): Promise<ConfigArray> {
  const { default: reactPlugin } = await import('eslint-plugin-react');
  const { default: reactHooksPlugin } = await import('eslint-plugin-react-hooks');

  return tseslint.config({
    extends: [reactPlugin.configs.flat.recommended, reactHooksPlugin.configs['recommended-latest']],
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
