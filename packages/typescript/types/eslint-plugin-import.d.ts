declare module 'eslint-plugin-import' {
  import type { ESLint, Linter, Rule } from 'eslint';

  export const rules: Record<string, Rule.RuleModule>;

  export const configs: {
    recommended: Linter.Config;
    errors: Linter.Config;
    warnings: Linter.Config;
    'stage-0': Linter.Config;
    react: Linter.Config;
    'react-native': Linter.Config;
    electron: Linter.Config;
    typescript: Linter.Config;
  };

  export const flatConfigs: {
    recommended: Linter.Config;
    errors: Linter.Config;
    warnings: Linter.Config;
    react: Linter.Config;
    'react-native': Linter.Config;
    electron: Linter.Config;
    typescript: Linter.Config;
  };

  const importPlugin: ESLint.Plugin & {
    rules: Record<string, Rule.RuleModule>;
    configs: Record<string, Linter.Config>;
    flatConfigs: Record<string, Linter.Config>;
  };

  export default importPlugin;
}
