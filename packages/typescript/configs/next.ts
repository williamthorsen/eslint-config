import nextEslintPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [nextEslintPlugin.flatConfig.coreWebVitals],
});
