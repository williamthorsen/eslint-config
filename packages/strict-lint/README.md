# @williamthorsen/strict-lint

Run ESLint with all warnings promoted to errors, except for the rules you cap below `error`. Ships a `strict-lint` binary that drops in for `eslint` in CI, plus a programmatic API.

<!-- section:release-notes --><!-- /section:release-notes -->

## Installation

```shell
pnpm add -D @williamthorsen/strict-lint eslint
```

Requires ESLint 10+ (flat config) and Node 24+. If your ESLint config is TypeScript, install [`jiti`](https://www.npmjs.com/package/jiti) alongside it: ESLint loads TypeScript configs through jiti, exactly as a plain `eslint` run does.

## Quick start

In CI, use `strict-lint` instead of `eslint`:

```shell
strict-lint .
```

Every warning emitted by your ESLint config becomes an error and fails the run, except for the rules you cap below `error`. Out of the box nothing is capped. The CLI accepts the same flags as `eslint` and forwards them through.

## How it works

1. Runs ESLint via the Node API, letting it resolve a config for each linted file just as a plain `eslint` run does, or pinning one config for the whole run via `--config <path>`.
2. Rewrites every reported warning to an error, except those whose `maxSeverity` ceiling sits below `error`.
3. Reports any rule your own config merely repeats from the shared configs you named, if you named any.
4. Exits non-zero on any errors.

`maxSeverity` is the resolved set of ceilings, computed by merging, in increasing precedence, every `.config/strict-lint.config.ts` from the project root down to the directory of the file being linted, then any `maxSeverity` passed programmatically. No rule is exempt from promotion unless one of those sources says so.

A ceiling bounds how high strict-lint promotes a rule. It never lowers a severity your ESLint config sets explicitly: a rule configured `'error'` stays an error under every ceiling. To force a severity outright, use `ruleOverrides` or the `--rule` flag.

Warnings that name no rule keep the severity ESLint gave them. ESLint reports two of these: the notice for a path you name explicitly that your config ignores, and the unused `eslint-disable` directive report. Since `maxSeverity` is keyed by rule name, promoting either would raise an error no ceiling could exempt, so `strict-lint some/ignored/file.js` reports the notice and still exits 0. To fail a build on stale disable directives, set `linterOptions.reportUnusedDisableDirectives` to `'error'` in your ESLint config.

## Configuration

Scaffold a config with [`strict-lint init`](#scaffolding-a-config), or create `.config/strict-lint.config.ts` at or above the files you lint by hand:

```ts
// .config/strict-lint.config.ts
import { defineConfig } from '@williamthorsen/strict-lint/config';

export default defineConfig({
  maxSeverity: {
    // cap these below error, so they stay warnings
    'unicorn/no-array-reduce': 'warn',
    'unicorn/no-nested-ternary': 'warn',
  },
});
```

The strict-lint config file is loaded through Node's native TypeScript support (Node 24+), enabling TypeScript code to be run without a build step. Only erasable syntax is supported; constructs that emit runtime code (enums, runtime namespaces, parameter properties) are not. This restriction applies to `.config/strict-lint.config.ts` alone; your ESLint config is loaded by ESLint through jiti, which transpiles rather than strips, and accepts any TypeScript.

### Scaffolding a config

`strict-lint init` writes a starter config for you:

```shell
strict-lint init
```

It writes into the directory you run it from rather than into the project root, so ceilings are scoped by where you run it: `cd packages/pkg && strict-lint init` gives that package a config of its own. The command reports both the path it wrote and the project root the cascade merges down from, so you can see which files the new ceilings will govern.

An existing config is left untouched unless `--force` is passed, and one whose contents already match is reported as up to date rather than rewritten.

| Flag         | Description                                      |
| ------------ | ------------------------------------------------ |
| `--dry-run`  | Report what would be written, without writing it |
| `--force`    | Overwrite an existing config                     |
| `-h, --help` | Show the command's help                          |

The scaffolded config imports `@williamthorsen/strict-lint/config`, so the command checks whether the package can be imported from that directory and prints an install step when it cannot. It never refuses on that account: `npx @williamthorsen/strict-lint init` scaffolds first and installs after.

### Ceiling values

Every severity ESLint accepts is a valid ceiling, as is `undefined`:

| Ceiling                | Effect                                              |
| ---------------------- | --------------------------------------------------- |
| absent, or `undefined` | promote a warning to `'error'`                      |
| `'error'` or `2`       | promote a warning to `'error'`                      |
| `'warn'` or `1`        | leave the rule at the severity your config gives it |
| `'off'` or `0`         | leave the rule at the severity your config gives it |

`'off'` and `'warn'` have the same effect, because strict-lint only ever raises a severity: any ceiling below `'error'` blocks the raise, and none of them disables a rule. What `'off'` buys you is interchangeability. Because the value type is ESLint's own `Linter.RuleSeverity`, one map of rule severities can be spread into a flat-config `rules` block, where `'off'` disables the rule, and into `maxSeverity`, where it exempts the rule from promotion:

```ts
import type { Linter } from 'eslint';

export const severities = {
  'unicorn/no-array-reduce': 'warn',
  'unicorn/prefer-ternary': 'off',
} satisfies Record<string, Linter.RuleSeverity>;
```

The `satisfies` clause keeps the values at their literal types. Without it they widen to `string`, which is assignable to neither target.

If you lint with [`@williamthorsen/eslint-config-typescript`](https://www.npmjs.com/package/@williamthorsen/eslint-config-typescript), its `advisoryRuleSeverities` export is a ready-made set of ceilings for style and modernization rules: `maxSeverity: { ...advisoryRuleSeverities }`.

### Discovery

`strict-lint` collects every `.config/strict-lint.config.ts` between each linted file's directory and the project root, the same anchor ESLint uses to discover its own config. A config above the project root does not apply, so a stray `~/.config/strict-lint.config.ts` cannot govern a repository, and CI running under a different `HOME` resolves the same way a laptop does.

The project root is the nearest ancestor directory holding one of these markers:

- `.git` (a directory in a clone, a file in a worktree)
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, or `bun.lock`

Failing that, it is the nearest directory holding a `package.json`; failing that, the directory the run starts in.

Selection follows the files you lint, not the working directory. Running from the repo root applies each package's own ceilings to that package's files, so one run over a monorepo resolves exactly what a run inside each package would. The same holds for ESLint's own config, which ESLint resolves per file: a single `strict-lint .` at the repo root honours every package's `eslint.config.*`, and there is no need to run once per workspace.

#### Merging across levels

Configs merge per rule, with the nearer one winning. In a monorepo, a file under `packages/pkg` takes the repo root's ceilings and then the package's, so a package extends the root's by naming only what differs, with no import and no spread.

Overriding an inherited ceiling to `'error'` drops it, promoting that rule to an error in this subtree:

```ts
// packages/pkg/.config/strict-lint.config.ts
import { defineConfig } from '@williamthorsen/strict-lint/config';

export default defineConfig({
  maxSeverity: {
    // this package is already clean of the rule, so let it fail the build here
    'unicorn/prefer-ternary': 'error',
  },
});
```

Setting it to `undefined` drops it the same way. Reach for this when the map you spread is shared and you want the inherited entry gone rather than restated:

```ts
export default defineConfig({
  maxSeverity: {
    ...sharedSeverities,
    'unicorn/prefer-ternary': undefined,
  },
});
```

#### Bounding the search early

A config that sets `shouldIgnoreAncestors: true` stops the search at its own level:

```ts
export default defineConfig({
  maxSeverity: { 'unicorn/no-array-reduce': 'warn' },
  shouldIgnoreAncestors: true,
});
```

Configs above it contribute nothing and are never imported, so their module-level side effects do not run.

#### Seeing what applied

`strict-lint --debug` writes the resolved project root, the marker that chose it, and every config file that contributed (in the order they merge) to stderr. Because ceilings resolve per file, it reports one block per distinct set of config files, naming the directories that set governs, rather than one block per directory. It reports strict-lint's own resolution; it does not enable ESLint's internal debug logging.

### Flagging repeated rules

A config often repeats a rule setting that the shared config it extends already applies. The repetition is invisible: it looks like configuration, it survives upgrades, and it pins the rule at a setting the shared config may since have changed.

Name the configs your ESLint config extends, and `strict-lint` reports the rules your own config merely repeats:

```ts
// .config/strict-lint.config.ts
import baseConfig, { createConfig } from '@williamthorsen/eslint-config-typescript';
import { defineConfig } from '@williamthorsen/strict-lint/config';

export default defineConfig({
  sharedConfigs: [baseConfig, await createConfig.vitest()],
});
```

Findings go to stderr, and change no problem count and no exit code, so a repeat is reported without failing the run:

```
strict-lint: eslint.config.ts repeats the shared config for 1 rule:
strict-lint:   n/no-extraneous-import (11 files)
```

Without `sharedConfigs`, the check does no work.

After linting, strict-lint resolves the rules governing each linted file twice: once over the elements it attributes to the configs you named, and once over your own. A rule both resolve to the same value is a repeat. `'error'`, `2`, and `['error']` count as one value, while differing options count as an override and pass unreported, as does a rule the shared config never sets for that file. ESLint performs the glob expansion and the `files` scoping, because the question is asked per real file rather than reconstructed from patterns.

Pass values rather than a package name. A name resolves through the package's `exports` field and can load a second instance of a module your ESLint config already imported; nothing in it would match, and the check would report nothing at all. Import the specifier your ESLint config imports.

Declare every shared source, factory calls included. An element strict-lint cannot attribute to either side stops the check, which names what it could not sort rather than guessing:

```
strict-lint: shared-config check skipped: 3 config elements could not be sorted
strict-lint:   UserConfig[0] > UserConfig[0] > vitest/all
strict-lint: name the config each extends in sharedConfigs
```

That is what an undeclared source looks like. `defineConfig` rebuilds the elements it reaches through `extends`, so an expansion of a config you did not name matches nothing strict-lint holds. Add it to `sharedConfigs` and the check runs.

What the check does not do:

- **No repeat of a whole shared element.** An element of your config matching one of the shared configs in both scope and rules is taken for that shared element and never compared, so copying one wholesale goes unreported.
- **No partial repeat, and no whole-config guarantee.** A rule reports only where it repeats on every file _this run linted_ that your own config sets it for, and never where your own config gives that rule more than one value. A rule you set at two scopes, one restoring what the other turned off, is load-bearing at both and passes unreported. The denominator is the run's files rather than every file your config governs, so a run over part of your project measures against less than a full one does.
- **No source location.** It reads resolved configuration rather than source text, so it names the rule and the config file, never the line.
- **No editor feedback.** It is a command-line check, not a lint rule, so there is no on-save squiggle and no removal suggestion.
- **One ESLint config per run.** The config is resolved once at the working directory, so a monorepo giving each package its own `eslint.config.*` is not covered.

## CLI reference

```
strict-lint [options] [file|dir|glob...]
strict-lint init [options]
```

`strict-lint` accepts the same arguments as `eslint`. Positional arguments default to `.` (lint the current directory). `init` is a command in first position alone, so `strict-lint ./init` still lints a path of that name; see [Scaffolding a config](#scaffolding-a-config) for its flags.

| Option                         | Description                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `-c, --config <path>`          | Path to your ESLint config file                                              |
| `--debug`                      | Report strict-lint's own config resolution on stderr                         |
| `-h, --help`                   | Show usage for both modes                                                    |
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
| `--concurrency <n\|auto\|off>` | Lint in worker threads. Default `off`.                                       |
| `--quiet`                      | Show only errors, hide warnings                                              |
| `--max-warnings <n>`           | Fail if warnings exceed `n`. `-1` disables.                                  |
| `-f, --format <name>`          | Formatter (default: `stylish`)                                               |
| `-o, --output-file <path>`     | Write formatter output to a file                                             |

`--rule` example:

```shell
strict-lint --rule 'no-console: warn' --rule 'no-debugger: error' src/
```

CLI rule overrides take the highest precedence; they apply after errorization and after any programmatic overrides.

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

| Option          | Type                                               | Description                                                              |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| `baseConfig`    | `Linter.Config[]`                                  | Use this config instead of loading a config file from disk.              |
| `patterns`      | `string[]`                                         | Files or globs to lint (default: `['.']`).                               |
| `maxSeverity`   | `Record<string, Linter.RuleSeverity \| undefined>` | Per-rule ceiling on promotion; a ceiling below `error` exempts its rule. |
| `ruleOverrides` | `Record<string, 'off' \| 'warn' \| 'error'>`       | Force rule severity (applied after errorization).                        |

`strictLint()` reads `process.argv` and merges CLI flags with the programmatic options. CLI rule overrides win over programmatic ones.

`baseConfig` is incompatible with `--concurrency`: an in-memory config holds plugin objects, and ESLint clones its options to reach worker threads. Combining them fails with a message naming `baseConfig`. Load the config from a file to lint concurrently.

## Concurrency

`--concurrency auto` lints in worker threads, sized to the number of files and available cores. It is off by default, matching ESLint.

The payoff scales with the number of files in a single run. ESLint allocates one worker per 50 files and treats a count of one as none, so a run below that threshold stays single-threaded, and each worker pays its own config-loading and type-checking startup. Prefer one run over many files to many runs over few: in a monorepo, a single `strict-lint .` at the root beats a run per workspace, both because it loads the config once and because it gives `auto` enough files to work with.

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
- CI uses `lint:strict`, where warnings break the build, except for the rules you've capped below `error`.

This pattern lets you enable a stricter rule as a warning, watch it appear in local output for a while, and then promote it to an error in CI by simply removing it from `maxSeverity`.

## Peer dependencies

| Dependency | Version | Required when                    | Declared by                   |
| ---------- | ------- | -------------------------------- | ----------------------------- |
| `eslint`   | `>=10`  | always                           | `strict-lint`                 |
| `jiti`     | `*`     | your ESLint config is TypeScript | `eslint`, as an optional peer |

## License

ISC.
