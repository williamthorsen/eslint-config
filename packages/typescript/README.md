# @williamthorsen/eslint-config-typescript

Flat-config ESLint preset for TypeScript projects. Covers TypeScript, JavaScript, JSON, YAML, and `package.json` from a single default export, with opt-in framework configs for React, Next.js, JSX A11y, Vitest, and React Testing Library.

<!-- section:release-notes --><!-- /section:release-notes -->

## Installation

```shell
pnpm add -D @williamthorsen/eslint-config-typescript eslint typescript
```

Requires ESLint 9+ and TypeScript 5+.

## Quick start

```js
// eslint.config.ts
import { defineConfig } from 'eslint/config';

import tsConfig from '@williamthorsen/eslint-config-typescript';

export default defineConfig(tsConfig, {
  languageOptions: {
    parserOptions: {
      // Anchor type-aware linting at your repo root.
      tsconfigRootDir: import.meta.dirname,
    },
  },
  // your overrides
});
```

Everything this package exports is typed with ESLint core's own `Config`, so the same composition typechecks unchanged in an `eslint.config.ts`: no `tseslint.config()`, type assertion, or widening cast.

## Type-aware linting

The TypeScript rules are type-aware, and the preset enables typescript-eslint's project service (`parserOptions.projectService`), so each file's owning `tsconfig.json` is discovered automatically; you do **not** set `parserOptions.project`. Two requirements follow:

- Every linted `.ts`/`.tsx` file must belong to a discoverable `tsconfig.json` through its `include`. A file outside every project (for example, a test directory excluded from your build config) must be added to some `tsconfig.json`'s `include`, or ESLint reports it as not found in any project.
- Set `tsconfigRootDir` (as in Quick start) to anchor resolution at your repo root. Without it, resolution falls back to the current working directory, which varies by how ESLint is launched.

## Migrating from `parserOptions.project`

This section covers the parser change alone. For the complete v5 → v6 upgrade (the Node and ESLint floors, the package bump, and post-upgrade cleanup), see [Migrating to v6](../../docs/migrating-to-v6.md).

Earlier versions left type-information wiring to the consumer: you set `parserOptions.project` and usually kept a dedicated `tsconfig.eslint.json`. This version supplies `projectService` itself, so:

1. Remove `parserOptions.project` from your ESLint config. Leaving it set now throws `Enabling "project" does nothing when "projectService" is enabled`.
2. Fold any lint-only `tsconfig.eslint.json` `include` entries into the real `tsconfig.json`, then delete the `tsconfig.eslint.json`. Widening `include` is safe when the config is typecheck-only.
3. Keep only `tsconfigRootDir: import.meta.dirname` in your `parserOptions`.

## What's included

The default export bundles configs for the following surfaces:

| Surface        | File pattern                   | Notable plugins                                                   |
| -------------- | ------------------------------ | ----------------------------------------------------------------- |
| TypeScript     | `**/*.{ts,cts,mts,tsx}`        | `typescript-eslint` (type-aware), `sky-pilot`                     |
| JavaScript     | `**/*.{js,cjs,mjs,jsx}`        | core rules, JS-specific conventions                               |
| Cross-cutting  | all code files                 | `eslint-comments`, `import`, `n`, `simple-import-sort`, `unicorn` |
| JSON / JSON5   | `**/*.{json,json5}`            | `jsonc`                                                           |
| YAML           | `**/*.{yaml,yml}`              | `yml`                                                             |
| `package.json` | `**/package.json`              | `package-json` (recommended + stylistic, plus publish metadata)   |
| Tests          | `**/*.{spec,test}.{js,ts,...}` | strict TypeScript rules relaxed                                   |

