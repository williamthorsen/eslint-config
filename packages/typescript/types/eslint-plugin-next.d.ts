// Declares only those properties of the module that are of interest for this package.
declare module '@next/eslint-plugin-next' {
  import type { Linter } from 'eslint';
  const nextPlugin: {
    configs: {
      'core-web-vitals': Linter.Config;
      recommended: Linter.Config;
    };
  };
  export default nextPlugin;
}
