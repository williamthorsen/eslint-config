import type { Config } from 'eslint/config';

import eslintComments from './eslint-comments.ts';
import importConfig from './import.ts';
import javaScript from './javascript.ts';
import json from './json.ts';
import json5 from './json5.ts';
import createJsxA11y from './jsx-a11y.ts';
import n from './n.ts';
import createNext from './next.ts';
import packageJson from './package-json.ts';
import createReact from './react.ts';
import simpleImportSort from './simple-import-sort.ts';
import createTestingLibrary from './testing-library.ts';
import typeScript from './typescript.ts';
import unicorn from './unicorn.ts';
import createVitest from './vitest.ts';
import yaml from './yaml.ts';

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
