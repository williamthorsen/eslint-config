# @williamthorsen/strict-lint

Run ESLint with all warnings promoted to errors — except for an allowlist that stays as warnings. Ships a `strict-lint` binary that drops in for `eslint` in CI, plus a programmatic API.

<!-- section:release-notes --><!-- /section:release-notes -->

## Installation

```shell
pnpm add -D @williamthorsen/strict-lint eslint
```

Requires ESLint 9+ (flat config).

## Quick start

In CI, use `strict-lint` instead of `eslint`:

```shell
strict-lint .
```

Every warning emitted by your ESLint config becomes an error and fails the run, except for rules in the built-in allowlist (rules that are intentionally advisory, like `@typescript-eslint/no-deprecated`). The CLI accepts the same flags as `eslint` and forwards them through.

## How it works

1. Loads your `eslint.config.js` (auto-discovered via parent walk, or `--config <path>`).
2. Rewrites every rule whose severity is `'warn'` to `'error'`, except those listed in `maxSeverity`.
3. Runs ESLint via the Node API and exits non-zero on any errors.

`maxSeverity` is the resolved allowlist, computed by merging — in increasing precedence — built-in defaults, `.config/strict-lint.config.ts`, and any `maxSeverity` passed programmatically.

## Configuration

Create `.config/strict-lint.config.ts` next to your ESLint config to extend or replace the default allowlist:

```ts
// .config/strict-lint.config.ts
import type { StrictLintConfig } from '@williamthorsen/strict-lint';

const config: StrictLintConfig = {
  maxSeverity: {
    // keep these as warnings (don't promote to error)
    'unicorn/no-array-reduce': 'warn',
    'unicorn/no-nested-ternary': 'warn',
    // explicitly opt this rule into error promotion (overrides the built-in default)
    '@typescript-eslint/no-deprecated': 'error',
  },
};

export default config;
```

The config file is loaded with `tsx`, so TypeScript syntax works without a build step.

## CLI reference

```
strict-lint [options] [file|dir|glob...]
```

`strict-lint` accepts the same arguments as `eslint`. Positional arguments default to `.` (lint the current directory).

| Option                         | Description                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `-c, --config <path>`          | Path to `eslint.config.js`                                                   |
| `--rule <name:severity>`       | Override a single rule (repeatable). Severity: `off` \| `warn` \| `error`.   |
| `--fix`                        | Auto-fix problems                                                            |
| `--fix-dry-run`                | Compute fixes but do not write                                               |
| `--fix-type <type>`            | Limit fix kinds (repeatable): `directive`, `problem`, `suggestion`, `layout` |
| `--ignore-pattern <glob>`      | Add an ignore pattern (repeatable)                                           |
| `--no-ignore`                  | Disable ignore globs                                                         |
| `--error-on-unmatched-pattern` | Error if a pattern matches no files                                          |
| `--pass-on-no-patterns`        | Exit 0 if no files match                                                     |
| `--no-inline-config`           | Disable inline `eslint-disable` directives                                   |
| `--cache`                      | Enable result caching                                                        |
| `--cache-location <path>`      | Cache file location                                                          |
| `--cache-strategy <s>`         | `content` or `metadata`                                                      |
| `--warn-ignored`               | Surface ignored files as warnings                                            |
| `--stats`                      | Include rule timing stats                                                    |
| `--flag <name>`                | ESLint feature flag (repeatable)                                             |
| `--concurrency <n\|auto\|off>` | Concurrency limit                                                            |
| `--quiet`                      | Show only errors, hide warnings                                              |
| `--max-warnings <n>`           | Fail if warnings exceed `n`. `-1` disables.                                  |
| `-f, --format <name>`          | Formatter (default: `stylish`)                                               |
| `-o, --output-file <path>`     | Write formatter output to a file                                             |

`--rule` example:

```shell
strict-lint --rule 'no-console: warn' --rule 'no-debugger: error' src/
```

CLI rule overrides take the highest precedence — they apply after errorization and after any programmatic overrides.

## Programmatic API

```ts
import { strictLint } from '@williamthorsen/strict-lint';

await strictLint({
  baseConfig: myEslintConfigArray,
  patterns: ['src/**/*.ts'],
  maxSeverity: { 'unicorn/no-array-reduce': 'warn' },
  ruleOverrides: { 'no-console': 'error' },
});
```

| Option          | Type                                         | Description                                               |
| --------------- | -------------------------------------------- | --------------------------------------------------------- |
| `baseConfig`    | `Linter.Config[]`                            | Use this config instead of loading `eslint.config.js`.    |
| `patterns`      | `string[]`                                   | Files or globs to lint (default: `['.']`).                |
| `maxSeverity`   | `Record<string, 'warn' \| 'error'>`          | Keep listed rules at this severity; skip error promotion. |
| `ruleOverrides` | `Record<string, 'off' \| 'warn' \| 'error'>` | Force rule severity (applied after errorization).         |

`strictLint()` reads `process.argv` and merges CLI flags with the programmatic options. CLI rule overrides win over programmatic ones.

### Built-in allowlist defaults

These rules are kept as warnings out of the box. Set them to `'error'` in your config to promote them.

```
@typescript-eslint/no-deprecated
@typescript-eslint/no-unnecessary-type-arguments
unicorn/consistent-function-scoping
unicorn/no-array-reduce
unicorn/no-lonely-if
unicorn/no-negated-condition
unicorn/no-nested-ternary
unicorn/no-useless-undefined
unicorn/numeric-separators-style
unicorn/prefer-global-this
unicorn/prefer-dom-node-text-content
unicorn/prefer-includes
unicorn/prefer-node-protocol
unicorn/prefer-number-properties
unicorn/prefer-query-selector
unicorn/prefer-string-raw
unicorn/prefer-string-slice
unicorn/prefer-string-starts-ends-with
unicorn/prefer-ternary
unicorn/prefer-top-level-await
unicorn/prefer-type-error
unicorn/text-encoding-identifier-case
```

## Recommended setup

Define both a normal lint script and a strict one, and run the strict one in CI:

```jsonc
// package.json
{
  "scripts": {
    "lint:check": "eslint .",
    "lint:strict": "strict-lint .",
  },
}
```

- Local dev uses `lint:check`, where warnings stay warnings.
- CI uses `lint:strict`, where warnings break the build — except for the allowlist you've curated.

This pattern lets you enable a stricter rule as a warning, watch it appear in local output for a while, and then promote it to an error in CI by simply removing it from `maxSeverity`.

## Peer dependencies

| Dependency | Required |
| ---------- | -------- |
| `eslint`   | `>=9`    |

## License

ISC.
