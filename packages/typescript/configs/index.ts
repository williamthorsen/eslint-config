import type { Linter } from 'eslint';
import type { ConfigArray } from 'typescript-eslint';

import eslintComments from './eslint-comments.js';
import javaScript from './javascript.js';
import json from './json.js';
import json5 from './json5.js';
import n from './n.js';
import createNext from './next.js';
import packageJson from './package-json.js';
import createReact from './react.js';
import simpleImportSort from './simple-import-sort.js';
import createTestingLibrary from './testing-library.js';
import typeScript from './typescript.js';
import unicorn from './unicorn.js';
import createVitest from './vitest.js';
import yaml from './yaml.js';

export const configs = {
  eslintComments,
  javaScript,
  json,
  json5,
  packageJson,
  simpleImportSort,
  n,
  typeScript,
  unicorn,
  yaml,
} satisfies Record<string, Linter.Config | ConfigArray>;

export const createConfig = {
  next: createNext,
  react: createReact,
  reactTestingLibrary: createTestingLibrary.react,
  vitest: createVitest,
} satisfies Record<string, () => Promise<ConfigArray | Linter.Config>>;

export default configs;
