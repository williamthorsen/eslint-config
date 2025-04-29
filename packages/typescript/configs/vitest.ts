import type { Linter } from 'eslint';

async function createConfig(): Promise<Linter.Config> {
  const { default: vitestPlugin } = await import('@vitest/eslint-plugin');

  return vitestPlugin.configs.all;
}

export default createConfig;
