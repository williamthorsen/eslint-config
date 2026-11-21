import type { Config } from 'eslint/config';

import { eslintCommentsConfig } from './eslint-comments.ts';
import { importConfig } from './import.ts';
import { javaScriptConfig } from './javascript.ts';
import { jsonConfig } from './json.ts';
import { json5Config } from './json5.ts';
import { nConfig } from './n.ts';
import { packageJsonConfig, packageJsonPrivateRepoConfig } from './package-json.ts';
import { simpleImportSortConfig } from './simple-import-sort.ts';
import { typeScriptConfig } from './typescript.ts';
import { unicornConfig } from './unicorn.ts';
import { yamlConfig } from './yaml.ts';

export type ConfigName =
  | 'eslintComments'
  | 'import'
  | 'javaScript'
  | 'json'
  | 'json5'
  | 'n'
  | 'packageJson'
  | 'packageJsonPrivateRepo'
  | 'simpleImportSort'
  | 'typeScript'
  | 'unicorn'
  | 'yaml';

export const configs: Record<ConfigName, Config[]> = {
  eslintComments: eslintCommentsConfig,
  import: importConfig,
  javaScript: javaScriptConfig,
  json: jsonConfig,
  json5: json5Config,
  n: nConfig,
  packageJson: packageJsonConfig,
  packageJsonPrivateRepo: packageJsonPrivateRepoConfig,
  simpleImportSort: simpleImportSortConfig,
  typeScript: typeScriptConfig,
  unicorn: unicornConfig,
  yaml: yamlConfig,
};
