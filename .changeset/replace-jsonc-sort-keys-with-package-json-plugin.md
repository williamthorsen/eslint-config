---
"@williamthorsen/eslint-config-typescript": minor
"@williamthorsen/eslint-config-basic": minor
---

Replace `jsonc/sort-keys` with `eslint-plugin-package-json` for package.json linting.

The hand-maintained key ordering has been replaced by the plugin's `recommended` and `stylistic` configs, which use `sort-package-json`'s canonical ordering. This eliminates ordering drift and provides additional package.json validation rules.

Downstream consumers may see auto-fixable ordering changes (run `eslint --fix`) when upgrading.
