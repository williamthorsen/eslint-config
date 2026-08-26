import rule from '../no-floating-disposable.ts';
import { createTypedRuleTester, RuleTester } from './ruleTester.ts';

// Disposability is a type property, so every case here needs the tester backed by a TS program.
const typedRuleTester = createTypedRuleTester();

typedRuleTester.run('no-floating-disposable', rule, {
  valid: [
    // Non-firing: bound with `using`
    'declare function acquire(): Disposable; function run() { using resource = acquire(); }',
    // Non-firing: an async resource bound with `await using`
    'declare function acquireAsync(): AsyncDisposable; async function run() { await using resource = acquireAsync(); }',
    // Non-firing: `void` marks a deliberate discard
    'declare function acquire(): Disposable; void acquire();',
    // Non-firing: result assigned to a variable
    'declare function acquire(): Disposable; const resource = acquire();',
    // Non-firing: result passed as a call argument
    'declare function acquire(): Disposable; declare function register(resource: Disposable): void; register(acquire());',
    // Non-firing: result returned to the caller, whose resource it becomes
    'declare function acquire(): Disposable; function make() { return acquire(); }',
    // Non-firing: an async resource bound through an awaited promise
    'declare function open(): Promise<AsyncDisposable>; async function run() { await using resource = await open(); }',
    // Non-firing: a `this`-returning method chains onto a resource rather than creating one
    'declare class Server { [Symbol.asyncDispose](): Promise<void>; listen(port: number): this } declare const server: Server; server.listen(3000);',
    // Non-firing: a fluent method whose `this` return is inferred rather than annotated
    "class Pool { [Symbol.dispose]() {} add(item: string) { return this; } } declare const pool: Pool; pool.add('x');",
    // Non-firing: a callee returning the resource it was handed has taken ownership of disposing it
    'declare function acquire(): Disposable; declare function keep<T extends Disposable>(resource: T): T; keep(acquire());',
    // Non-firing: a callee in the default `allow` list
    'declare function setTimeout(handler: () => void, ms: number): Disposable; setTimeout(() => {}, 100);',
    // Non-firing: the `allow` list matches a member call by its property name
    'declare const timers: { setTimeout(handler: () => void, ms: number): Disposable }; timers.setTimeout(() => {}, 100);',
    // Non-firing: a callee the `allow` option adds
    {
      code: 'declare function track(): Disposable; track();',
      options: [{ allow: ['track'] }],
    },
    // Non-firing: a supplied `allow` list adds to the defaults rather than replacing them
    {
      code: 'declare function setTimeout(handler: () => void, ms: number): Disposable; setTimeout(() => {}, 100);',
      options: [{ allow: ['track'] }],
    },
    // Non-firing: the narrowing compares types, so a wrapper declaring its argument's type on both sides is skipped
    'declare function acquire(): Disposable; declare function clone(inner: Disposable): Disposable; clone(acquire());',
    // Non-firing: the result is not a resource
    'declare function open(): { close(): void }; open();',
    // Non-firing: a union mixing a resource with a plain value is left alone
    'declare function acquire(): Disposable | string; acquire();',
  ],
  invalid: [
    {
      // Firing: the resource is discarded
      code: 'declare function acquire(): Disposable; acquire();',
      errors: [{ messageId: 'floatingDisposable', data: { keyword: 'using' } }],
    },
    {
      // Firing: an async resource names the keyword that binds it
      code: 'declare function acquireAsync(): AsyncDisposable; acquireAsync();',
      errors: [{ messageId: 'floatingDisposable', data: { keyword: 'await using' } }],
    },
    {
      // Firing: an awaited promise carries the resource, which the statement then drops
      code: 'declare function open(): Promise<AsyncDisposable>; async function run() { await open(); }',
      errors: [{ messageId: 'floatingDisposable', data: { keyword: 'await using' } }],
    },
    {
      // Firing: a constructed resource is discarded; `no-new` reports nothing here
      code: 'declare class TempDir { [Symbol.dispose](): void } new TempDir();',
      errors: [{ messageId: 'floatingDisposable', data: { keyword: 'using' } }],
    },
    {
      // Firing: discarded behind optional chaining, whose `undefined` is stripped before the type is read
      code: 'declare const factory: { acquire(): Disposable } | undefined; factory?.acquire();',
      errors: [{ messageId: 'floatingDisposable', data: { keyword: 'using' } }],
    },
    {
      // Firing: a callee returning a resource other than the one it was handed created it, so it is the caller's
      code: 'declare function acquire(): Disposable; declare function wrap(inner: Disposable): AsyncDisposable; wrap(acquire());',
      errors: [{ messageId: 'floatingDisposable', data: { keyword: 'await using' } }],
    },
    {
      // Firing: a member call outside the `allow` list
      code: 'declare const factory: { acquire(): Disposable }; factory.acquire();',
      errors: [{ messageId: 'floatingDisposable', data: { keyword: 'using' } }],
    },
    {
      // Firing: discarded inside a nested callback body
      code: 'declare function acquire(): Disposable; [1].forEach(() => { acquire(); });',
      errors: [{ messageId: 'floatingDisposable', data: { keyword: 'using' } }],
    },
  ],
});

// Without `projectService` the tester provides no TS program. Disposability cannot be established without one, and
// nothing about a bare call is syntactically disposable, so the rule reports nothing rather than guessing.
const untypedRuleTester = new RuleTester();

untypedRuleTester.run('no-floating-disposable (no program)', rule, {
  valid: [
    'declare function acquire(): Disposable; acquire();',
    'declare class TempDir { [Symbol.dispose](): void } new TempDir();',
  ],
  invalid: [],
});
