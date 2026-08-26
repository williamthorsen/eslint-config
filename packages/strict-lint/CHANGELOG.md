# Changelog

All notable changes to this project will be documented in this file.

## 11.1.0 — 2026-08-26

### 🎉 Features

- Report lint rules that repeat the shared config (#166)

  `strict-lint` gains an optional check for dead entries in an ESLint config -- that is, rules that can merely duplicate rules set by shared configs that the config extends. Naming the shared configs in `.config/strict-lint.config.ts` enables the check. Findings are advisory and do not trigger a non-zero exit code.

### ♻️ Refactoring

- Replace strict-lint's hand-rolled test mocks with toolbelt helpers (#175)

  Replaces the hand-rolled `process.exit`, `process.argv`, and console mocks in `@williamthorsen/strict-lint`'s tests with shared helpers from `@williamthorsen/toolbelt.vitest` and `@williamthorsen/toolbelt.testing`. Both packages join `packages/strict-lint` as devDependencies. The mocked exit now throws instead of returning, so a test ends at the exit, just as a real run does.

  Narrows `strictLint`'s `try` to the lint itself. The function exits for two reasons: The lint found errors, or the lint crashed. Both exits used to sit inside one `try`. The `catch` written for a crash therefore caught the exit that reports errors, logged it as a crash, and exited again. Under a throwing mock, the tests would have measured that second exit.

- Align function names with naming conventions (#181)

  Renames functions in the `tsconfig`, `eslint-config-typescript`, and `strict-lint` workspaces to align with naming conventions.

## 11.0.0 — 2026-08-12

### 🎉 Features

- Add an init command that scaffolds a config file (#163)

  Adds `strict-lint init`, which scaffolds a `.config/strict-lint.config.ts` in the working directory. `--dry-run` reports without writing, `--force` replaces a diverged config, and a config already matching the template is left untouched and reported as up to date. A locally installed package is not required; the command can be run via `npx @williamthorsen/strict-lint init`.

  Separately, the help flag (`-h` or `--help`) is now usable both with the bare `strict-lint` command and its `strict-lint init` subcommand.

- 🚨 **Breaking:** Enforce package-json/specify-peers-locally (#165)

  Enforces `package-json/specify-peers-locally`. Every peer dependency a package declares must also appear in its own `devDependencies`; in a pnpm workspace a catalog entry satisfies it without repeating the version.

  Migration: A consumer relying on the workspace root's hoisting or on pnpm's `autoInstallPeers` to resolve its peers gets new errors until each peer is declared locally.

## 10.0.0 — 2026-08-11

### 🎉 Features

- 🚨 **Breaking:** Require author, engines, and publish metadata in package.json (#162)

  Adds six `package-json` rules to `@williamthorsen/eslint-config-typescript` and removes three overrides that suppressed rules the plugin's `recommended` preset supplies. Every `package.json` must now declare `author` and `engines` and carry no empty field; one that publishes must also declare `bugs`, `homepage`, `keywords`, `repository`, and `sideEffects`, and may not take a dependency on a local path. `specify-peers-locally` is the only rule the config still disables.

### 📦 Dependencies

- Upgrade to toolbelt.filesystem v0.3.0 (#156)

  Upgrades `@williamthorsen/toolbelt.filesystem` to 0.3.0 and adds `@williamthorsen/toolbelt.packaging` 0.2.0 as a second runtime dependency.

### 🤖 Agentic support

- Update AGENTS.md (#161)

  Updates project guidance in AGENTS.md. In particular, most information about the `nmr` task runner has been removed in deference to the guidance bundled with `nmr` itself. `nmr check` is now promoted as the usual check in place of the much slower, and usually unnecessary, `nmr ci`.

## 9.4.0 — 2026-08-07

### 🎉 Features

- Support explicit resource management for consumers (#148)

  Adds `ESNext.Disposable` to the libraries recognized by TypeScript in the exported base config. This enables the use of `using` and `await using` declarations.

## 9.3.0 — 2026-08-04

### 🎉 Features

- Resolve config per linted file and support concurrency (#141)

  `strict-lint` now reports what `eslint` reports for every package in a monorepo. It is no longer necessary to have a separate run per workspace for correct results. A package's own `.config/strict-lint.config.ts` now sets the severity ceilings for that package's files, whichever directory the run starts from.

  `--concurrency` now works and is off by default, as it is in `eslint`. It is unavailable when an ESLint config is supplied programmatically.

  Linting with a TypeScript ESLint config now requires `jiti`. Such a config may now use any TypeScript syntax, not only the subset that can be stripped to plain JavaScript.

### 🐛 Bug fixes

- Stop printing a blank line when nothing is reported (#140)

  Fixes an issue where a `strict-lint` run that found no problems still printed a blank line, potentially resulting in many blank lines when run recursively in a monorepo. Separately, when a run exceeds its `--max-warnings` threshold with nothing else to report, the message saying so now starts at the top of the output instead of below a blank line.

### ⚙️ Tooling

- Migrate the test suite to nmr's isolation tiers (#137)

  Changes Vitest configuration so that test suites are selected by a tier ("unit", "tool", "localhost", and "remote") corresponding to the services they use. `nmr test:unit` and `nmr test:tool` each run one of these; `nmr test:all` runs every suite. A test verifies that all test file names include the tier infix. `nmr test:integration` no longer exists, and no tests carry the `.int.` infix.

## 9.2.0 — 2026-08-02

### 🎉 Features

- Add defineConfig for authoring strict-lint configs (#133)

  Adds a `defineConfig` helper function for authoring the `strict-lint` config file.

### 🐛 Bug fixes

- Correct misbehaving Vitest rules (#132)

  Corrects some Vitest rules that were triggering broken behavior in repos using them. The Vitest config is now used in this repo's own linting configuration; some violations surfaced by the newly enabled rules have been fixed. The ESLint config for TypeScript now exports `patterns.testFiles`, an array of file patterns commonly used for tests.

## 9.1.0 — 2026-08-01

### 🎉 Features

- Accept every ESLint severity as a maxSeverity ceiling (#127)

  The max-severity feature of `strict-lint` now accepts every ESLint severity, instead of only `'warn'` and `'error'`. A rule's severity can also be set to `undefined`, which unsets a value inherited for that rule.

### ⚙️ Tooling

- Migrate Vitest configs to the nmr projects model (#126)

  The suite in which a test runs is now determined by filename alone: An `.int.` infix marks an integration test; an `.app.` marks an app test; and anything else under `__tests__` runs as a unit test. Integration tests are again excluded from the default test run and from the standard check, and are instead run by `nmr test:integration`. A new workspace picks up the same rules without a test config.

## 9.0.1 — 2026-07-26

### ⚙️ Tooling

- Consume TypeScript config from source (#121)

  Simplifies the repo's own ESLint configuration and migrates the configuration to TypeScript. Tooling no longer depends on a build step; `nmr build` now serves publishing alone. The `strict-lint` command runs its compiled entry point directly instead of a committed launcher. `tsx` is no longer a dependency.

## 9.0.0 — 2026-07-24

### 🎉 Features

- 🚨 **Breaking:** Bound config discovery and remove the built-in allowlist (#115)

  `strict-lint` now stops at the project root when walking up the directory tree to find configs. Within the project, all configs on the path from the project root to the directory where the command is run are merged; later settings prevail. A new `--debug` flag reports the resolved project root and the config files that contributed.

  `@williamthorsen/strict-lint` no longer carries built-in exemptions: The style and modernization rules that used to stay warnings now fail the lint run unless a config exempts them. Projects that want the previous exemptions can now import them from `@williamthorsen/eslint-config-typescript`, which exports that set of downgrades as `advisoryRuleSeverities`.

### 🐛 Bug fixes

- Apply the nearest strict-lint config found from the working directory (#112)

  Fixes the issue that `strict-lint`, if run from a workspace, would ignore the workspace-level `strict-lint` configuration if no ESLint configuration file existed at the same level. `strict-lint` now finds its configuration by searching upward from the directory the run starts in, rather than from the nearest ESLint config. The nearest configuration is used outright; configurations at farther levels are ignored rather than merged into it. The search ascends to the filesystem root.

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
