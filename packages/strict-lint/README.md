# @williamthorsen/strict-lint

Run ESLint with all warnings promoted to errors — except for an allowlist you declare. Ships a `strict-lint` binary that drops in for `eslint` in CI, plus a programmatic API.

<!-- section:release-notes --><!-- /section:release-notes -->

## Installation

```shell
pnpm add -D @williamthorsen/strict-lint eslint
```

Requires ESLint 10+ (flat config) and Node 24+ (for native TypeScript config loading).

## Quick start

In CI, use `strict-lint` instead of `eslint`:

```shell
strict-lint .
```

Every warning emitted by your ESLint config becomes an error and fails the run, except for the rules you allowlist. Out of the box nothing is exempt. The CLI accepts the same flags as `eslint` and forwards them through.

## How it works

1. Loads your ESLint flat config (one of `eslint.config.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, or `.cts`), auto-discovered by walking up from the current directory in ESLint's own priority order, or via `--config <path>`.
2. Rewrites every rule whose severity is `'warn'` to `'error'`, except those listed in `maxSeverity`.
3. Runs ESLint via the Node API and exits non-zero on any errors.

`maxSeverity` is the resolved allowlist, computed by merging — in increasing precedence — every `.config/strict-lint.config.ts` from the project root down to the directory you run from, then any `maxSeverity` passed programmatically. No rule is exempt unless one of those sources says so.

## Configuration

Create `.config/strict-lint.config.ts` at or above the directory you run `strict-lint` from to declare an allowlist:

```ts
// .config/strict-lint.config.ts
import type { StrictLintConfig } from '@williamthorsen/strict-lint';

const config: StrictLintConfig = {
  maxSeverity: {
    // keep these as warnings (don't promote to error)
    'unicorn/no-array-reduce': 'warn',
    'unicorn/no-nested-ternary': 'warn',
  },
};

export default config;
```

The config file is loaded through Node's native TypeScript support (Node 24+), so TypeScript syntax works without a build step. Only erasable syntax is supported; constructs that emit runtime code (enums, runtime namespaces, parameter properties) are not.

If you lint with [`@williamthorsen/eslint-config-typescript`](https://www.npmjs.com/package/@williamthorsen/eslint-config-typescript), its `advisoryRuleSeverities` export is a ready-made allowlist of style and modernization rules — `maxSeverity: { ...advisoryRuleSeverities }`.

### Discovery

`strict-lint` collects every `.config/strict-lint.config.ts` between the current working directory and the project root, the same anchor ESLint uses to discover its own config. A config above the project root does not apply, so a stray `~/.config/strict-lint.config.ts` cannot govern a repository, and CI running under a different `HOME` resolves the same way a laptop does.

The project root is the nearest ancestor directory holding one of these markers:

- `.git` (a directory in a clone, a file in a worktree)
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, or `bun.lock`

Failing that, it is the nearest directory holding a `package.json`; failing that, the directory the run starts in.

Selection follows the working directory, not the files you lint. Running from the repo root applies the root's config even when the targets sit inside a package.

#### Merging across levels

Configs merge per rule, with the nearer one winning. In a monorepo, running from `packages/pkg` applies the repo root's allowlist and then the package's, so a package extends the root's by naming only what differs — no import, no spread.

Overriding an inherited entry to `'error'` drops it, promoting that rule to an error in this subtree:

```ts
// packages/pkg/.config/strict-lint.config.ts
import type { StrictLintConfig } from '@williamthorsen/strict-lint';

const config: StrictLintConfig = {
  maxSeverity: {
    // this package is already clean of the rule, so let it fail the build here
    'unicorn/prefer-ternary': 'error',
  },
};

export default config;
```

#### Bounding the search early

A config that sets `shouldIgnoreAncestors: true` stops the search at its own level:

```ts
const config: StrictLintConfig = {
  maxSeverity: { 'unicorn/no-array-reduce': 'warn' },
  shouldIgnoreAncestors: true,
};
```

Configs above it contribute nothing and are never imported, so their module-level side effects do not run.

#### Seeing what applied

`strict-lint --debug` writes the resolved project root, the marker that chose it, and every config file that contributed — in the order they merge — to stderr. It reports strict-lint's own resolution; it does not enable ESLint's internal debug logging.

## CLI reference

```
strict-lint [options] [file|dir|glob...]
```

`strict-lint` accepts the same arguments as `eslint`. Positional arguments default to `.` (lint the current directory).

| Option                         | Description                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `-c, --config <path>`          | Path to your ESLint config file                                              |
| `--debug`                      | Report strict-lint's own config resolution on stderr                         |
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

| Option          | Type                                         | Description                                                 |
| --------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `baseConfig`    | `Linter.Config[]`                            | Use this config instead of loading a config file from disk. |
| `patterns`      | `string[]`                                   | Files or globs to lint (default: `['.']`).                  |
| `maxSeverity`   | `Record<string, 'warn' \| 'error'>`          | Keep listed rules at this severity; skip error promotion.   |
| `ruleOverrides` | `Record<string, 'off' \| 'warn' \| 'error'>` | Force rule severity (applied after errorization).           |

`strictLint()` reads `process.argv` and merges CLI flags with the programmatic options. CLI rule overrides win over programmatic ones.

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
| `eslint`   | `>=10`   |

## License

ISC.
