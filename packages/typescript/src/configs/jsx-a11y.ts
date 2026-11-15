import { type Config, defineConfig } from 'eslint/config';

/** Builds the jsx-a11y recommended config. */
export async function createJsxA11yConfig(): Promise<Config[]> {
  const { default: jsxA11yPlugin } = await import('eslint-plugin-jsx-a11y');

  return defineConfig({
    extends: [jsxA11yPlugin.flatConfigs.recommended],
  });
}
