# Project summary

## Project overview

This is a monorepo for ESLint configurations published by William Thorsen. It contains three main packages:

- `@williamthorsen/eslint-config-basic` - Basic ESLint config for JavaScript projects
- `@williamthorsen/eslint-config-typescript` - Comprehensive ESLint config for TypeScript projects with support for React, Next.js, testing frameworks, and more
- `@williamthorsen/strict-lint` - A utility that converts ESLint warnings to errors for stricter linting

## Architecture

### Monorepo structure

- Uses pnpm workspaces with packages in `/packages/*`
- Root package.json contains scripts that run across all workspaces
- Each package has its own build/test/lint configuration

### Package architecture

- **basic/**: Simple JavaScript ESLint config with plugins for common use cases
- **typescript/**: Complex TypeScript config with modular architecture:
  - `configs/` - Individual rule configurations (javascript.ts, typescript.ts, react.ts, etc.)
  - `plugins/` - Custom ESLint plugins with rules like `prefer-function-declaration`
  - `ignores/` - Common ignore patterns
  - `utils/` - Helper utilities for config resolution
- **strict-lint/**: Standalone tool that processes ESLint output to convert warnings to errors

### Key design patterns

- Flat ESLint config format (ESLint 9+)
- TypeScript configs are built and distributed as compiled JavaScript
- Modular configuration approach allowing selective inclusion of rule sets
- Custom ESLint plugins for organization-specific rules

## Development commands

This repo uses [`@williamthorsen/nmr`](https://www.npmjs.com/package/@williamthorsen/nmr) as its script runner. All standard scripts are provided by nmr's built-in registries; repo-level overrides live in `.config/nmr.config.ts`.

### Building

```bash
nmr build                    # Build all packages (from root) or current package (from workspace)
nmr clean                    # Remove dist artifacts
```

### Linting & type checking

```bash
nmr check                    # Run typecheck, format check, lint check, and tests
nmr check:strict             # Strict checks including coverage, audit, and strict lint
nmr typecheck                # TypeScript type checking
nmr lint                     # ESLint with auto-fix
nmr lint:check               # ESLint check without fixing
nmr lint:strict              # Run strict-lint (warnings as errors)
```

### Testing

```bash
nmr test                     # Run tests
nmr test:coverage            # Run tests with coverage
nmr root:test                # Run root-level tests only
```

### CI

```bash
nmr ci                       # Build all packages, then run check:strict
```

### Package management

```bash
nmr outdated                 # Check for compatible updates
nmr outdated:latest          # Check for all updates
nmr update                   # Update dependencies
nmr audit                    # Security audit
```

### Versioning (release-kit)

```bash
pnpm run release:prepare           # Analyze commits, generate CHANGELOGs, bump versions
pnpm run release:prepare:dry       # Dry run to preview changes
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
- `.config/nmr.config.ts` - nmr script runner configuration (overrides `ci` ordering)
