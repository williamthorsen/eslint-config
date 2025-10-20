import { defineConfig } from 'eslint/config';
import { type ConfigArray } from 'typescript-eslint';

async function createConfig(): Promise<ConfigArray> {
  const { default: jsxA11yPlugin } = await import('eslint-plugin-jsx-a11y');

  return defineConfig({
    extends: [jsxA11yPlugin.flatConfigs.recommended],
  });
}

export default createConfig;
