import { describe, expect, it } from 'vitest';

import {
  declaresParserProject,
  enablesNextPlugin,
  importsFromDir,
  listRelativeNextRootDirs,
  listTsExtensionImports,
  setsNextRootDir,
  setsTsconfigRootDir,
} from '../eslint-config-contents.ts';

describe(declaresParserProject, () => {
  it('is true when parserOptions declares project', () => {
    const content = `export default [{ languageOptions: { parserOptions: { project: './tsconfig.json' } } }];`;

    expect(declaresParserProject(content)).toBe(true);
  });

  it('is true when project sits beside other parserOptions keys', () => {
    const content = `parserOptions: {
      tsconfigRootDir: import.meta.dirname,
      project: ['./tsconfig.json'],
    }`;

    expect(declaresParserProject(content)).toBe(true);
  });

  // An import resolver's `project` key is a different setting that the projectService form does not forbid.
  it('is false for a project key outside parserOptions', () => {
    const content = `settings: { 'import/resolver': { typescript: { project: './tsconfig.json' } } }`;

    expect(declaresParserProject(content)).toBe(false);
  });

  it('is false when parserOptions declares only the anchoring key', () => {
    const content = `parserOptions: { tsconfigRootDir: import.meta.dirname }`;

    expect(declaresParserProject(content)).toBe(false);
  });

  it('reads past a nested object to a later key in the same block', () => {
    const content = `parserOptions: { ecmaFeatures: { jsx: true }, project: './tsconfig.json' }`;

    expect(declaresParserProject(content)).toBe(true);
  });

  // The brace counter reads braces inside strings and comments as structure, so an unbalanced count
  // is reachable from a valid config; matching the rest of the file would report a project key that
  // is not in parserOptions at all.
  it('is false when the parserOptions block never closes', () => {
    const content = `parserOptions: { ecmaVersion: 'latest'
      settings: { 'import/resolver': { typescript: { project: './tsconfig.json' } } }`;

    expect(declaresParserProject(content)).toBe(false);
  });

  it('finds the declaration in a second parserOptions block', () => {
    const content = `parserOptions: { ecmaVersion: 'latest' }
      parserOptions: { project: './tsconfig.json' }`;

    expect(declaresParserProject(content)).toBe(true);
  });
});

describe(enablesNextPlugin, () => {
  it('is true for the factory this package exposes', () => {
    const content = `export default defineConfig(config, ...(await createConfig.next()));`;

    expect(enablesNextPlugin(content)).toBe(true);
  });

  it('is true for a direct import of the plugin', () => {
    const content = `import nextEslintPlugin from '@next/eslint-plugin-next';`;

    expect(enablesNextPlugin(content)).toBe(true);
  });

  it('is false for another factory on the same object', () => {
    const content = `export default defineConfig(config, ...(await createConfig.react()));`;

    expect(enablesNextPlugin(content)).toBe(false);
  });

  // A local re-export names neither the factory call nor the plugin, so the config reads as not
  // reaching it; a config that sets settings.next.rootDir is still judged on the value it writes.
  it('is false for a config reaching the factory through a local re-export', () => {
    const content = `import { next } from '../config/eslint-presets.ts';`;

    expect(enablesNextPlugin(content)).toBe(false);
  });
});

describe(importsFromDir, () => {
  it('matches a default-with-named import reaching into the directory', () => {
    const content = `import baseConfig, { createConfig } from './packages/typescript/src/index.ts';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(true);
  });

  it('matches a named-only import reaching into the directory', () => {
    const content = `import { commonIgnores } from './packages/typescript/src/ignores/index.ts';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(true);
  });

  it('matches a side-effect import of the directory itself', () => {
    expect(importsFromDir(`import './packages/typescript';`, 'packages/typescript')).toBe(true);
  });

  it('matches a dynamic import', () => {
    expect(importsFromDir(`await import('./packages/typescript/src/index.ts');`, 'packages/typescript')).toBe(true);
  });

  it('matches a require call', () => {
    expect(importsFromDir(`require('./packages/typescript/src/index.ts');`, 'packages/typescript')).toBe(true);
  });

  // Without a separator, the shorter directory name is a prefix of the longer one.
  it('is false for a directory the specifier merely starts with', () => {
    const content = `import config from './packages/typescript-utils/src/index.ts';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(false);
  });

  // Specifiers resolve against the repo root, above which no workspace can sit.
  it('is false for a specifier reaching above the repo root', () => {
    const content = `import config from '../packages/typescript/src/index.ts';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(false);
  });

  it('is false for a bare package specifier', () => {
    const content = `import config from '@williamthorsen/eslint-config-typescript';`;

    expect(importsFromDir(content, 'packages/typescript')).toBe(false);
  });
});

