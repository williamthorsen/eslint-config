declare module 'eslint-plugin-promise' {
  import type { Linter } from 'eslint';
  const promisePlugin: {
    configs: {
      'flat/recommended': Linter.Config;
    };
  };
  export default promisePlugin;
}
