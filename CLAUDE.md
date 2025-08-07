# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for ESLint configurations published by William Thorsen. It contains three main packages:

- `@williamthorsen/eslint-config-basic` - Basic ESLint config for JavaScript projects
- `@williamthorsen/eslint-config-typescript` - Comprehensive ESLint config for TypeScript projects with support for React, Next.js, testing frameworks, and more
- `@williamthorsen/strict-lint` - A utility that converts ESLint warnings to errors for stricter linting

## Architecture

### Monorepo Structure

- Uses pnpm workspaces with packages in `/packages/*`
- Root package.json contains scripts that run across all workspaces
- Each package has its own build/test/lint configuration

### Package Architecture

- **basic/**: Simple JavaScript ESLint config with plugins for common use cases
- **typescript/**: Complex TypeScript config with modular architecture:
  - `configs/` - Individual rule configurations (javascript.ts, typescript.ts, react.ts, etc.)
  - `plugins/` - Custom ESLint plugins with rules like `prefer-function-declaration`
  - `ignores/` - Common ignore patterns
  - `utils/` - Helper utilities for config resolution
- **strict-lint/**: Standalone tool that processes ESLint output to convert warnings to errors

### Key Design Patterns

- Flat ESLint config format (ESLint 9+)
- TypeScript configs are built and distributed as compiled JavaScript
- Modular configuration approach allowing selective inclusion of rule sets
- Custom ESLint plugins for organization-specific rules

## Development Commands

### Building

```bash
pnpm build                    # Build all packages
pnpm --prefix packages/typescript run rebuild  # Rebuild TypeScript package specifically
```

### Linting & Type Checking

```bash
pnpm check                    # Run typecheck, format check, lint check, and tests
pnpm check:strict             # Strict checks including coverage, audit, and strict lint
pnpm typecheck                # TypeScript type checking
pnpm lint                     # ESLint with auto-fix
pnpm lint:check               # ESLint check without fixing
pnpm lint:strict              # Run strict-lint (warnings as errors)
```

### Testing

```bash
pnpm test                     # Run root-level tests
pnpm test:coverage            # Run tests with coverage across all workspaces
pnpm root:test                # Run tests using vitest.root.config.ts
```

### Package Management

```bash
pnpm outdated                 # Check for compatible updates
pnpm outdated:latest          # Check for all updates
pnpm update                   # Update dependencies
pnpm audit                    # Security audit
```

### Versioning (Changesets)

```bash
pnpm changeset                # Create a changeset
pnpm changeset version        # Generate CHANGELOGs and bump versions
```

## TypeScript Configuration

The TypeScript package uses a complex build system:

- Source files in TypeScript are compiled to `dist/esm/`
- Build configuration in `build.config.ts`
- Multiple tsconfig files for different purposes (build, eslint, scripts)
- The package exports both the main config and individual components

## Testing Framework

- Uses Vitest for testing
- Root-level tests exclude packages (handled by individual package tests)
- Coverage reporting with v8
- Integration and unit test configurations available

## Custom ESLint Rules

The typescript package includes custom rules in `plugins/rules/`:

- `memoized-functions-returned-by-hook` - Enforces memoization patterns
- `no-undefined-with-number` - Prevents undefined comparisons with numbers
- `no-unused-map` - Detects unused map operations
- `prefer-function-declaration` - Prefers function declarations over expressions

## Important Files

- `pnpm-workspace.yaml` - Workspace configuration
- `eslint.config.js` - Root ESLint configuration that uses the typescript package
- `vitest.root.config.ts` - Root test configuration
- `scripts/report-overrides.ts` - Reports package override usage (runs on postinstall)
