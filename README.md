# @williamthorsen/eslint-config

ESLint configurations for my projects.

## Usage

### JavaScript projects

Install the package and its peer dependencies:

```shell
pnpm install --save-dev @williamthorsen/eslint-config eslint
```

Then add the following to your `eslint.config.js` file:

```js
import baseConfig from '@williamthorsen/eslint-config';

export default [
  ...baseConfig,
  // Add your own configuration here
];
```

### TypeScript projects

Install the package and its peer dependencies:

```shell
pnpm install --save-dev @williamthorsen/eslint-config-typescript eslint typescript
```

Then add the following to your `eslint.config.js` file:

```js
import baseConfig from '@williamthorsen/eslint-config-typescript';

export default [
  ...baseConfig,
  // Add your own configuration here
];
```
