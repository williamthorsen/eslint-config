import type { Config } from 'eslint/config';

import eslintComments from './eslint-comments.ts';
import importConfig from './import.ts';
import javaScript from './javascript.ts';
import json from './json.ts';
import json5 from './json5.ts';
import n from './n.ts';
import packageJson from './package-json.ts';
import simpleImportSort from './simple-import-sort.ts';
import typeScript from './typescript.ts';
import unicorn from './unicorn.ts';
import yaml from './yaml.ts';

export type ConfigName =
  | 'eslintComments'
  | 'import'
  | 'javaScript'
  | 'json'
  | 'json5'
  | 'n'
  | 'packageJson'
  | 'simpleImportSort'
  | 'typeScript'
  | 'unicorn'
  | 'yaml';

export const configs: Record<ConfigName, Config[]> = {
  eslintComments,
  import: importConfig,
  javaScript,
  json,
  json5,
  n,
  packageJson,
  simpleImportSort,
  typeScript,
  unicorn,
  yaml,
};
