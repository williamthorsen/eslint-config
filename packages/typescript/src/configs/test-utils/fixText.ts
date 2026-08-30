import path from 'node:path';

import { ESLint, type Linter } from 'eslint';
import type { Config } from 'eslint/config';

import { fixturesDir } from './lintFixture.ts';

export interface FixResult {
  /** The messages left after every fix was applied. */
  messages: Linter.LintMessage[];
  /** The fixed text, or the input where no fix applied. */
  output: string;
}

// Routes a file that exists only as text to the fixture tsconfig, so type-aware rules run against it and its
// imports of fixture modules resolve. `projectService: true` alone admits only files the project lists.
const virtualFileWiring: Config = {
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
        defaultProject: 'tsconfig.json',
      },
      tsconfigRootDir: fixturesDir,
    },
  },
};

// Lints the text with the composed config as though it were `fileName` in the fixtures directory, applying fixes
// until none remain. ESLint stops after ten passes, so a fixer that never converges reports its residue here.
export async function fixText(composed: readonly Config[], fileName: string, text: string): Promise<FixResult> {
  const eslint = new ESLint({
    cwd: fixturesDir,
    fix: true,
    overrideConfigFile: true,
    overrideConfig: toLinterConfigs([...composed, virtualFileWiring]),
  });

  const [result] = await eslint.lintText(text, { filePath: path.join(fixturesDir, fileName) });
  if (result === undefined) {
    throw new Error(`ESLint returned no result for ${fileName}`);
  }
  return { messages: result.messages, output: result.output ?? text };
}

// region | Helpers

// `new ESLint({ overrideConfig })` accepts `Linter.Config[]`, which models `languageOptions` with a
// nominally-incompatible index signature; bridge only at that constructor.
function toLinterConfigs(configs: readonly Config[]): Linter.Config[] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- see comment above
  return configs as Linter.Config[];
}

// endregion | Helpers
