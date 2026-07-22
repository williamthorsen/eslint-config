# Versioning and changelog system

This document describes the commit message format, changelog generation, and release process used in this monorepo.

## Commit message format

All commits follow the structured format: `{workspace}|{work_type}: {description}`

### Workspace prefixes

- `basic` - Basic package (`@williamthorsen/eslint-config-basic`)
- `root` - Changes affecting the monorepo root
- `strict-lint` - Strict-lint package (`@williamthorsen/strict-lint`)
- `ts` - TypeScript package (`@williamthorsen/eslint-config-typescript`)
- `tsconfig` - TSConfig package (`@williamthorsen/tsconfig`)
- `*` - Changes affecting multiple workspaces

### Work types

| Code        | Category          | Description                                              |
| ----------- | ----------------- | -------------------------------------------------------- |
| `ai`        | AI                | AI agent rules and AI-specific configurations            |
| `ci`        | CI                | CI pipeline and supporting CI-only files                 |
| `deprecate` | Deprecated        | Public surface marked for removal, still functional      |
| `deps`      | Dependencies      | Dependency updates, runtime upgrades, dependency configs |
| `docs`      | Documentation     | Documentation and code comments only                     |
| `drop`      | Removed           | Public surface removed; always breaking                  |
| `feat`      | Features          | New functionality or enhancements                        |
| `fix`       | Bug fixes         | Corrections to defective behavior                        |
| `internal`  | Internal features | Functionality not reachable by consumers                 |
| `perf`      | Performance       | Speed or resource-use improvements with no API change    |
| `refactor`  | Refactoring       | Internal improvements with no consumer-facing changes    |
| `sec`       | Security          | Vulnerability remediation or hardening                   |
| `tests`     | Tests             | Test-only changes, no source code modifications          |
| `tooling`   | Tooling           | Development configs, scripts, TSConfig, manifests        |

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

Generated changelogs group commits under the Category column of the [work types](#work-types) table, plus a **Breaking changes** section for any commit carrying `!`.

## Release process

Releases run through the **Release** workflow, which analyzes commits since each workspace's last release, bumps versions, regenerates CHANGELOGs, and pushes tags:

```shell
gh workflow run release.yaml
```

It accepts three optional inputs: `only` (comma-separated workspaces), `bump` (override the derived level), and `force` (release when no bump-worthy commits exist). Pushing a `<workspace>-v<semver>` tag triggers the **Publish** and **Create GitHub Release** workflows, so tags must come from this workflow rather than by hand.

### Dry run

Preview the derived versions, tags, and changelog entries without writing files:

```shell
pnpm exec release-kit prepare --dry-run
```

## Release notes

Release notes automatically generated for published packages include only consumer-facing changes:

- Features, breaking changes, dependencies
- Excludes internal changes (refactoring, tests, CI, tooling, AI, documentation)

## Versioning strategy

- **Packages**: Use semantic versioning with release-kit-managed bumps
- **Monorepo root**: Version matches the highest published package version
- **Published packages**: `@williamthorsen/eslint-config-typescript`, `@williamthorsen/strict-lint`, and `@williamthorsen/tsconfig`

This system ensures consistent, professional release documentation while maintaining clean git history and minimizing manual effort.

## Development conventions

### pnpm command usage

- **Binaries**: `pnpm exec {binary}` (e.g., `pnpm exec vitest`, `pnpm exec eslint`)
- **Scripts**: `pnpm run {script}` (e.g., `pnpm run build`, `pnpm run test`)
- **pnpm commands**: `pnpm {command}` (e.g., `pnpm install`, `pnpm update`)
