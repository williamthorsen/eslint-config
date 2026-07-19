# Migrating to eslint-config-typescript v6

Walks a consumer of `@williamthorsen/eslint-config-typescript` v5.x through the upgrade to v6. The upgrade has three coupled legs: the runtime floor (Node and ESLint), the package upgrade itself, and the projectService migration that removes per-repo parser wiring.

## Prerequisites

v6 requires:

- Node `^22.13.0 || >=24` — support for Node 18 and 20 is dropped.
- ESLint 10.

## Step 1: upgrade the toolchain

Raise Node first if needed (for example in `.tool-versions`), then upgrade the packages together:

```shell
pnpm add --save-dev eslint@latest @williamthorsen/eslint-config-typescript@latest
```

## Step 2: migrate to the project service

v6 supplies typescript-eslint's project service itself: each linted file's owning `tsconfig.json` is discovered automatically. Consumers no longer wire type information by hand.

1. **Remove `parserOptions.project`** from every ESLint config (root and workspaces). Leaving it set now throws `Enabling "project" does nothing when "projectService" is enabled`.
2. **Delete every `tsconfig.eslint.json`**, first folding any lint-only `include` entries into the real `tsconfig.json`. Widening `include` is safe when the config is typecheck-only (`noEmit`).
3. **Keep `tsconfigRootDir`** — it is the one parser option that remains, anchoring resolution at the repo root regardless of how ESLint is launched.

Before (v5):

```js
// eslint.config.js
import tsConfig from '@williamthorsen/eslint-config-typescript';

export default [
  ...tsConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
```

After (v6):

```js
// eslint.config.js
import tsConfig from '@williamthorsen/eslint-config-typescript';

export default [
  ...tsConfig,
  {
    languageOptions: {
      parserOptions: {
        // Anchor the project service at the repo root.
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
```

Every linted `.ts`/`.tsx` file must now belong to a discoverable `tsconfig.json` through its `include`. A file the build excludes (a root-level test directory, say) must be added to some `tsconfig.json`'s `include`, or ESLint reports it as not found in any project. See [Type-aware linting](../packages/typescript/README.md#type-aware-linting) in the package README for the full requirements.

## Step 3: clean up

- Remove `@eslint/js` from your `devDependencies` if you only added it to satisfy this package — since v6.0.1 the config declares it as a direct dependency.

## What may newly fail

The recommended and strict presets may surface findings that v5 missed: a custom rule now flags `Array#map` calls whose results are discarded, and previously broken React presets now load and lint. Treat new findings as real; they were always violations.

## Verify

```shell
pnpm exec eslint .
```

Repos derived from `templates.node-monorepo` can confirm the migration is complete with the template's drift kit:

```shell
pnpm exec rdy run --from github:williamthorsen/templates.node-monorepo
```
