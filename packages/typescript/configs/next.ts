import type { Linter } from 'eslint';

async function createConfig(): Promise<Linter.Config> {
  const { default: nextEslintPlugin } = await import('@next/eslint-plugin-next');

  return nextEslintPlugin.flatConfig.coreWebVitals;
}
export default createConfig;
