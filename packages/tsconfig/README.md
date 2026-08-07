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

## License

ISC
