# @williamthorsen/tsconfig

Shared TypeScript base config for Node-only projects. Inlines the settings of [`@tsconfig/strictest`](https://www.npmjs.com/package/@tsconfig/strictest) and adds the Node and build options it leaves out, so a consuming repo declares only what is genuinely its own.

<!-- section:release-notes --><!-- /section:release-notes -->

## Installation

```shell
pnpm add -D @williamthorsen/tsconfig
```

## Quick start

```jsonc
{
  "extends": "@williamthorsen/tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"],
  },
  "include": ["src/"],
}
```

## Adopting the base

Extend the base from every tsconfig in the repo, not from the root alone. A workspace config reaches it either directly or through a config that does:

```jsonc
// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "include": ["src/"],
}
```

Every package whose tsconfig names the base by package specifier must also declare it as a devDependency: TypeScript resolves `extends` from the directory of the config that declares it, so a workspace naming a package it does not depend on resolves nothing.

Once the base is in the chain, delete the options it already supplies with the same value. The inherited value applies either way, and the copy left behind stops tracking the base the next time it changes. An option set to a _different_ value is an override and stays.

A package that extends a framework base such as `astro/tsconfigs/base` or `@tsconfig/svelte` has opted out of this one, which is a supported choice.

## What the base sets

Everything `@tsconfig/strictest` sets, plus the Node and build options it omits:

| Option                       | Value                             |
| ---------------------------- | --------------------------------- |
| `allowImportingTsExtensions` | `true`                            |
| `lib`                        | `["ES2025", "ESNext.Disposable"]` |
| `module`                     | `"NodeNext"`                      |
| `moduleDetection`            | `"force"`                         |
| `noEmit`                     | `true`                            |
| `removeComments`             | `true`                            |
| `target`                     | `"ES2025"`                        |

`target` and `lib` are pinned to a Node 24 floor. `ESNext.Disposable` supplies the explicit-resource-management declarations (`using`, `Disposable`, `DisposableStack`), which Node 24 implements and no numbered lib yet carries.

## What the consumer owns

The base declares none of these:

- **`types`**: The ambient type packages in scope. Most Node projects want `["node"]`; declaring it narrows the default, which would otherwise pull in every `@types/*` package installed.
- **`paths`**: TypeScript resolves `baseUrl`-less `paths` relative to the file that _declares_ them, so a path alias set in this package would resolve inside `node_modules`. Aliases must be declared by the config that owns the source tree.
- **`jsx`**: Meaningless for the many consumers with no JSX at all.

`include` and `exclude` are likewise the consumer's, since only it knows its own layout.

## Emitting

The base sets `noEmit: true`, on the assumption that a separate build step owns emit. A consumer that builds with this config directly must override `noEmit` and, if it keeps `allowImportingTsExtensions`, pair that with `rewriteRelativeImportExtensions` so `./foo.ts` specifiers survive the rewrite.

## Checking your configuration

This package ships a [ReadyUp](https://www.npmjs.com/package/readyup) kit that checks whether your tsconfigs are wired for the version you have installed. It is a migration aid rather than a CI gate: only a Node floor too old to run the base's ES year is reported as an error, and everything else caps at a warning.

Run it once:

```shell
pnpm exec rdy run --from npm:@williamthorsen/tsconfig
```

Or list it in `.config/readyup.config.ts` to include it whenever you run `rdy run --packages`:

```ts
import { defineRdyConfig } from 'readyup';

export default defineRdyConfig({
  packages: ['@williamthorsen/tsconfig'],
});
```

The kit needs readyup 0.33.0 or later, declared as an optional peer. Below that, readyup does not report the repo root among a monorepo's workspaces, so the kit checks every member package and leaves the root unchecked.

The kit walks each workspace tsconfig's `extends` chain and reports four things:

- **Adoption**: a tsconfig reaching neither this base nor a framework base. A tsconfig naming this base through a specifier that does not resolve is reported separately, as declared but not installed.
- **Re-declaration**: an option restated with the base's own value. A key that a framework base in the same chain also declares is exempt, since restating it is how a config wins against that base.
- **ES year**: a `target` or `lib` declaring a year other than the base's, read from the base you extend rather than from a constant compiled into the kit.
- **Node floor**: an `engines.node` below the major that implements that ES year. This is the one failure `tsc` cannot surface on its own, which is why it alone is an error.

The kit runs at the version resolved from your `node_modules`, so it reports whether your configuration matches that version. It never reports whether that version is current.

## License

ISC
