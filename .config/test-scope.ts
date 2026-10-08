/**
 * Directory basenames outside the test scope, read by both Vitest configs and the test-file conventions check, which
 * must name the same set.
 */
export const excludedTestDirs: readonly string[] = ['__fixtures__'];
