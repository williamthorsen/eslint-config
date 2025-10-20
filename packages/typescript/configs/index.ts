import type { Config } from 'eslint/config';

import eslintComments from './eslint-comments.js';
import importConfig from './import.js';
import javaScript from './javascript.js';
import json from './json.js';
import json5 from './json5.js';
import createJsxA11y from './jsx-a11y.js';
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
  import: importConfig,
  javaScript,
  json,
  json5,
  packageJson,
  simpleImportSort,
  n,
  typeScript,
  unicorn,
  yaml,
} satisfies Record<string, Config[]>;

export const createConfig = {
  jsxA11y: createJsxA11y,
  next: createNext,
  react: createReact,
  reactTestingLibrary: createTestingLibrary.react,
  vitest: createVitest,
};

export default configs;
