import nextEslintPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

import type { OptionalConfig } from '../utils/resolveOptionalConfigs.js';

export const config = tseslint.config({
  extends: [nextEslintPlugin.flatConfig.coreWebVitals],
});

export const dependencies = ['@next/eslint-plugin-next'];

export default {
  config,
  dependencies,
} satisfies OptionalConfig;
