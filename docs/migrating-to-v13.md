# Migrating to eslint-config-typescript v13

v13 replaces `eslint-plugin-import` with [`eslint-plugin-import-x`](https://github.com/un-ts/eslint-plugin-import-x). Every rule id, disable directive, and settings key in the `import/` namespace moves to `import-x/`.

Nothing else in the config changes namespace, and no rule this config sets is dropped.

## Why

`eslint-plugin-import` 2.32.0 declares ESLint `^9` as its ceiling, and this config requires `eslint >=10`. `import-x` declares `^10`, supplies the same rules (45 of the 46 `eslint-plugin-import` ships, plus two of its own), real flat configs, and a bundled resolver.

The one rule `import-x` lacks, `enforce-node-protocol-usage`, this config never set; `unicorn/prefer-node-protocol` covers it.

One rule this config did set is gone in v13: `import/no-duplicates`. Its fixer, in both plugins, mishandles every same-module group that is not two braced statements, writing `import d, type { T }` for a default import and deleting a side-effect import outright. `sky-pilot/no-split-imports` takes its place and merges only what one statement can carry; see [Type imports](../packages/typescript/README.md#type-imports).

## Step 1: rename rule overrides

Any `import/*` entry in your own `rules` block becomes `import-x/*`, except `import/no-duplicates`, which goes:

```diff
 rules: {
-  'import/extensions': 'off',
-  'import/no-duplicates': 'warn',
+  'import-x/extensions': 'off',
 }
```

An `import/*` rule set to a severity other than `'off'` fails the ESLint run outright, naming the rule, because the `import` plugin is no longer registered. One set to `'off'` is accepted silently and does nothing, so grep for the namespace rather than relying on the run to find them all.

Do not carry `no-duplicates` over as `import-x/no-duplicates`. With `prefer-inline` its fixer writes `import d, type { T }`, a parse error, when the type statement comes first, which is the order `simple-import-sort` produces, and it folds a side-effect import into a type statement. Without options, merging `import type { T }` with `import { type U, v }` strips a specifier's kind in either order: `v` becomes a type import, or `T` a value import.

## Step 2: rename disable directives

```diff
-// eslint-disable-next-line import/extensions
+// eslint-disable-next-line import-x/extensions
```

These report as `Definition for rule 'import/...' was not found`, so the run finds them for you. A directive naming `import/no-duplicates` is deleted rather than renamed.

## Step 3: rename settings

```diff
 settings: {
-  'import/resolver': { typescript: { project: './tsconfig.json' } },
+  'import-x/resolver': { typescript: { project: './tsconfig.json' } },
 }
```

This is the step nothing reports. ESLint does not validate `settings`, so an `import/`-namespaced key is silently ignored and the rules fall back to `import-x`'s bundled node resolver. Where you rely on a resolver for path aliases, check this one by hand.

The full set of keys: `import-x/cache`, `import-x/core-modules`, `import-x/docstyle`, `import-x/extensions`, `import-x/external-module-folders`, `import-x/ignore`, `import-x/parsers`, `import-x/resolver`.

## Step 4: drop the direct dependency

If you installed `eslint-plugin-import` yourself, remove it. This config no longer depends on it, and `import-x` needs no separate `eslint-import-resolver-node`.

## What may newly fail

`sky-pilot/no-split-imports` reports a module imported in more than one statement, the split type and value pair among them, and merges what one statement can carry. See [Type imports](../packages/typescript/README.md#type-imports) for the enforced form and the shapes it leaves alone. Run `eslint --fix` once after upgrading; the rule sits in `advisoryRuleSeverities`, so under `strict-lint` with that map applied it warns rather than fails.

Separately, `import-x` depends on `unrs-resolver`, which declares a postinstall build script. It ships a prebuilt binding per platform as an optional dependency and builds from source only where none exists, so the script can be declined; under pnpm, set `unrs-resolver: false` under `allowBuilds` in `pnpm-workspace.yaml`.

## Verify

```shell
grep -rn "'import/" . --include='*.ts' --include='*.js' --include='*.mjs'
grep -rn 'eslint-disable.*import/' .
```

Both should return nothing outside `node_modules`.
