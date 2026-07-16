import rule from '../memoized-functions-returned-by-hook.ts';
import { RuleTester } from './ruleTester.ts';

const ruleTester = new RuleTester();

ruleTester.run('memoized-functions-returned-by-hook', rule, {
  valid: [
    // Non-firing: the returned function is memoized with useCallback
    `function useThing() {
      const onClick = useCallback(() => {}, []);
      return { onClick };
    }`,
    // Non-firing: a non-hook function (does not start with "use") is ignored
    `function makeThing() {
      return { onClick: () => {} };
    }`,
  ],
  invalid: [
    {
      // Firing: an unmemoized function property returned from a hook
      code: `function useThing() {
        return { onClick: () => {} };
      }`,
      errors: [{ messageId: 'memoizedFunctionsReturnedByHook' }],
    },
  ],
});
