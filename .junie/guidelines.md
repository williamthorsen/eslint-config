# Project Guidelines

## Code style

- Prefer function declarations over expressions, unless there is a good reason to use an arrow function.
- Within reason, adhere to the single-responsibility principle for components and functions.
  Violate this principle when it makes sense to do so,
  such as when a component is small and only used in one place,
  and creating a separate component would only add needless complexity.

## Process

- Approach each coding task as you would a PR.
  Each PR should be a small, self-contained unit of work that can be reviewed and merged independently.
  If the PR must be large to accomplish the task, break it into smaller tasks.

- Until you feel that you have all necessary information, ask for clarification before proceeding with a task.

- You can run type-checking, linting, and testing in all packages by running `nr run check` from the monorepo root.
  To run checks in only one workspace, change to the workspace directory and run `nr run ws check` there.

## Testing

- Use `vitest` for unit tests.
- Test files should be placed in the `__tests__` subdirectory of the source file's directory,
  with the `.unit.test.ts` or `.unit.test.tsx` suffix.
- Run the type-checker (`nr ws typecheck`) and linter (`nr ws lint:check`) in the workspace,
  and fix any errors before running any new or modified tests.
