# Migrating to eslint-config-typescript v15

v15 requires a relative specifier to name the TypeScript source it reaches: `./m.ts`, never `./m.js`. `import-x/extensions` reports the `.js` spelling, and `import-x/no-cycle` now sees the edges such a specifier makes.

The `typescript` peer range rises from `>=5` to `>=5.7` in the same release.

## Why

Under the bundled `import-x` resolver, `./m.js` in a TypeScript file resolved to nothing: the module graph lost the edge, and every graph-walking rule reported nothing. A codebase written in that spelling got no signal from `import-x/no-cycle` and none from `import-x/extensions`, whose requirement is an extension rather than a particular one, so an inert rule was indistinguishable from a passing one.

The config now ships an `import-x` resolver default carrying `extensionAlias`, which resolves `./m.js` to `m.ts`. `import-x/extensions` reads the resolved file's extension, so the same setting that restores the edge also turns the `.js` spelling into a reported error. The two are one change, not two: no resolver setting closes the graph without also deciding the spelling.

## Step 1: permit the TypeScript extension in your tsconfig

TypeScript raises TS5097 on a `.ts` specifier unless one of two options is set in the tsconfig owning the file.

Where your build emits with `tsc`:

```diff
 "compilerOptions": {
+  "rewriteRelativeImportExtensions": true,
 }
```

Where it emits nothing, or emits declarations alone:

```diff
 "compilerOptions": {
+  "allowImportingTsExtensions": true,
   "noEmit": true,
 }
```

`rewriteRelativeImportExtensions` arrived in TypeScript 5.7, which is why the peer floor moves with this release. The base in [`@williamthorsen/tsconfig`](../packages/tsconfig) sets both options, so a consumer on its current release skips this step.

## Step 2: rewrite your relative specifiers

Each relative specifier naming a TypeScript file carries that file's own extension:

```diff
-import { parseNote } from './parse-note.js';
-import type { Note } from './types.js';
+import { parseNote } from './parse-note.ts';
+import type { Note } from './types.ts';
```

A specifier naming a JavaScript file is unchanged. The resolver alias is scoped to `**/*.{ts,cts,mts,tsx}`, so a JavaScript source still resolves `./m.js` to `m.js`.

Run `eslint --fix`: `import-x/extensions` fixes each specifier it reports.

## Step 3: compose with the shipped resolver where you override it

`settings['import-x/resolver']` is replaced by key rather than merged, so an override that names the key discards the alias. Spread the exported options into yours:

```diff
+import { importResolverOptions } from '@williamthorsen/eslint-config-typescript';
+
 export default [
   ...baseConfig,
   {
     settings: {
-      'import-x/resolver': { node: { tsconfig: { configFile: './tsconfig.json' } } },
+      'import-x/resolver': {
+        node: { ...importResolverOptions, tsconfig: { configFile: './tsconfig.json' } },
+      },
     },
   },
 ];
```

## What the kit reports

The readiness kit's extension-import check reports a `tsconfig.json` that permits neither option, naming each one to edit. It reads the config at the repo root and one per workspace, and skips a repo declaring none.
