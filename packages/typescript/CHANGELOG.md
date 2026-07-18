# Changelog

All notable changes to this project will be documented in this file.

## 6.0.0 — 2026-07-18

### 🎉 Features

- 🚨 **Breaking:** Adopt projectService in the published TypeScript config (#86)

  The TypeScript preset now resolves each file's owning `tsconfig.json` itself, so type-aware linting no longer needs per-repo parser wiring. Consumers no longer set `parserOptions.project` or maintain a lint-only `tsconfig.eslint.json`; the only setting they keep is `tsconfigRootDir`.

  Upgrading is breaking: Remove any `parserOptions.project` and ensure every linted TypeScript file belongs to a discoverable `tsconfig.json`, folding any lint-only `tsconfig.eslint.json` include globs into the real `tsconfig.json` before deleting it.

### 🧪 Tests

- Add a test suite to the typescript package and fix the defects it surfaced (#79)

  Fixes four defects in the package's opt-in config presets and custom lint rules. `createConfig.react()` now loads under ESLint 10 instead of erroring at config load, and the React strict preset now loads instead of failing. One custom rule now reports a violation instead of crashing the lint run when it matches, and another now flags discarded `Array#map` results that it previously missed — so projects using the recommended or strict preset may see new lint findings where `map` is called only for its side effects.

### ⚙️ Tooling

- Migrate the build to nmr-compile by converging packages on the canonical src/ layout (#75)

  The two compiled packages now build on the project's shared build tooling, so upgrading that tooling no longer risks silently breaking either package's build. Anyone importing either package's main entry now receives its type declarations — one of the two previously shipped its main entry without them.

- Reduce tsconfigs to deviations from TypeScript 6 defaults (#83)

  Streamlines TypeScript configs by removing settings that were identical to the default.

  Two behavior changes are included: Unused function parameters now raise a type error (prefix a parameter's name with `_` to exempt one), and the compilation target now matches the supported Node version instead of trailing it.

### 📦 Dependencies

- 🚨 **Breaking:** Upgrade dependencies to latest and drop Node 18/20 support (#78)

  Consuming a published config now requires ESLint 10 and Node `^22.13.0 || >=24`; support for Node 18 and 20 is dropped.

## 5.17.4 — 2026-05-01

### 🐛 Bug fixes

- Declare `@typescript-eslint/utils` as a peer dependency (#67)

  Fixes `ERR_MODULE_NOT_FOUND` failures in consumers of `@williamthorsen/eslint-config-typescript` whose pnpm graph does not happen to hoist `@typescript-eslint/utils` into a location reachable from the eslint-config's compiled files. The package's compiled rules import `@typescript-eslint/utils` at runtime, but it was previously declared only in `devDependencies` — so pnpm's strict isolation could leave it unreachable depending on the consumer's resolution graph. Declaring it as a peer dependency makes the contract explicit and ensures consumers resolve a single shared copy.

### ⚙️ Tooling

- Adopt the nmr script runner (#58)

  Replaces the hand-rolled `run-workspace-script.ts` infrastructure and custom utility scripts with `@williamthorsen/nmr`, a context-aware script runner for pnpm monorepos. The root `package.json` scripts go from ~30 entries to 3 (`ci`, `postinstall`, `prepare`), and the consistency tests are replaced with a single `runConsistencyChecks` import from nmr. In total, ~635 lines are removed and ~76 added.

## 5.17.1 — 2026-03-28

### 🐛 Bug fixes

- Fix broken next config with @next/eslint-plugin-next 16.x (#53)

  Update `configs/next.ts` and its ambient type declaration to use the `@next/eslint-plugin-next` 16.x API, which moved flat config exports from `flatConfig` to `configs` with kebab-case keys.

### ♻️ Refactoring

- Defer loading of optional config modules (#54)

  Replaces static imports of the 5 optional config modules (`jsx-a11y`, `next`, `react`, `testing-library`, `vitest`) with inline dynamic `import()` wrappers in `createConfig`. Fixes the `./plugins` export path, which incorrectly pointed to `configs/index.js` instead of `plugins/index.js`.

## 5.12.2 — 2026-03-09

### 🎉 Features

- Replace jsonc/sort-keys with eslint-plugin-package-json (#37)

  Replaces the hand-maintained `jsonc/sort-keys` package.json ordering configuration with `eslint-plugin-package-json`'s `recommended` and `stylistic` configs in both the `basic` and `typescript` ESLint config packages. This eliminates ~190 lines of manually maintained key-order rules and delegates to `sort-package-json`'s canonical ordering.

### 📦 Dependencies

- Upgrade all deps to latest compatible version (#33)

  Upgrades all dependencies to the latest compatible version across the monorepo. Includes 8 major version bumps, a deprecated package migration, parser import adaptations for breaking ESM changes, a pre-existing tsconfig bug fix, and audit-ci allowlist entries for transitive dev-only vulnerabilities.

  Major upgrades:
  - @types/node 22 → 25
  - globals 16 → 17
  - eslint-plugin-unicorn 62 → 63
  - eslint-plugin-jsonc 2 → 3, jsonc-eslint-parser 2 → 3
  - eslint-plugin-yml 1 → 3, yaml-eslint-parser 1 → 2
  - glob 11 → 13
  - vite-tsconfig-paths 5 → 6

  Replaced deprecated eslint-plugin-markdown with @eslint/markdown.

  Adapted parser imports to namespace imports (`import * as`) required by jsonc-eslint-parser v3 and yaml-eslint-parser v2, which dropped default exports.

  Fixed pre-existing bug in tsconfig.eslint.json where `include` patterns failed to resolve linted files, causing 27 parserOptions errors.

  Deduplicated lockfile and added audit-ci allowlist entries for 6 transitive dev-only vulnerabilities (3 × minimatch via ESLint 9, rollup via vite, ajv via eslint, js-yaml via changesets).

<!-- Generated by release-kit. Do not edit this file. Use .meta/changelog-overrides.json to override entries. -->
