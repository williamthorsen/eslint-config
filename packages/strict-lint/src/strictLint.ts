import path from 'node:path';

import { ESLint, type Linter } from 'eslint';

import { findNearestFile } from './common/findNearestFile.ts';
import { convertWarnToError } from './convertWarnToError.ts';
import { defaultMaxSeverity } from './defaultMaxSeverity.ts';
import { loadStrictLintConfig } from './loadStrictLintConfig.ts';
import type { MaxSeverityMap, StrictLintOptions } from './types.ts';

export async function strictLint(options?: StrictLintOptions): Promise<string> {
  const args = process.argv.slice(2);
  return doLint(options, ...args)
    .then((resultText) => {
      console.info(resultText);
      if (/✖.*problem/.test(resultText)) {
        // eslint-disable-next-line n/no-process-exit,unicorn/no-process-exit
        process.exit(1);
      }
      return resultText;
    })
    .catch((error: unknown) => {
      console.error(error);
      // eslint-disable-next-line n/no-process-exit,unicorn/no-process-exit
      process.exit(1);
    });
}

/**
 * Programmatically runs ESLint on the current directory.
 * TODO: Allow file pattern to be passed in.
 * @link https://eslint.org/docs/latest/integrate/nodejs-api#eslint-class
 */
async function doLint(options: StrictLintOptions | undefined, ...args: string[]): Promise<string> {
  let eslintConfigDir: string | undefined;

  const config: Linter.Config[] = await (async () => {
    if (options?.baseConfig) {
      eslintConfigDir = process.cwd();
      return options.baseConfig;
    }
    const configFilePath = findNearestFile('eslint.config.js');
    if (!configFilePath) {
      throw new Error('Could not find eslint.config.js');
    }
    eslintConfigDir = path.dirname(configFilePath);
    const mod: unknown = await import(configFilePath);
    assertIsConfig(mod);
    return mod.default;
  })();

  const strictLintConfig = eslintConfigDir ? await loadStrictLintConfig(eslintConfigDir) : undefined;

  const resolvedMaxSeverity: MaxSeverityMap = {
    ...defaultMaxSeverity,
    ...strictLintConfig?.maxSeverity,
    ...options?.maxSeverity,
  };

  const errorizedConfig = config.map((block) => convertWarnToError(block, resolvedMaxSeverity));

  const mode = args.includes('--fix') ? 'fix' : 'check';
  const eslint = new ESLint({
    cwd: process.cwd(),
    fix: mode === 'fix',
    overrideConfig: errorizedConfig,
  });

  const results = await eslint.lintFiles(['.']);

  // Writes fixes to files
  await ESLint.outputFixes(results);

  // Format and display the results
  const formatter = await eslint.loadFormatter('stylish');
  return formatter.format(results);
}

function assertIsConfig(mod: unknown): asserts mod is { default: Linter.Config[] } {
  if (typeof mod !== 'object' || mod === null) {
    throw new TypeError('Expected module to be an object');
  }
  if (!('default' in mod)) {
    throw new TypeError('Expected module to have a default export');
  }
  if (!Array.isArray(mod.default)) {
    throw new TypeError('Expected config to be an array');
  }
  for (const item of mod.default) {
    if (typeof item !== 'object') {
      throw new TypeError('Expected config item to be an object');
    }
  }
}
