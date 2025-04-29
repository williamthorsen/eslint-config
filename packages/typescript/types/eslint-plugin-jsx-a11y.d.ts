declare module 'eslint-plugin-jsx-a11y' {
  import type { Linter } from 'eslint';
  const jsxA11yPlugin: {
    flatConfigs: {
      recommended: Linter.Config;
      strict: Linter.Config;
    };
    configs: {
      recommended: Linter.Config;
      strict: Linter.Config;
    };
  };
  export default jsxA11yPlugin;
}
