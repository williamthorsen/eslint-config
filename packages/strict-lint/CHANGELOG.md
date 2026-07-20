# Changelog

All notable changes to this project will be documented in this file.

## 8.0.0 — 2026-07-20

### 🎉 Features

- 🚨 **Breaking:** Support .ts ESLint config file types (#104)

  strict-lint now lints projects whose ESLint config is any `eslint.config.*` file — `.ts`, `.mts`, `.cts`, `.mjs`, or `.cjs` — not only `eslint.config.js`. TypeScript configs need no build step or separate transformer. Now requires Node 24 or later.

## 7.0.0 — 2026-07-18

### 🎉 Features

- 🚨 **Breaking:** Adopt projectService in the published TypeScript config (#86)

  The TypeScript preset now resolves each file's owning `tsconfig.json` itself, so type-aware linting no longer needs per-repo parser wiring. Consumers no longer set `parserOptions.project` or maintain a lint-only `tsconfig.eslint.json`; the only setting they keep is `tsconfigRootDir`.

  Upgrading is breaking: Remove any `parserOptions.project` and ensure every linted TypeScript file belongs to a discoverable `tsconfig.json`, folding any lint-only `tsconfig.eslint.json` include globs into the real `tsconfig.json` before deleting it.

### ⚙️ Tooling

- Migrate the build to nmr-compile by converging packages on the canonical src/ layout (#75)

  The two compiled packages now build on the project's shared build tooling, so upgrading that tooling no longer risks silently breaking either package's build. Anyone importing either package's main entry now receives its type declarations — one of the two previously shipped its main entry without them.

- Reduce tsconfigs to deviations from TypeScript 6 defaults (#83)

  Streamlines TypeScript configs by removing settings that were identical to the default.

  Two behavior changes are included: Unused function parameters now raise a type error (prefix a parameter's name with `_` to exempt one), and the compilation target now matches the supported Node version instead of trailing it.

- Simplify nmr config by adopting devBin for strict-lint (#88)

  Consolidates the location of the strict-lint source entry point into a single record in the repo's nmr config, replacing three differently spelled copies. `nmr lint:strict` behaves exactly as before in every context — repo root and workspaces — but a future move of the entry point is now a one-line config change instead of a multi-file hunt, and there is no longer a stale copy that could silently break the command.

### 📦 Dependencies

- 🚨 **Breaking:** Upgrade dependencies to latest and drop Node 18/20 support (#78)

  Consuming a published config now requires ESLint 10 and Node `^22.13.0 || >=24`; support for Node 18 and 20 is dropped.

## 6.3.0 — 2026-05-01

### ⚙️ Tooling

- Adopt the nmr script runner (#58)

  Replaces the hand-rolled `run-workspace-script.ts` infrastructure and custom utility scripts with `@williamthorsen/nmr`, a context-aware script runner for pnpm monorepos. The root `package.json` scripts go from ~30 entries to 3 (`ci`, `postinstall`, `prepare`), and the consistency tests are replaced with a single `runConsistencyChecks` import from nmr. In total, ~635 lines are removed and ~76 added.

## 6.2.1 — 2026-03-28

### 🐛 Bug fixes

- Handle numeric severity 1 in convertWarnToError (#50)

  `convertWarnToError` now handles ESLint's numeric severity `1` in both bare and array forms. The array-form branch no longer incorrectly targets numeric `2` (which was a no-op converting error to error).

## 6.2.0 — 2026-03-23

### 🎉 Features

- Modify strict-lint to accept ESLint CLI arguments (#49)

  Adds full ESLint CLI argument support to `strict-lint`. A new `parseCliArgs` module parses `process.argv` using `node:util` `parseArgs` and maps flags to ESLint constructor options, file patterns, rule overrides, and output-control flags. The programmatic API gains `patterns` and `ruleOverrides` fields for parity.

## 6.1.2 — 2026-03-12

### ⚙️ Tooling

- Migrate to release-kit v1.0.0 CLI (#47)

  Upgrade `@williamthorsen/release-kit` from v0.2.3 to v1.0.0 and migrate from the script-based release preparation to the CLI-driven approach. The CLI auto-discovers workspaces from `pnpm-workspace.yaml`, replacing the manually maintained component list and custom scripts.

## 6.1.1 — 2026-03-11

### 🐛 Bug fixes

- Exit 0 when only warnings are reported (#44)

  Replaced the regex-based exit logic in `strictLint()` with an `errorCount` check on ESLint's `LintResult[]` objects. `doLint()` now returns `{ text, errorCount }` and `strictLint()` exits 1 only when `errorCount > 0`. Also refactored `strictLint()` from `.then()/.catch()` promise chaining to `async/await` with `try/catch`.

## 6.0.0 — 2026-03-11

### 🎉 Features

- 🚨 **Breaking:** Add maxSeverity support to exclude rules from escalation (#42)

  Add a three-layer `maxSeverity` merge system that controls which rules are excluded from warn-to-error escalation.

  Built-in defaults ship with `@typescript-eslint/no-deprecated` set to 'warn'.

  A project-level `.config/strict-lint.config.ts` file can override defaults, and programmatic options passed to `strictLint()` take highest precedence.

  The `strictLint()` signature changes from positional `baseConfig` to an options object (`StrictLintOptions`).

  The `convertWarnToError` function accepts an optional `MaxSeverityMap` that skips escalation for rules mapped to 'warn'.

  A new `loadStrictLintConfig` loader uses tsx's `tsImport` to dynamically load TypeScript config files with shape validation.

<!-- Generated by release-kit. Do not edit this file. Use .meta/changelog-overrides.json to override entries. -->
