# Changelog

All notable changes to this project will be documented in this file.

## 0.6.1 — 2026-08-27

### 🐛 Bug fixes

- Restore the repo root to both readiness kits' search directories (#187)

  Fixes an issue where the readiness kits in `@williamthorsen/tsconfig` and `@williamthorsen/eslint-config-typescript` skipped the repo root in a monorepo running readyup below 0.33.0. Each kit now supplies the root itself, so the sweep is whole under any readyup version.

## 0.6.0 — 2026-08-26

### 🎉 Features

- 🚨 **Breaking:** Declare readyup as an optional peer of both kit-shipping packages (#179)

  Declares `readyup` as an optional peer dependency of `@williamthorsen/tsconfig` and `@williamthorsen/eslint-config-typescript`, with a `>=0.33.0` floor. Both packages ship readiness kits that run against the consumer's own readyup, and below 0.33.0 that readyup omits the repo root from a monorepo's workspace list, so the kits check every member package and leave the root unchecked.

  Both kits now take readyup's workspace list directly, dropping the root literal each carried to compensate for the older behavior.

  Migration: A consumer running `rdy` against either kit upgrades `readyup` to 0.33.0 or later.

### ♻️ Refactoring

- Align function names with naming conventions (#181)

  Renames functions in the `tsconfig`, `eslint-config-typescript`, and `strict-lint` workspaces to align with naming conventions.

## 0.5.0 — 2026-08-11

### 🎉 Features

- 🚨 **Breaking:** Require author, engines, and publish metadata in package.json (#162)

  Adds six `package-json` rules to `@williamthorsen/eslint-config-typescript` and removes three overrides that suppressed rules the plugin's `recommended` preset supplies. Every `package.json` must now declare `author` and `engines` and carry no empty field; one that publishes must also declare `bugs`, `homepage`, `keywords`, `repository`, and `sideEffects`, and may not take a dependency on a local path. `specify-peers-locally` is the only rule the config still disables.

### 🐛 Bug fixes

- Accept a source-path import in the kit's extends check (#155)

  Fixes an issue where the readiness check bundled with `@williamthorsen/eslint-config-typescript` reported that this repo's root ESLint config did not extend the package. The kit now accepts that an import via the workspace path is equivalent.

### 🤖 Agentic support

- Update AGENTS.md (#161)

  Updates project guidance in AGENTS.md. In particular, most information about the `nmr` task runner has been removed in deference to the guidance bundled with `nmr` itself. `nmr check` is now promoted as the usual check in place of the much slower, and usually unnecessary, `nmr ci`.

## 0.4.0 — 2026-08-09

### 🎉 Features

- Add a bundled readyup kit that checks tsconfig adoption and alignment (#152)

  Adds a readiness check to `@williamthorsen/tsconfig` that reports, package by package, whether a repo has adopted the base config and stayed aligned with it. A package that extends a framework's own base is reported as having opted out. The Node floor is the only finding that fails the check; the rest is advisory. The check is run with `pnpm exec rdy run --from npm:@williamthorsen/tsconfig`.

## 0.3.0 — 2026-08-07

### 🎉 Features

- Support explicit resource management for consumers (#148)

  Adds `ESNext.Disposable` to the libraries recognized by TypeScript in the exported base config. This enables the use of `using` and `await using` declarations.

## 0.2.1 — 2026-08-04

### ⚙️ Tooling

- Migrate the test suite to nmr's isolation tiers (#137)

  Changes Vitest configuration so that test suites are selected by a tier ("unit", "tool", "localhost", and "remote") corresponding to the services they use. `nmr test:unit` and `nmr test:tool` each run one of these; `nmr test:all` runs every suite. A test verifies that all test file names include the tier infix. `nmr test:integration` no longer exists, and no tests carry the `.int.` infix.

## 0.2.0 — 2026-08-02

### 🎉 Features

- Add defineConfig for authoring strict-lint configs (#133)

  Adds a `defineConfig` helper function for authoring the `strict-lint` config file.

## 0.1.1 — 2026-08-01

### 🐛 Bug fixes

- Inline @tsconfig/strictest instead of extending it (#129)

  Fixes an issue where, under pnpm, tools that resolve tsconfig files without following symlinks failed to find `@tsconfig/strictest`, breaking lint runs and builds in projects that declare only `@williamthorsen/tsconfig`. Consuming projects no longer need to add `@tsconfig/strictest` to their own `package.json` as a workaround.

## 0.1.0 — 2026-07-23

### 🎉 Features

- 🚨 **Breaking:** Publish a shared TypeScript config on a Node 24 floor (#108)

  Introduces `@williamthorsen/tsconfig`, a published baseline that Node-only TypeScript projects can extend. It pairs the strictest available TypeScript settings with additional Node and build options. A consumer is left to declare its own ambient types, path aliases, JSX, and file globs.

  `@williamthorsen/eslint-config-typescript` now requires Node 24 or later.

<!-- Generated by release-kit. Do not edit this file. Use .meta/changelog-overrides.json to override entries. -->
