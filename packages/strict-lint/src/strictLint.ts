import { Linter } from 'eslint';
import ESLint from 'eslint/use-at-your-own-risk';

import { findNearestFile } from './common/findNearestFile.js';
import { convertWarnToError } from './convertWarnToError.js';
import FlatConfig = Linter.FlatConfig;

// @ts-expect-error - The experimental FlatESLint class is not typed
const { FlatESLint } = ESLint;

export async function strictLint(baseConfig?: FlatConfig[] | undefined): Promise<string> {
  const args = process.argv.slice(2);
  return doLint(baseConfig, ...args)
    .then(resultText => {
      console.info(resultText);
      if (/✖.*problem/.test(resultText)) {
        process.exit(1);
      }
      return resultText;
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

/**
 * Programmatically runs ESLint on the current directory.
 * TODO: Allow file pattern to be passed in.
 * @link https://eslint.org/docs/latest/integrate/nodejs-api#eslint-class
 */
async function doLint(baseConfig: FlatConfig[] | undefined, ...args: string[]): Promise<string> {
  const config = await (async () => {
    if (baseConfig) {
      return baseConfig;
    }
    const configFilePath = baseConfig || await findNearestFile('eslint.config.js');
    if (!configFilePath) {
      throw new Error('Could not find eslint.config.js');
    }
    const { default: config } = await import(configFilePath);
    return config;
  })();

  const errorizedConfig = config.map(convertWarnToError);

  const mode = args.includes('--fix') ? 'fix' : 'check';
  const eslint = new FlatESLint({
    cwd: process.cwd(),
    fix: mode === 'fix',
    overrideConfig: errorizedConfig,
  });

  const results = await eslint.lintFiles([
    '.',
  ]);

  // Writes fixes to files
  await FlatESLint.outputFixes(results);

  // Format and display the results
  const formatter = await eslint.loadFormatter('stylish');
  return formatter.format(results);
}
