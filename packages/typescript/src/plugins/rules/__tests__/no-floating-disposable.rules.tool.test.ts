import rule from '../no-floating-disposable.ts';
import { createTypedRuleTester, RuleTester } from './ruleTester.ts';

// Disposability is a type property, so every case here needs the tester backed by a TS program.
const typedRuleTester = createTypedRuleTester();

// A declaration case needs an enclosing block: The `Program` body is exempt, and the tester's code is top-level,
// so a case written bare passes as valid without exercising the rule.
const capture = 'interface Capture extends Disposable { lines: string[] } declare function acquire(): Capture;';
const asyncCapture =
  'interface AsyncCapture extends AsyncDisposable { lines: string[] } declare function acquireAsync(): AsyncCapture;';

typedRuleTester.run('no-floating-disposable', rule, {
  valid: [
    // Non-firing: bound with `using`
    'declare function acquire(): Disposable; function run() { using resource = acquire(); }',
    // Non-firing: an async resource bound with `await using`
    'declare function acquireAsync(): AsyncDisposable; async function run() { await using resource = acquireAsync(); }',
    // Non-firing: `void` marks a deliberate discard
    'declare function acquire(): Disposable; void acquire();',
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

    // -- Declarations --

    // Non-firing: the declared resource is returned, so it becomes the caller's
    `${capture} function make() { const captured = acquire(); return captured; }`,
    // Non-firing: the declared resource is passed on as an argument
    `${capture} declare function register(resource: Capture): void; function run() { const captured = acquire(); register(captured); }`,
    // Non-firing: the declared resource is assigned onward
    `${capture} declare let sink: Capture; function run() { const captured = acquire(); sink = captured; }`,
    // Non-firing: the declared resource leaves inside an object literal
    `${capture} declare function send(payload: unknown): void; function run() { const captured = acquire(); send({ captured }); }`,
    // Non-firing: a reassigned binding, which `using` could not hold
    `${capture} function run() { let captured = acquire(); captured = acquire(); }`,
    // Non-firing: a closure may outlive the block it captures the resource in
    `${capture} function run() { const captured = acquire(); return () => captured.lines; }`,
    // Non-firing: a module-scope resource is released at the end of module evaluation, before an importer runs
    `${capture} const captured = acquire(); captured.lines;`,
    // Non-firing: an exported resource, which module scope already exempts
    `${capture} export const captured = acquire();`,
    // Non-firing: the resource is released by hand
    `${capture} function run() { const captured = acquire(); try { captured.lines; } finally { captured[Symbol.dispose](); } }`,
    // Non-firing: a destructuring declarator binds no resource to rebind
    `${capture} function run() { const { lines } = acquire(); return lines; }`,
    // Non-firing: a `var` read past the block a `using` would be released at
    `${capture} function run() { { var captured = acquire(); } captured.lines; }`,
    // Non-firing: an initializer that is not an acquisition site carries a resource acquired elsewhere
    `${capture} function run() { using held = acquire(); const alias = held; alias.lines; }`,
    // Non-firing: the declaration half turned off
    {
      code: `${capture} function run() { const captured = acquire(); captured.lines; }`,
      options: [{ checkDeclarations: false }],
    },
    // Non-firing: the `allow` list reaches a declaration too
    {
      code: `${capture} function run() { const captured = acquire(); captured.lines; }`,
      options: [{ allow: ['acquire'] }],
    },
    // Non-firing: ownership passthrough reaches a declaration too
    `${capture} declare function keep<T extends Disposable>(resource: T): T; function run() { const captured = keep(acquire()); captured.lines; }`,
    // Non-firing: a fluent call yields the receiver's type rather than a new resource
    'declare class Server { [Symbol.asyncDispose](): Promise<void>; listen(port: number): this } declare const server: Server; function run() { const listening = server.listen(3000); listening.listen(3001); }',
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

    // -- Declarations --

    {
      // Firing: the resource is read in place and never released
      code: `${capture} function run() { const captured = acquire(); captured.lines; }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} function run() { using captured = acquire(); captured.lines; }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a resource nothing reads still leaks
      code: `${capture} function run() { const captured = acquire(); }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} function run() { using captured = acquire(); }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a `let` binding, rebound to the same keyword the type calls for
      code: `${capture} function run() { let captured = acquire(); captured.lines; }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'let' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} function run() { using captured = acquire(); captured.lines; }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a `var` whose references all sit inside the block a `using` would be released at
      code: `${capture} function run() { { var captured = acquire(); captured.lines; } }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'var' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} function run() { { using captured = acquire(); captured.lines; } }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a nested block is a scope of its own
      code: `${capture} function run() { if (true) { const captured = acquire(); captured.lines; } }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} function run() { if (true) { using captured = acquire(); captured.lines; } }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a constructed resource bound to a declaration
      code: 'class TempDir { [Symbol.dispose](): void {} path = ""; } function run() { const dir = new TempDir(); dir.path; }',
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output:
                'class TempDir { [Symbol.dispose](): void {} path = ""; } function run() { using dir = new TempDir(); dir.path; }',
            },
          ],
        },
      ],
    },
    {
      // Firing: an async resource inside an `async` function, where `await using` compiles
      code: `${asyncCapture} async function run() { const captured = acquireAsync(); captured.lines; }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'await using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'await using' },
              output: `${asyncCapture} async function run() { await using captured = acquireAsync(); captured.lines; }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: an awaited promise carries the resource the declaration then holds
      code: 'interface AsyncCapture extends AsyncDisposable { lines: string[] } declare function open(): Promise<AsyncCapture>; async function run() { const captured = await open(); captured.lines; }',
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'await using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'await using' },
              output:
                'interface AsyncCapture extends AsyncDisposable { lines: string[] } declare function open(): Promise<AsyncCapture>; async function run() { await using captured = await open(); captured.lines; }',
            },
          ],
        },
      ],
    },
    {
      // Firing with no suggestion: `await using` needs an enclosing `async` function, which this one is not
      code: `${asyncCapture} function run() { const captured = acquireAsync(); captured.lines; }`,
      errors: [{ messageId: 'unboundDisposable', data: { keyword: 'await using', kind: 'const' }, suggestions: [] }],
    },
    {
      // Firing with no suggestion: rebinding the keyword would bind the sibling declarator too
      code: `${capture} function run() { const captured = acquire(), count = 1; captured.lines; count; }`,
      errors: [{ messageId: 'unboundDisposable', data: { keyword: 'using', kind: 'const' }, suggestions: [] }],
    },
    {
      // Firing: a block at module level is a scope of its own, and the walk to an enclosing function finds none
      code: `${capture} declare const flag: boolean; if (flag) { const captured = acquire(); captured.lines; }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} declare const flag: boolean; if (flag) { using captured = acquire(); captured.lines; }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a bare block at module level
      code: `${capture} { const captured = acquire(); captured.lines; }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} { using captured = acquire(); captured.lines; }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a loop body at module level
      code: `${capture} for (const size of [1]) { const captured = acquire(); captured.lines; }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} for (const size of [1]) { using captured = acquire(); captured.lines; }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a `try` block at module level
      code: `${capture} try { const captured = acquire(); captured.lines; } finally {}`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} try { using captured = acquire(); captured.lines; } finally {}`,
            },
          ],
        },
      ],
    },
    {
      // Firing: a class static block, which exits like any other block
      code: `${capture} class Runner { static { const captured = acquire(); captured.lines; } }`,
      errors: [
        {
          messageId: 'unboundDisposable',
          data: { keyword: 'using', kind: 'const' },
          suggestions: [
            {
              messageId: 'bindWithKeyword',
              data: { keyword: 'using' },
              output: `${capture} class Runner { static { using captured = acquire(); captured.lines; } }`,
            },
          ],
        },
      ],
    },
    {
      // Firing: `checkDeclarations` scopes to the declaration half, leaving the discarded half reporting
      code: 'declare function acquire(): Disposable; acquire();',
      options: [{ checkDeclarations: false }],
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
    'declare function acquire(): Disposable; function run() { const resource = acquire(); resource.lines; }',
  ],
  invalid: [],
});
