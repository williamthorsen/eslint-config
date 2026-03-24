import type { Linter } from 'eslint';
import type { Config } from 'eslint/config';
import type { ConfigArray } from 'typescript-eslint';

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
  jsxA11y: (): Promise<ConfigArray> => import('./jsx-a11y.ts').then((m) => m.default()),
  next: (): Promise<Linter.Config> => import('./next.ts').then((m) => m.default()),
  react: (): Promise<ConfigArray> => import('./react.ts').then((m) => m.default()),
  reactTestingLibrary: (): Promise<ConfigArray> => import('./testing-library.ts').then((m) => m.default.react()),
  vitest: (): Promise<Linter.Config[]> => import('./vitest.ts').then((m) => m.default()),
};

export default configs;
