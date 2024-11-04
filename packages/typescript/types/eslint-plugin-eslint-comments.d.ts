declare module 'eslint-plugin-eslint-comments' {
  import type { ESLint, Linter } from 'eslint';
  const eslintCommentsPlugin: {
    configs: ESLint.Plugin['configs'] & {
      recommended: {
        rules: Linter.RulesRecord;
      };
    };
  };
  export default eslintCommentsPlugin;
}
