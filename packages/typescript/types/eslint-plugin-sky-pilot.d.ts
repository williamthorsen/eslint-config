declare module 'eslint-plugin-sky-pilot' {
  import type { ESLint, Linter } from 'eslint';
  const skyPilotPlugin: {
    configs: ESLint.Plugin['configs'] & {
      recommended: {
        rules: Linter.RulesRecord;
      };
    };
  };
  export default skyPilotPlugin;
} 