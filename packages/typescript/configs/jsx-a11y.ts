import tseslint, { type ConfigArray } from 'typescript-eslint';

async function createConfig(): Promise<ConfigArray> {
  const { default: jsxA11yPlugin } = await import('eslint-plugin-jsx-a11y');

  return tseslint.config({
    extends: [jsxA11yPlugin.flatConfigs.recommended],
  });
}

export default createConfig;
