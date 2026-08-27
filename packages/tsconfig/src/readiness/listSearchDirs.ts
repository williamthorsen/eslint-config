/**
 * Lists the directories a check sweeps: the repo root and every workspace.
 * Below readyup 0.33.0 the workspace list omits the repo root, so the root is supplied here; the dedupe
 * keeps it single where the list already holds it, so nothing found there is counted twice.
 */
export function listSearchDirs(workspaceDirs: readonly string[]): string[] {
  return [...new Set(['.', ...workspaceDirs])];
}
