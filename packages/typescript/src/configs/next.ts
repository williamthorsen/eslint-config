import { type Config, defineConfig } from 'eslint/config';

async function createConfig(): Promise<Config[]> {
  const { default: nextEslintPlugin } = await import('@next/eslint-plugin-next');

  return defineConfig({
    extends: [nextEslintPlugin.configs['core-web-vitals']],
  });
}
export default createConfig;
