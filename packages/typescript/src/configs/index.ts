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
  jsxA11y: async (): Promise<ConfigArray> => (await import('./jsx-a11y.ts')).default(),
  next: async (): Promise<Linter.Config> => (await import('./next.ts')).default(),
  react: async (): Promise<ConfigArray> => (await import('./react.ts')).default(),
  reactTestingLibrary: async (): Promise<ConfigArray> => (await import('./testing-library.ts')).default.react(),
  vitest: async (): Promise<Linter.Config[]> => (await import('./vitest.ts')).default(),
};

export default configs;
