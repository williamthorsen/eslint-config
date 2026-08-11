import path from 'node:path';

import { ESLint } from 'eslint';

import packageJsonConfig from '../package-json.ts';

// ESLint reports `File ignored because outside of base path` in place of any rule output for a path outside
// its `cwd`, so the subject sits under the directory the linter runs from. The file need not exist on disk.
const manifestPath = path.join(import.meta.dirname, 'package.json');

/**
 * Lints a manifest given as an object and returns the ids of the rules that reported against it.
 * A message carrying no rule id means nothing was linted, which throws rather than reading as a clean run.
 */
export async function lintManifest(manifest: Record<string, unknown>): Promise<string[]> {
  const eslint = new ESLint({
    cwd: import.meta.dirname,
    overrideConfigFile: true,
    overrideConfig: packageJsonConfig,
  });

  const results = await eslint.lintText(JSON.stringify(manifest, null, 2), { filePath: manifestPath });

  const messages = results[0]?.messages ?? [];
  const ruleIds: string[] = [];

  for (const message of messages) {
    if (message.ruleId === null) {
      throw new Error(`lintManifest linted nothing: ${message.message}`);
    }

    ruleIds.push(message.ruleId);
  }

  return ruleIds;
}