describe(listRelativeNextRootDirs, () => {
  it('reports a bare relative value', () => {
    const content = `export default [{ settings: { next: { rootDir: '.' } } }];`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual(['.']);
  });

  it('reports only the relative entry of a mixed array', () => {
    const content = `settings: { next: { rootDir: [import.meta.dirname, 'packages/nextjs'] } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual(['packages/nextjs']);
  });

  it('is empty when every array entry is absolute', () => {
    const content = `settings: { next: { rootDir: ['/repo/packages/web', '/repo/packages/admin'] } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  it('is empty for a bare absolute value', () => {
    const content = `settings: { next: { rootDir: '/repo/packages/nextjs' } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  it('is empty for the expression the fix recommends', () => {
    const content = `settings: { next: { rootDir: import.meta.dirname } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  // The literal is an argument to the call rather than the value, and the call resolves it against
  // an absolute directory.
  it('is empty for a literal nested inside a call expression', () => {
    const content = `settings: { next: { rootDir: path.join(import.meta.dirname, 'app') } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  // The array form exists for the multi-app shape, where each entry is anchored by a call.
  it('is empty for an array whose every entry is a call expression', () => {
    const content = `settings: { next: { rootDir: [path.join(import.meta.dirname, 'apps/web'), path.join(import.meta.dirname, 'apps/admin')] } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  it('reports only the literal entry of an array mixing a call expression with one', () => {
    const content = `settings: { next: { rootDir: [path.join(import.meta.dirname, 'apps/web'), 'apps/admin'] } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual(['apps/admin']);
  });

  it('is empty for an array entry that is an interpolated template', () => {
    const content = 'settings: { next: { rootDir: [`${import.meta.dirname}/apps/web`] } }';

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  // An interpolated template's text is not the path it resolves to, so reading it as one would
  // report an absolute value as relative.
  it('is empty for an interpolated template', () => {
    const content = 'settings: { next: { rootDir: `${import.meta.dirname}/app` } }';

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  it('is empty for a rootDir key outside a next block', () => {
    const content = `settings: { react: { rootDir: 'packages/nextjs' } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  it('is empty for a next block outside settings', () => {
    const content = `export default { next: { rootDir: 'packages/nextjs' } };`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual([]);
  });

  it('reports across two settings blocks', () => {
    const content = `settings: { next: { rootDir: 'packages/web' } }
      settings: { next: { rootDir: 'packages/admin' } }`;

    expect(listRelativeNextRootDirs(content)).toStrictEqual(['packages/web', 'packages/admin']);
  });
});

describe(listTsExtensionImports, () => {
  it('lists a default import by its specifier', () => {
    const content = `import root from '../../eslint.config.ts';`;

    expect(listTsExtensionImports(content)).toStrictEqual(['../../eslint.config.ts']);
  });

  it('lists every TypeScript extension', () => {
    const content = `import a from './a.ts';
      import b from './b.mts';
      import c from './c.cts';`;

    expect(listTsExtensionImports(content)).toStrictEqual(['./a.ts', './b.mts', './c.cts']);
  });

  it('ignores an extensionless or JavaScript specifier', () => {
    const content = `import config from '@williamthorsen/eslint-config-typescript';
      import root from '../../eslint.config.js';`;

    expect(listTsExtensionImports(content)).toStrictEqual([]);
  });

  it('lists a side-effect import, a dynamic import, and a require', () => {
    const content = `import './setup.ts';
      const lazy = await import('./lazy.ts');
      const legacy = require('./legacy.cts');`;

    expect(listTsExtensionImports(content)).toStrictEqual(['./setup.ts', './lazy.ts', './legacy.cts']);
  });

  it('reports one specifier once however often it is imported', () => {
    const content = `import a from './shared.ts';
      import './shared.ts';`;

    expect(listTsExtensionImports(content)).toStrictEqual(['./shared.ts']);
  });

  // TypeScript permits a type-only `.ts` specifier with no compiler option set.
  it('ignores a type-only import or re-export', () => {
    const content = `import type { Options } from './options.ts';
      export type { Rules } from './rules.ts';`;

    expect(listTsExtensionImports(content)).toStrictEqual([]);
  });

  it('lists an import whose specifiers are individually type-marked', () => {
    const content = `import { type Options } from './options.ts';`;

    expect(listTsExtensionImports(content)).toStrictEqual(['./options.ts']);
  });

  // Nothing but a quote stops a clause reaching back over the statement before it, whose `type`
  // keyword would otherwise be read as this statement's.
  it('lists a value import following a type-only one', () => {
    const content = `export type { Rules }
      import config from './config.ts'`;

    expect(listTsExtensionImports(content)).toStrictEqual(['./config.ts']);
  });
});

describe(setsNextRootDir, () => {
  it('is true for a literal value', () => {
    const content = `settings: { next: { rootDir: 'packages/nextjs' } }`;

    expect(setsNextRootDir(content)).toBe(true);
  });

  // A value no literal reader can judge still counts as set, so a config anchoring it correctly
  // reports a pass rather than a missing setting.
  it('is true for an expression value', () => {
    const content = `settings: { next: { rootDir: import.meta.dirname } }`;

    expect(setsNextRootDir(content)).toBe(true);
  });

  it('is false when the next block sets another key', () => {
    const content = `settings: { next: { pagesDir: 'pages' } }`;

    expect(setsNextRootDir(content)).toBe(false);
  });

  it('is false for a rootDir key outside a next block', () => {
    const content = `settings: { react: { rootDir: 'packages/nextjs' } }`;

    expect(setsNextRootDir(content)).toBe(false);
  });
});

describe(setsTsconfigRootDir, () => {
  it('is true when a config anchors the project service', () => {
    expect(setsTsconfigRootDir(`parserOptions: { tsconfigRootDir: import.meta.dirname }`)).toBe(true);
  });

  it('is false when no config key anchors it', () => {
    expect(setsTsconfigRootDir(`parserOptions: { ecmaVersion: 'latest' }`)).toBe(false);
  });
});
