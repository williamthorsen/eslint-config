# Changelog

All notable changes to this project will be documented in this file.

## [strict-lint-v6.1.1] - 2026-03-11

### Bug fixes

- #43 strict-lint|fix: Exit 0 when only warnings are reported (#44)

Replaced the regex-based exit logic in `strictLint()` with an `errorCount` check on ESLint's `LintResult[]` objects. `doLint()` now returns `{ text, errorCount }` and `strictLint()` exits 1 only when `errorCount > 0`. Also refactored `strictLint()` from `.then()/.catch()` promise chaining to `async/await` with `try/catch`.

## [typescript-v5.13.0] - 2026-03-11

### Features

- Ts|feat: Downgrade no-deprecated and tune unicorn and n rule severities

Downgrades `no-deprecated` to warn in eslint-config-typescript so strict-lint's
`maxSeverity` guard can prevent escalation.

Disables overly prescriptive `unicorn` and `n` rules (`no-process-exit`, `no-for-loop`, `prefer-default-parameters`, `prefer-math-min-max`). Downgrades `consistent-function-scoping` to warn.

Adds warn-level `unicorn` rules to the strict-lint `defaultMaxSeverity` map.

- Strict-lint|feat: Prevent escalation of downgraded linting rules

## [typescript-v5.12.4] - 2026-03-11

### Features

- #40 strict-lint|feat!: Add maxSeverity support to exclude rules from escalation (#42)

Add a three-layer `maxSeverity` merge system that controls which rules are excluded from warn-to-error escalation.

Built-in defaults ship with `@typescript-eslint/no-deprecated` set to 'warn'.

A project-level `.config/strict-lint.config.ts` file can override defaults, and programmatic options passed to `strictLint()` take highest precedence.

The `strictLint()` signature changes from positional `baseConfig` to an options object (`StrictLintOptions`).

The `convertWarnToError` function accepts an optional `MaxSeverityMap` that skips escalation for rules mapped to 'warn'.

A new `loadStrictLintConfig` loader uses tsx's `tsImport` to dynamically load TypeScript config files with shape validation.

## [typescript-v5.12.3] - 2026-03-10

### Bug fixes

- Fix: strict-lint command not found after build-step modernization
- Strict|fix: src files are missing from distribution
- Strict|fix: Most files are missing from distribution

### Dependencies

- \*|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest minor version

### Refactoring

- \*|refactor: Use explicit .ts extension

### Tooling

- Root|tooling: Simplify Vitest config
- Strict|tooling: Modernize build step
- \*|tooling: Change package registry to from github to npmjs

Publish `strict-lint` and `eslint-config-typescript` packages to npmjs.org. Consume `release-kit` and `toolbelt.objects` from npmjs.org.

## [5.7.1] - 2025-06-28

### Tooling

- \*|tooling: Modernize build toolchain

## [5.6.0] - 2025-05-17

### Dependencies

- \*|deps: Upgrade all deps to latest version
- \*|deps: Reduce duplication of dependencies

## [5.3.0] - 2025-05-04

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [5.2.0] - 2025-04-30

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [5.0.2] - 2025-04-29

### Tooling

- \*|tooling: Use generic workspace script runner

## [4.0.0] - 2025-04-29

### Refactoring

- Strict-lint|refactor: Fix lint

## [3.4.0] - 2025-04-28

### Dependencies

- \*|deps: Upgrade all deps to latest version

### Refactoring

- \*|refactor: Fix lint

## [3.3.0] - 2025-04-06

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.2.2] - 2025-03-23

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.2.1] - 2025-03-03

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.2.0] - 2025-02-23

### Dependencies

- \*|deps: Upgrade all deps to latest minor version

### Formatting

- \*|fmt: Autoformat

### Tooling

- \*|tooling: Remove Deno

## [3.1.1] - 2025-01-04

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.0.0] - 2024-11-04

### Features

- Ts|feat: Modernize configs

## [2.0.0] - 2024-11-03

### Dependencies

- \*|deps: Upgrade all deps to latest minor version

### Features

- Ts|feat: Convert source files to TypeScript
- Ts|feat: Convert source files to TypeScript (2)

## [1.0.0] - 2024-10-12

### Dependencies

- Deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps & runtimes to latest version
- \*|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest version
- - | deps: Upgrade all deps to latest minor version
- - | deps: Upgrade all deps to latest major version
- - | deps: Require v9 or better for ESLint as peer dep
- \*|deps: Upgrade all deps to latest version

Also replaced `@esbuild-kit/esm-loader` with `tsx.

### Documentation

- Docs: Mark all packages as UNLICENSED
- \*|docs: Update all licenses

### Features

- Feat: Add strict-lint script to the Node.js package

### Refactoring

- Strict-lint | refactor: Align with new API

Removed the shims previously needed to support the flat config; that config is now the default.

### Tooling

- Tooling: Enable strict linting in monorepo root & workspaces

<!-- generated by git-cliff -->
