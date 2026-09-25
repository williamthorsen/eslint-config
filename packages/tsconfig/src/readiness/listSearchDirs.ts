/**
 * Lists the directories that a check sweeps: the repo root and every workspace.
 * Readyup below 0.33.0 omits the repo root from the workspace list, and later versions include it;
 * the set keeps the root from being swept twice.
 */
export function listSearchDirs(workspaceDirs: readonly string[]): string[] {
  return [...new Set(['.', ...workspaceDirs])];
}
