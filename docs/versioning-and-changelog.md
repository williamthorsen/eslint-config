# Versioning and changelog system

This document describes the commit message format, changelog generation, and release process used in this monorepo.

## Commit message format

All commits follow the structured format: `{workspace}|{work_type}: {description}`

### Workspace prefixes

- `basic` - Basic package (`@williamthorsen/eslint-config-basic`)
- `root` - Changes affecting the monorepo root
- `strict-lint` - Strict-lint package (`@williamthorsen/strict-lint`)
- `ts` - TypeScript package (`@williamthorsen/eslint-config-typescript`)
- `*` - Changes affecting multiple workspaces

### Work types

| Code       | Category      | Description                                              |
| ---------- | ------------- | -------------------------------------------------------- |
| `ai`       | AI            | AI agent rules and AI-specific configurations            |
| `ci`       | CI            | CI pipeline and supporting CI-only files                 |
| `deps`     | Dependencies  | Dependency updates, runtime upgrades, dependency configs |
| `docs`     | Documentation | Documentation and code comments only                     |
| `feat`     | Features      | New functionality, enhancements, or removed features     |
| `refactor` | Refactoring   | Internal improvements with no consumer-facing changes    |
| `tests`    | Tests         | Test-only changes, no source code modifications          |
| `tooling`  | Tooling       | Development configs, scripts, TSConfig, manifests        |

### Breaking changes

Add `!` after the work type to indicate breaking changes: `ts|feat!: Remove deprecated API`

### Multi-type commits

- Rare `|*` suffix indicates multiple work types in one workspace: `ts|*: Modernize tooling and add tests`
- Keep commits focused - avoid mixing unrelated changes

## Work type rules

### Clean separation principle

- **Dependencies are always separate**: `deps` commits contain only dependency changes
- **No mixing**: `feat`, `refactor`, etc. should never include dependency updates
- **Hierarchy for multi-type commits**: `feat` > `refactor` > `tests` > `docs`

### Examples

- ✅ `ts|feat: Add new linting rule` + separate `ts|deps: Upgrade ESLint to v9`
- ❌ `ts|feat: Add new rule and upgrade ESLint` (should be two commits)

## Changelog categories

Generated changelogs organize changes into these sections:

1. **Breaking changes** - API changes requiring consumer updates
2. **Features** - New functionality and enhancements
3. **Fixes** - Bug fixes and corrections
4. **Refactoring** - Internal improvements
5. **Tests** - Test-related changes
6. **Dependencies** - Dependency updates
7. **CI** - Continuous integration changes
8. **Tooling** - Development tooling updates
9. **AI** - AI-related configurations
10. **Documentation** - Documentation updates

## Release process

### Automated workflow

1. **Generate changeset**: `pnpm run changeset:auto` - Analyzes commits since last release and generates changelog entries
2. **Review changes**: Examine generated changelog and release notes
3. **Commit changes**: Commit the changeset and updated documentation
4. **Version packages**: `pnpm changeset version` - Apply version bumps and finalize changelogs
5. **Publish**: `pnpm changeset publish` - Publish with generated release notes

### Manual override

Standard changeset commands remain available:

- `pnpm changeset` - Create changeset manually
- `pnpm changeset version` - Apply version bumps

## Release notes

Release notes automatically generated for published packages include only consumer-facing changes:

- Features, breaking changes, dependencies
- Excludes internal changes (refactoring, tests, CI, tooling, AI, documentation)

## Versioning strategy

- **Packages**: Use semantic versioning with changeset-managed bumps
- **Monorepo root**: Version matches the highest published package version
- **Published packages**: `@williamthorsen/eslint-config-typescript` and `@williamthorsen/strict-lint`

This system ensures consistent, professional release documentation while maintaining clean git history and minimizing manual effort.

## Development conventions

### pnpm command usage

- **Binaries**: `pnpm exec {binary}` (e.g., `pnpm exec vitest`, `pnpm exec eslint`)
- **Scripts**: `pnpm run {script}` (e.g., `pnpm run build`, `pnpm run test`)
- **pnpm commands**: `pnpm {command}` (e.g., `pnpm install`, `pnpm update`)
