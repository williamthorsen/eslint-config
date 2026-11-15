import { type Config, defineConfig } from 'eslint/config';

/** Builds the Next.js core-web-vitals config. */
export async function createNextConfig(): Promise<Config[]> {
  const { default: nextEslintPlugin } = await import('@next/eslint-plugin-next');

  return defineConfig({
    extends: [nextEslintPlugin.configs['core-web-vitals']],
  });
}
