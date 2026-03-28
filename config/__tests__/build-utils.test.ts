import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveAliasImports, rewriteTsImportExtensions } from '../build-utils.ts';

describe('rewriteTsImportExtensions', () => {
  it('rewrites static import with single quotes', () => {
    const input = `import { foo } from './foo.ts';`;
    expect(rewriteTsImportExtensions(input)).toBe(`import { foo } from './foo.js';`);
  });

  it('rewrites static import with double quotes', () => {
    const input = `import { foo } from "./foo.ts";`;
    expect(rewriteTsImportExtensions(input)).toBe(`import { foo } from "./foo.js";`);
  });

  it('rewrites static re-export', () => {
    const input = `export { bar } from '../bar.ts';`;
    expect(rewriteTsImportExtensions(input)).toBe(`export { bar } from '../bar.js';`);
  });

  it('rewrites dynamic import', () => {
    const input = `import('./foo.ts')`;
    expect(rewriteTsImportExtensions(input)).toBe(`import('./foo.js')`);
  });

  it('rewrites dynamic import with .then()', () => {
    const input = `import('./foo.ts').then((m) => m.default())`;
    expect(rewriteTsImportExtensions(input)).toBe(`import('./foo.js').then((m) => m.default())`);
  });

  it('rewrites dynamic import with double quotes', () => {
    const input = `import("./foo.ts")`;
    expect(rewriteTsImportExtensions(input)).toBe(`import("./foo.js")`);
  });

  it('leaves non-relative dynamic imports unchanged', () => {
    const input = `import('eslint-plugin-react')`;
    expect(rewriteTsImportExtensions(input)).toBe(input);
  });

  it('leaves non-.ts extensions unchanged', () => {
    const input = `import('./foo.js')`;
    expect(rewriteTsImportExtensions(input)).toBe(input);
  });

  it('rewrites multiple imports in one string', () => {
    const input = [
      `import { a } from './a.ts';`,
      `import('./b.ts').then((m) => m.default());`,
      `export { c } from '../c.ts';`,
    ].join('\n');

    const expected = [
      `import { a } from './a.js';`,
      `import('./b.js').then((m) => m.default());`,
      `export { c } from '../c.js';`,
    ].join('\n');

    expect(rewriteTsImportExtensions(input)).toBe(expected);
  });

  it('rewrites parent-relative dynamic imports', () => {
    const input = `import('../utils/helper.ts')`;
    expect(rewriteTsImportExtensions(input)).toBe(`import('../utils/helper.js')`);
  });
});

describe('resolveAliasImports', () => {
  const aliases = { '~/src/': 'src/' };

  it('rewrites alias path to relative path', () => {
    const input = `import { foo } from '~/src/utils/foo.ts';`;
    const fileDir = path.resolve('src/configs');
    const result = resolveAliasImports(input, fileDir, aliases);
    expect(result).toContain('../utils/foo.ts');
    expect(result).not.toContain('~/src/');
  });

  it('rewrites alias path in re-export', () => {
    const input = `export { foo } from '~/src/utils/foo.ts';`;
    const fileDir = path.resolve('src/configs');
    const result = resolveAliasImports(input, fileDir, aliases);
    expect(result).toContain('../utils/foo.ts');
    expect(result).not.toContain('~/src/');
  });

  it('leaves non-alias paths unchanged', () => {
    const input = `import { bar } from './bar.ts';`;
    const fileDir = path.resolve('src/configs');
    expect(resolveAliasImports(input, fileDir, aliases)).toBe(input);
  });

  it('rewrites multiple alias imports', () => {
    const input = [`import { a } from '~/src/utils/a.ts';`, `import { b } from '~/src/helpers/b.ts';`].join('\n');
    const fileDir = path.resolve('src/configs');
    const result = resolveAliasImports(input, fileDir, aliases);
    expect(result).not.toContain('~/src/');
    expect(result).toContain('../utils/a.ts');
    expect(result).toContain('../helpers/b.ts');
  });
});
