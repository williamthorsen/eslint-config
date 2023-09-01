# @williamthorsen/eslint-config-monorepo

## 0.14.0

### Dependencies

Upgraded all dependencies to latest version.

## 0.12.5

### Dependencies

- Upgraded all dependencies to latest version
- Upgraded all runtimes to latest version

## 0.12.2

### Dependencies

- Upgraded all dependencies to latest version
- Upgraded all runtimes to latest version

## 0.11.0

### Dependencies

- Added `vitest` and its `v8` coverage engine to dev dependencies
- Added `rimraf` to dev dependencies for use in build scripts
- Added ESM Loader to dev dependencies to allow TypeScript scripts to run in Node.js
- Upgraded all dependencies to latest version

### Tooling

- Added `audit-ci` as a wrapper for `pnpm audit` checks
- Added "GHSA-c2qf-rxjj-qqgw" vulnerability to the `audit-ci` ignore list
- Added `lint:strict` check and included it in the standard `check` script
