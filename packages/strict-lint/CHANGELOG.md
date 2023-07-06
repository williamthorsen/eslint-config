# @williamthorsen/strict-lint

## 0.11.2

### Patch Changes

- Simplify build config & file structure

## 0.11.1

### Features

- Added the `strict-lint` script to the Node.js package

## 0.11.0

### Features

- Added `strict-lint` workspace to the monorepo
- Added the `strictLint` function, which wraps ESLint and treats all warnings as errors

### Dependencies

- Added `eslint` and `typescript` as dev dependencies

### Tooling

- Configured the package for distribution as a Node.js package
- Removed the `audit` check, which should now be performed only from the monorepo root
- Centralized the linter config in the monorepo root
