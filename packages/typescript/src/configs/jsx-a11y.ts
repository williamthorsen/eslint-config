import { type Config, defineConfig } from 'eslint/config';

async function createConfig(): Promise<Config[]> {
  const { default: jsxA11yPlugin } = await import('eslint-plugin-jsx-a11y');

  return defineConfig({
    extends: [jsxA11yPlugin.flatConfigs.recommended],
  });
}

export default createConfig;
