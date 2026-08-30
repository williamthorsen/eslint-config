# Migrating to eslint-config-typescript v7

v7 replaces `eslint-plugin-import` with [`eslint-plugin-import-x`](https://github.com/un-ts/eslint-plugin-import-x). Every rule id, disable directive, and settings key in the `import/` namespace moves to `import-x/`.

Nothing else in the config changes namespace, and no rule this config sets is dropped.

## Why

`import-x` supplies the same rules (45 of the 46 `eslint-plugin-import` ships, plus two of its own), real flat configs, and a bundled resolver. It also fixes `no-duplicates`, whose `prefer-inline` fixer in `eslint-plugin-import` 2.32.0 mishandles every same-module pair whose specifier list is not braced: it writes unparseable output for a default import and silently deletes a side-effect import.

The one rule `import-x` lacks, `enforce-node-protocol-usage`, this config never set; `unicorn/prefer-node-protocol` covers it.

## Step 1: rename rule overrides

Any `import/*` entry in your own `rules` block becomes `import-x/*`:

```diff
 rules: {
-  'import/extensions': 'off',
-  'import/no-duplicates': 'warn',
+  'import-x/extensions': 'off',
+  'import-x/no-duplicates': 'warn',
 }
```

An `import/*` rule set to a severity other than `'off'` fails the ESLint run outright, naming the rule, because the `import` plugin is no longer registered. One set to `'off'` is accepted silently and does nothing, so grep for the namespace rather than relying on the run to find them all.

## Step 2: rename disable directives

```diff
-// eslint-disable-next-line import/no-duplicates
+// eslint-disable-next-line import-x/no-duplicates
```

These report as `Definition for rule 'import/...' was not found`, so the run finds them for you.

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

`import-x/no-duplicates` now merges a module's split type and value imports into one statement. See [Type imports](../packages/typescript/README.md#type-imports) for the enforced form. Run `eslint --fix` once after upgrading.

## Verify

```shell
grep -rn "'import/" . --include='*.ts' --include='*.js' --include='*.mjs'
grep -rn 'eslint-disable.*import/' .
```

Both should return nothing outside `node_modules`.
