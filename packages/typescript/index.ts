import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import configs, { optionalConfigs } from './configs/index.js';
import { resolveOptionalConfigs } from './utils/resolveOptionalConfigs.js';

const javaScriptExtensions = ['*.{js,cjs,mjs,jsx}'];
const typeScriptExtensions = ['*.{ts,cts,mts,tsx}'];
const codeExtensions = [...javaScriptExtensions, ...typeScriptExtensions];

const javaScriptFiles = javaScriptExtensions.map((ext) => `**/${ext}`);
const typeScriptFiles = typeScriptExtensions.map((ext) => `**/${ext}`);
const codeFiles = codeExtensions.map((ext) => `**/${ext}`);

const config = [
  ...tseslint.config({
    files: typeScriptFiles,
    extends: [
      eslint.configs.recommended, //
      configs.typeScript,
    ],
  }),
  {
    files: ['**/*.d.ts'],
    rules: {
      'import/no-duplicates': 'off',
    },
  },
  ...tseslint.config({
    files: javaScriptFiles,
    extends: [
      configs.javaScript, //
    ],
  }),
  ...tseslint.config({
    files: codeFiles,
    extends: [
      configs.eslintComments,
      configs.n,
      configs.simpleImportSort,
      configs.unicorn,
      ...(await resolveOptionalConfigs([
        optionalConfigs.next,
        optionalConfigs.react,
        optionalConfigs.reactTestingLibrary,
      ])),
    ],
  }),
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: globals.commonjs,
    },
  },
  configs.json,
  configs.json5, // Apply this after the `json` config, because it replaces some general JSON rules with JSON5 rules!
  configs.packageJson,
  configs.yaml,
];

const patterns = {
  codeExtensions,
  codeFiles,
  javaScriptExtensions,
  javaScriptFiles,
  typeScriptExtensions,
  typeScriptFiles,
};

export { default as configs } from './configs/index.js';
export { patterns };
export default config;
