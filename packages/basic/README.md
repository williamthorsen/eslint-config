# @williamthorsen/eslint-config-basic

Flat-config ESLint preset for JavaScript projects. Lints JavaScript, JSON, JSON5, YAML, Markdown, and `package.json` files from a single default export.

<!-- section:release-notes --><!-- /section:release-notes -->

## Installation

```shell
pnpm add -D @williamthorsen/eslint-config-basic eslint
```

Requires ESLint 9 or higher (flat config).

## Quick start

Add the config to `eslint.config.js`:

```js
import basicConfig from '@williamthorsen/eslint-config-basic';

export default [
  ...basicConfig,
  // your overrides
];
```

That's it. The config covers JavaScript, JSON, JSON5, YAML, Markdown, and `package.json` out of the box, and it enables `linterOptions.reportUnusedDisableDirectives` globally so dangling `eslint-disable` comments surface as findings.

## What's included

| File pattern            | Plugins                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `**/*.{js,cjs,mjs,jsx}` | `eslint-comments`, `n`, `promise`, `simple-import-sort`, `unicorn` |
| `**/*.{json,json5}`     | `jsonc` (`recommended-with-jsonc` plus spacing/indent)             |
| `**/*.{yaml,yml}`       | `yml` (`recommended` plus single-quote preference)                 |
| `**/*.md`               | `@eslint/markdown` (Markdown processor)                            |
| `**/package.json`       | `package-json` (`recommended` + `stylistic`)                       |
| `**/scripts/**`         | `no-console` is turned off                                         |
| `**/*.test.js`          | `no-unused-expressions` is turned off                              |

GitHub workflow files (`.github/**/*.yml`) and dotfiles like `.*.cjs`, `.*.mjs`, and `.vscode` are explicitly unignored so they get linted.

## Additional exports

```js
import { jsPlugins, relativePathToDir } from '@williamthorsen/eslint-config-basic';
```

- **`jsPlugins`** — the JavaScript-side plugin record (handy when composing scoped configs that need the same plugins).
- **`relativePathToDir`** — utility for computing a relative path to a directory; used for repo-root-anchored ignore globs.

## Subpath access

For fine-grained reuse, the raw rule modules and shared ignore lists are exposed as subpaths:

```js
import unicornRules from '@williamthorsen/eslint-config-basic/rules/unicorn.js';
import commonIgnores from '@williamthorsen/eslint-config-basic/ignores/common.js';
```

| Subpath                         | Contents                          |
| ------------------------------- | --------------------------------- |
| `./rules/eslint-comments.js`    | eslint-comments plugin rules      |
| `./rules/javascript.js`         | core JavaScript rule overrides    |
| `./rules/n.js`                  | `eslint-plugin-n` (Node.js) rules |
| `./rules/simple-import-sort.js` | import-sort rules                 |
| `./rules/unicorn.js`            | `eslint-plugin-unicorn` rules     |
| `./ignores/common.js`           | shared ignore globs               |

## Peer dependencies

| Dependency | Required | Why                 |
| ---------- | -------- | ------------------- |
| `eslint`   | `>=9`    | flat-config support |

## License

ISC.
