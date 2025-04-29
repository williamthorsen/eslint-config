import type { Linter } from 'eslint';
import type { ConfigArray } from 'typescript-eslint';

import type { OptionalConfig } from '../utils/resolveOptionalConfigs.js';
import eslintComments from './eslint-comments.js';
import javaScript from './javascript.js';
import json from './json.js';
import json5 from './json5.js';
import n from './n.js';
import next from './next.js';
import packageJson from './package-json.js';
import react from './react.js';
import simpleImportSort from './simple-import-sort.js';
import { reactTestingLibrary } from './testing-library.js';
import typeScript from './typescript.js';
import unicorn from './unicorn.js';
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

export const optionalConfigs = {
  next,
  react,
  reactTestingLibrary,
} satisfies Record<string, OptionalConfig>;

export default configs;
