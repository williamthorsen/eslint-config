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
// eslint.config.js
import tsConfig from '@williamthorsen/eslint-config-typescript';

export default [
  ...tsConfig,
  // your overrides
];
```

## What's included

The default export bundles configs for the following surfaces:

| Surface        | File pattern                   | Notable plugins                                                   |
| -------------- | ------------------------------ | ----------------------------------------------------------------- |
| TypeScript     | `**/*.{ts,cts,mts,tsx}`        | `typescript-eslint` (type-aware), `sky-pilot`                     |
| JavaScript     | `**/*.{js,cjs,mjs,jsx}`        | core rules, JS-specific conventions                               |
| Cross-cutting  | all code files                 | `eslint-comments`, `import`, `n`, `simple-import-sort`, `unicorn` |
| JSON / JSON5   | `**/*.{json,json5}`            | `jsonc`                                                           |
| YAML           | `**/*.{yaml,yml}`              | `yml`                                                             |
| `package.json` | `**/package.json`              | `package-json` (recommended + stylistic)                          |
| Tests          | `**/*.{spec,test}.{js,ts,...}` | strict TypeScript rules relaxed                                   |

Test files (`*.spec.*` / `*.test.*`) have several strict rules disabled (e.g., `no-unsafe-assignment`, `unbound-method`, `no-extraneous-class`) so spec files don't fight the type checker. Declaration files (`*.d.ts`) have `import/no-duplicates` turned off.

## Granular config access

The default export is the catch-all "everything on" preset. For à la carte composition, import individual configs:

```js
import { configs } from '@williamthorsen/eslint-config-typescript';

export default [
  ...configs.typeScript,
  ...configs.import,
  // skip configs.unicorn entirely
];
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
| `configs.json5`            | JSON5 rules — apply _after_ `configs.json` |
| `configs.packageJson`      | `package.json` rules                       |
| `configs.yaml`             | YAML rules                                 |

## Framework configs (lazy-loaded)

Framework-specific configs are exposed via `createConfig` so their plugin dependencies (`eslint-plugin-react`, `@next/eslint-plugin-next`, etc.) load only when used:

```js
import config, { createConfig } from '@williamthorsen/eslint-config-typescript';

export default [
  ...config,
  ...(await createConfig.react()),
  ...(await createConfig.jsxA11y()),
  await createConfig.next(),
  ...(await createConfig.vitest()),
  ...(await createConfig.reactTestingLibrary()),
];
```

| Method                               | Loads                                              |
| ------------------------------------ | -------------------------------------------------- |
| `createConfig.react()`               | `eslint-plugin-react`, `eslint-plugin-react-hooks` |
| `createConfig.next()`                | `@next/eslint-plugin-next`                         |
| `createConfig.jsxA11y()`             | `eslint-plugin-jsx-a11y`                           |
| `createConfig.reactTestingLibrary()` | `eslint-plugin-testing-library`                    |
| `createConfig.vitest()`              | `@vitest/eslint-plugin`                            |

These plugins are declared as `devDependencies` of this package. Install them yourself in projects that use them.

## File patterns

For composing your own scoped configs without re-deriving the globs:

```js
import { patterns } from '@williamthorsen/eslint-config-typescript';

export default [
  {
    files: patterns.typeScriptFiles,
    rules: {
      // TypeScript-only overrides
    },
  },
];
```

| Constant                        | Value                       |
| ------------------------------- | --------------------------- |
| `patterns.javaScriptFiles`      | `['**/*.{js,cjs,mjs,jsx}']` |
| `patterns.typeScriptFiles`      | `['**/*.{ts,cts,mts,tsx}']` |
| `patterns.codeFiles`            | both of the above           |
| `patterns.javaScriptExtensions` | `['{js,cjs,mjs,jsx}']`      |
| `patterns.typeScriptExtensions` | `['{ts,cts,mts,tsx}']`      |
| `patterns.codeExtensions`       | both                        |

## Peer dependencies

| Dependency   | Required |
| ------------ | -------- |
| `eslint`     | `>=9`    |
| `typescript` | `>=5`    |

## License

ISC.
