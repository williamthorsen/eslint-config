declare module 'eslint-plugin-react' {
  import type { Linter } from 'eslint';
  export const configs: {
    flat: {
      recommended: Linter.Config;
    };
  };
}
