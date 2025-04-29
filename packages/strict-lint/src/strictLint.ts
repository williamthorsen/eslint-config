import { ESLint, type Linter } from 'eslint';

import { findNearestFile } from './common/findNearestFile.js';
import { convertWarnToError } from './convertWarnToError.js';

export async function strictLint(baseConfig?: Linter.Config[]): Promise<string> {
  const args = process.argv.slice(2);
  return doLint(baseConfig, ...args)
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
async function doLint(baseConfig: Linter.Config[] | undefined, ...args: string[]): Promise<string> {
  const config: Linter.Config[] = await (async () => {
    if (baseConfig) {
      return baseConfig;
    }
    const configFilePath = findNearestFile('eslint.config.js');
    if (!configFilePath) {
      throw new Error('Could not find eslint.config.js');
    }
    const mod: unknown = await import(configFilePath);
    assertIsConfig(mod);
    return mod.default;
  })();

  const errorizedConfig = config.map(convertWarnToError);

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
