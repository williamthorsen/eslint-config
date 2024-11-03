declare module 'eslint-plugin-promise' {
  import type { Linter } from 'eslint';
  const promisePlugin: Linter.Plugin;
  export default promisePlugin;
}
