# @williamthorsen/tsconfig

Shared TypeScript base config for Node-only projects. Composes [`@tsconfig/strictest`](https://www.npmjs.com/package/@tsconfig/strictest) and adds the Node and build options it leaves out, so a consuming repo declares only what is genuinely its own.

<!-- section:release-notes --><!-- /section:release-notes -->

## Installation

```shell
pnpm add -D @williamthorsen/tsconfig
```

`@tsconfig/strictest` comes along as a dependency; it does not need to be installed separately.

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

Everything from `@tsconfig/strictest`, plus the Node and build options strictest omits:

| Option                       | Value        |
| ---------------------------- | ------------ |
| `allowImportingTsExtensions` | `true`       |
| `lib`                        | `["ES2025"]` |
| `module`                     | `"NodeNext"` |
| `moduleDetection`            | `"force"`    |
| `noEmit`                     | `true`       |
| `removeComments`             | `true`       |
| `target`                     | `"ES2025"`   |

`target` and `lib` are pinned to a Node 24 floor.

## What the consumer owns

The base deliberately declares none of these:

- **`types`** — the ambient type packages in scope. Most Node projects want `["node"]`; declaring it narrows the default, which would otherwise pull in every `@types/*` package installed.
- **`paths`** — TypeScript resolves `baseUrl`-less `paths` relative to the file that _declares_ them, so a path alias set in this package would resolve inside `node_modules`. Aliases must be declared by the config that owns the source tree.
- **`jsx`** — meaningless for the many consumers with no JSX at all.

`include` and `exclude` are likewise the consumer's, since only it knows its own layout.

## Emitting

The base sets `noEmit: true`, on the assumption that a separate build step owns emit. A consumer that builds with this config directly must override `noEmit` — and, if it keeps `allowImportingTsExtensions`, pair that with `rewriteRelativeImportExtensions` so `./foo.ts` specifiers survive the rewrite.

## License

ISC
