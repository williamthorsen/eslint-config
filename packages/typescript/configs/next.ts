import type { Linter } from 'eslint';

async function createConfig(): Promise<Linter.Config> {
  const { default: nextEslintPlugin } = await import('@next/eslint-plugin-next');

  return nextEslintPlugin.configs['core-web-vitals'];
}
export default createConfig;