Every `package.json` must declare `author` and `engines`, and may not carry an empty field. One that publishes must also declare `bugs`, `homepage`, `keywords`, `repository`, and `sideEffects`, and may not take a dependency on a local path (`file:`, `link:`, or a relative path). Every peer dependency a package declares must also appear in its own `devDependencies`; in a pnpm workspace a [catalog](https://pnpm.io/catalogs) entry (`"eslint": "catalog:"`) satisfies this without repeating the version.

Test files (`*.spec.*` / `*.test.*`) have several strict rules disabled (e.g., `no-unsafe-assignment`, `unbound-method`, `no-extraneous-class`) so spec files don't fight the type checker. Declaration files (`*.d.ts`) have `import/no-duplicates` turned off.

## Custom rules (`sky-pilot`)

Five rules ship in this config's own plugin. The TypeScript config enables them, so they reach `**/*.{ts,cts,mts,tsx}` only; a JavaScript file is unaffected unless you enable them yourself.

| Rule                                    | `recommended` | `strict` | Enforces                                                                               |
| --------------------------------------- | ------------- | -------- | -------------------------------------------------------------------------------------- |
| `sky-pilot/no-floating-disposable`      | `warn`        | `error`  | A disposable resource is bound with `using`, not discarded or left to a plain `const`. |
| `sky-pilot/no-undefined-with-number`    | `error`       | `error`  | `Number()` is never passed a possibly-`undefined` value, which yields `NaN`.           |
| `sky-pilot/no-unpublished-barrel`       | `warn`        | `error`  | A barrel sits only at a module the package publishes.                                  |
| `sky-pilot/no-unused-map`               | `warn`        | `error`  | The result of `Array#map` is used; a discarded one wants `forEach`.                    |
| `sky-pilot/prefer-function-declaration` | `warn`        | `error`  | An untyped function-valued variable is written as a function declaration.              |

`advisoryRuleSeverities` exempts none of these, so [`@williamthorsen/strict-lint`](https://www.npmjs.com/package/@williamthorsen/strict-lint) promotes each warning to an error: they report defects rather than style advice.

`createConfig.react()` adds a sixth rule from a companion plugin, `sky-pilot-react/memoized-functions-returned-by-hook`, which requires that a function a hook returns be memoized.

### `sky-pilot/no-floating-disposable`

Reports a resource that is acquired and never released, in either of the two shapes that leak. The message names `using` or `await using` to match the type, and the rule reads types, so it reports nothing where the parser supplies no TypeScript program.

**A discarded result.** A call or `new` expression whose result is dropped and whose type carries `Symbol.dispose` or `Symbol.asyncDispose`. Such a result does nothing unless it is bound: the resource is acquired and never released, and nothing else reports the mistake, since the call typechecks. An awaited call is read through the `await`, so a discarded `Promise<AsyncDisposable>` reports as well.

```ts
captureOutput(); // reported: the capture is installed and never removed
using captured = captureOutput(); // fine

await openHandle(); // reported: `openHandle` returns a Promise<AsyncDisposable>
await using handle = await openHandle(); // fine
```

**A resource bound to a plain declaration.** A `const`, `let`, or `var` whose initializer acquires a resource the declaring scope then keeps. This leaks exactly as a discarded call does, and less visibly: the variable is read, so `no-unused-vars` reports nothing either.

```ts
function assertsOnOutput() {
  const captured = captureOutput(); // reported: nothing releases the capture
  expect(captured.lines).toEqual(['ready']);
}
```

A suggestion rewrites the declaration keyword, making the fix one editor action. It is withheld where no valid edit exists: an `await using` outside an `async` function, and a declaration holding more than one declarator. The report still fires in both.

`checkDeclarations: false` keeps the discarded half and drops this one:

```js
export default defineConfig(config, {
  rules: {
    'sky-pilot/no-floating-disposable': ['warn', { checkDeclarations: false }],
  },
});
```

#### What the rule leaves alone

Three narrowings apply to both shapes:

- A call that yields its own receiver chains onto a resource the caller already holds, so `server.listen(3000)` is left alone even though a `net.Server` is async-disposable. Either a signature declaring `this` as its return type or a call whose type is the receiver's own qualifies, so a fluent method is covered whether it annotates `this`, annotates its own class type, or leaves the return inferred. The declaration is taken at its word, so a method that builds a fresh resource while declaring one of those returns is skipped too.
- A call whose type is identical to one of its argument types has passed ownership on rather than acquired anything. That is the shape of a registrar such as `<T extends Disposable>(resource: T): T`. The comparison is of types, not resources, so a callee that builds a fresh resource while declaring the type it received on both sides is skipped too.
- An `allow` option names callees whose disposable result is discarded on purpose. It matches the callee's final name, so `timers.setTimeout` matches alongside `setTimeout`, and it adds to the defaults rather than replacing them:

```js
export default defineConfig(config, {
  rules: {
    'sky-pilot/no-floating-disposable': ['warn', { allow: ['registerHandle'] }],
  },
});
```

The defaults are `setImmediate`, `setInterval`, and `setTimeout`: Node's timer globals return a `Timeout` implementing `Symbol.dispose`, so a bare `setTimeout(fn, ms);` would otherwise report.

A declaration is left alone in five further cases, each one a place where `using` would be the wrong binding:

- **The resource escapes.** A variable that is returned, passed as an argument, assigned onward, placed in a literal, reassigned, or read from a nested function belongs to something outliving the declaring scope. Only a member access on the resource itself can keep the declaration reportable.
- **It is handed a callback.** A call on the resource, or on one of its properties, that takes a function argument schedules work the block does not contain, as `child.on('close', resolve)` and `child.stdout.on('data', collect)` do; `using` would release the resource before the callback runs. The argument is recognized by its type, so a named handler counts alongside an inline arrow. No signature distinguishes a retained listener from a synchronous higher-order call, so `captured.lines.forEach(...)` leaves the declaration alone too, and one such reference is enough to do it. An argument whose type withholds the answer, a spread or an `any`, is taken to be one.
- **It sits at module or global scope.** `using` releases a module-level resource at the end of module evaluation, before any importer runs, so a singleton declared there must keep its `const`.
- **It is released by hand.** A `Symbol.dispose` or `Symbol.asyncDispose` call on the variable already frees the resource. Preferring `using` over a hand-written `finally` belongs to `unicorn/prefer-dispose`.
- **A `var` is read past its block.** `using` is block-scoped, so rebinding one would leave the later read out of scope.

A deliberate discard is marked with `void`, or with an inline disable carrying its reason:

```ts
void captureOutput();

// eslint-disable-next-line sky-pilot/no-floating-disposable -- the pool disposes this handle
acquireHandle();
```

typescript-eslint's `no-misused-disposable` covers this ground and more, but it is [still in draft](https://github.com/typescript-eslint/typescript-eslint/pull/12659).

### `sky-pilot/no-unpublished-barrel`

Reports a file whose body holds only imports and re-exports (a barrel) unless the package publishes that module. Importing one symbol through a barrel loads every module the barrel re-exports, so a barrel earns its place at a package's entry point and nowhere else.

The exemption is computed from the linted file's own manifest, so a consuming repo configures nothing. The rule finds the nearest ancestor `package.json`, collects every string appearing anywhere in its `exports` value, and leaves the file alone when either the path its build emits or the file's own package-relative path is among them. Matching the strings rather than the keys covers the bare-string form (`"exports": "./dist/esm/index.js"`) and the conditional-object form alike, and needs no list of condition names. A collected target containing `*` covers every path the `*` spans, `/` included, as Node's subpath patterns do, and one ending in `/` covers everything below it.

That second match is what reaches a package publishing source instead of a build. A manifest naming `./src/mod.ts` states that `src/mod.ts` is an entry point, and no source-to-build mapping could say the same, since the mapping always rewrites the extension. The match disregards `sourceDir`, so a package with no source directory publishes `./mod.ts` the same way, and it matches by the rules above, so a `*` or trailing-slash target spans source paths as it spans built ones.

Where the manifest declares no `exports`, the legacy `bin`, `main`, `module`, and `types` fields name the published paths in its place. A manifest declaring none of them publishes nothing, so every barrel under it is reported: this is the application repository, where no barrel has an entry point to sit at. A file with no ancestor `package.json` at all is reported by nothing, an absent manifest being an absence of information rather than a statement that the package publishes nothing.

Mapping a source path onto the path the build emits is the one input the manifest does not supply. It comes from an option, which defaults to the layout this package itself uses:

```js
export default defineConfig(config, {
  rules: {
    'sky-pilot/no-unpublished-barrel': ['warn', { outDir: 'dist/esm', sourceDir: 'src' }],
  },
});
```

A mapping that does not match the build reports every published entry point rather than going quiet, and the message names both the path it computed and the file's own, so the setting to correct is visible in the report. A package that publishes source needs no such setting, its entry points matching by their own paths.

A file under `__fixtures__`, `__mocks__`, `__tests__`, or `test-utils` is exempt, since test scaffolding ships nothing. A barrel at a vendor boundary, a directory holding the only permitted import site for an external dependency, takes an inline disable comment naming that boundary:

```ts
/* eslint-disable sky-pilot/no-unpublished-barrel -- the sole permitted import site for the vendor SDK */
```

`unicorn/no-barrel-files` detects the same files, but it takes no options, so exempting an entry point through it would mean a glob list in every consuming repo. This config leaves it off.

## Granular config access

The default export is the catch-all "everything on" preset. For à la carte composition, import individual configs:

```js
import { defineConfig } from 'eslint/config';

import { configs } from '@williamthorsen/eslint-config-typescript';

export default defineConfig(
  configs.typeScript,
  configs.import,
  // skip configs.unicorn entirely
);
```

| Config                     | Targets                                    |
| -------------------------- | ------------------------------------------ |
| `configs.javaScript`       | core JavaScript rules                      |
| `configs.typeScript`       | TypeScript rules (type-aware)              |
| `configs.eslintComments`   | `eslint-disable` comment hygiene           |
| `configs.import`           | import order and resolution                |
| `configs.n`                | Node.js (`eslint-plugin-n`) rules          |
| `configs.simpleImportSort` | sorted imports                             |
| `configs.unicorn`          | `eslint-plugin-unicorn` rules              |
| `configs.json`             | JSON rules                                 |
| `configs.json5`            | JSON5 rules (apply _after_ `configs.json`) |
| `configs.packageJson`      | `package.json` rules                       |
| `configs.yaml`             | YAML rules                                 |

## Framework configs (lazy-loaded)

Framework-specific configs are exposed via `createConfig` so their plugin dependencies (`eslint-plugin-react`, `@next/eslint-plugin-next`, etc.) load only when used. Every factory resolves to a config array, so spread each one (or pass them through `extends`):

```js
import { defineConfig } from 'eslint/config';

import config, { createConfig } from '@williamthorsen/eslint-config-typescript';

export default defineConfig(
  config,
  ...(await createConfig.react()),
  ...(await createConfig.jsxA11y()),
  ...(await createConfig.next()),
);
```

Scope the test-oriented factories to your test files rather than spreading them across the whole project. Applied to ordinary source, `vitest/require-hook` reports on every top-level statement:

```js
import { defineConfig } from 'eslint/config';

import config, { createConfig, patterns } from '@williamthorsen/eslint-config-typescript';

export default defineConfig(config, {
  files: patterns.testFiles,
  extends: [await createConfig.vitest(), await createConfig.reactTestingLibrary()],
});
```

`patterns.testFiles` covers JavaScript as well as TypeScript test files. Three of the Vitest rules read type information (`unbound-method`, `valid-title`, and `prefer-describe-function-title`), and each aborts the ESLint run rather than degrading when a file has no parser services, so `createConfig.vitest()` disables all three on JavaScript globs. That makes the scoping above safe whether or not your JavaScript test files get a type-aware parser.

| Method                               | Loads                                              |
| ------------------------------------ | -------------------------------------------------- |
| `createConfig.react()`               | `eslint-plugin-react`, `eslint-plugin-react-hooks` |
| `createConfig.next()`                | `@next/eslint-plugin-next`                         |
| `createConfig.jsxA11y()`             | `eslint-plugin-jsx-a11y`                           |
| `createConfig.reactTestingLibrary()` | `eslint-plugin-testing-library`                    |
| `createConfig.vitest()`              | `@vitest/eslint-plugin`                            |

These plugins are declared as `devDependencies` of this package. Install them yourself in projects that use them.

`createConfig.react()` pins `settings.react.version` to a recent default, because `eslint-plugin-react`'s `'detect'` mode is incompatible with ESLint 10 (it calls a removed API). Override it to match your React version by appending a settings block:

```js
export default defineConfig(config, ...(await createConfig.react()), {
  settings: { react: { version: '18.3' } },
});
```

`createConfig.next()` leaves `settings.next.rootDir` to you, and `no-html-link-for-pages` needs it to be absolute. The plugin globs the value against the working directory, and falls back to that directory where the setting is absent. Under either, a repo linted from anywhere but the app's own directory finds no pages directory, and the rule stops running without failing the lint run:

```js
export default defineConfig(config, ...(await createConfig.next()), {
  settings: { next: { rootDir: import.meta.dirname } },
});
```

## File patterns

For composing your own scoped configs without re-deriving the globs:

```js
import { defineConfig } from 'eslint/config';

import { patterns } from '@williamthorsen/eslint-config-typescript';

export default defineConfig({
  files: patterns.typeScriptFiles,
  rules: {
    // TypeScript-only overrides
  },
});
```

| Constant                        | Value                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `patterns.javaScriptFiles`      | `['**/*.{js,cjs,mjs,jsx}']`                                                  |
| `patterns.typeScriptFiles`      | `['**/*.{ts,cts,mts,tsx}']`                                                  |
| `patterns.codeFiles`            | both of the above                                                            |
| `patterns.testFiles`            | `['**/*.{spec,test}.{js,cjs,mjs,jsx}', '**/*.{spec,test}.{ts,cts,mts,tsx}']` |
| `patterns.javaScriptExtensions` | `['{js,cjs,mjs,jsx}']`                                                       |
| `patterns.typeScriptExtensions` | `['{ts,cts,mts,tsx}']`                                                       |
| `patterns.codeExtensions`       | both                                                                         |

## Advisory rule severities

`advisoryRuleSeverities` maps the rules this config sets (`@typescript-eslint/no-deprecated`, most of the `unicorn` `prefer-*` set, and their neighbours) to `'warn'`, because they report style and modernization advice rather than defects. Rules this config disables outright are not included.

Use it with [`@williamthorsen/strict-lint`](https://www.npmjs.com/package/@williamthorsen/strict-lint) to exempt them from error promotion, so a stricter CI run still fails on genuine defects only:

```ts
// .config/strict-lint.config.ts
import { advisoryRuleSeverities } from '@williamthorsen/eslint-config-typescript';
import { defineConfig } from '@williamthorsen/strict-lint/config';

export default defineConfig({
  maxSeverity: { ...advisoryRuleSeverities },
});
```

Or spread it into an ordinary flat-config `rules` block to set those severities directly:

```js
import { advisoryRuleSeverities } from '@williamthorsen/eslint-config-typescript';

export default [{ rules: { ...advisoryRuleSeverities } }];
```

An unscoped block applies `'warn'` everywhere, including in test files, where this config turns `unicorn/consistent-function-scoping` and `unicorn/no-useless-undefined` off. Scope the block with `files` to keep those exceptions.

## Peer dependencies

| Dependency                 | Required   |
| -------------------------- | ---------- |
| `@typescript-eslint/utils` | `^8.59.1`  |
| `eslint`                   | `>=10`     |
| `readyup`                  | `>=0.33.0` |
| `typescript`               | `>=5`      |

`readyup` is optional, needed only to run the readiness kit described below.

## Checking your configuration

This package ships a [ReadyUp](https://www.npmjs.com/package/readyup) kit that checks whether your project is wired correctly for the version you have installed. It is a migration aid rather than a CI gate: only a failure that stops ESLint loading or running the config is reported as an error, and everything else caps at a warning.

Run it once:

```shell
pnpm exec rdy run --from npm:@williamthorsen/eslint-config-typescript
```

Or list it in `.config/readyup.config.ts` to include it whenever you run `rdy run --packages`:

```ts
import { defineRdyConfig } from 'readyup';

export default defineRdyConfig({
  packages: ['@williamthorsen/eslint-config-typescript'],
});
```

The `readyup >=0.33.0` peer names the version the kit is developed and tested against. Below 0.33.0, readyup does not report the repo root among a monorepo's workspaces, so the kit supplies the root itself and sweeps every member package alongside it.

The kit runs at the version resolved from your `node_modules`, so it reports whether your configuration matches that version. It never reports whether that version is current.

The check that your root config extends this package matches the package specifier as text, or a path into a workspace that provides the package, so a config reaching it through a local re-export or a path alias is reported as not extending it.

The `settings.next.rootDir` check matches `createConfig.next()` or the plugin's own specifier the same way. A config reaching the factory through a local re-export names neither, so one that also sets no `rootDir` goes unreported rather than reporting a wrong failure. One that does set it is still judged on the value it writes.

## License

ISC.
