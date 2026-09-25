import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// A package README ships in the package's tarball, which contains nothing outside the package directory. A relative
// link that climbs out of the package resolves in the repo and nowhere the published README is read.
describe('package README links', () => {
  it('no package README links outside its package by relative path', () => {
    const offenders = globSync('packages/*/README.md', { cwd: repoRoot })
      .toSorted()
      .flatMap((readme) => {
        const markdown = readFileSync(path.join(repoRoot, readme), 'utf8');
        const packageDir = path.join(repoRoot, path.dirname(readme));
        return findEscapingTargets(markdown, packageDir).map((target) => `${readme}: ${target}`);
      });

    expect(offenders).toStrictEqual([]);
  });

  it('reports only the relative links that escape the package', () => {
    const markdown = [
      'See [the guide](../../docs/guide.md#usage) and [the source](./src/index.ts).',
      'Also [the site](https://example.com/docs), [mail](mailto:a@example.com), [a section](#setup), and [a host](//example.com).',
      '[sibling]: ../other/README.md "Sibling package"',
      '[changelog]: CHANGELOG.md',
      '[notes]: ..notes/draft.md',
    ].join('\n');

    const targets = findEscapingTargets(markdown, path.join(repoRoot, 'packages', 'example'));

    expect(targets).toStrictEqual(['../../docs/guide.md#usage', '../other/README.md']);
  });
});

// region | Helpers

/** Extracts the targets of inline links and reference definitions, in document order within each form. */
function extractLinkTargets(markdown: string): string[] {
  const inlineTargets = markdown.matchAll(/\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)/gu).toArray();
  const referenceTargets = markdown.matchAll(/^ {0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/gmu).toArray();
  return [...inlineTargets, ...referenceTargets].map((match) => match[1] ?? '');
}

/** Returns each relative link target in a README at the package root that resolves outside the package directory. */
function findEscapingTargets(markdown: string, packageDir: string): string[] {
  return extractLinkTargets(markdown).filter((target) => {
    const linkedPath = target.split(/[#?]/u, 1)[0] ?? '';
    if (linkedPath === '' || isExternal(linkedPath)) return false;
    const relativePath = path.relative(packageDir, path.resolve(packageDir, linkedPath));
    return relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath);
  });
}

/** Reports whether a target names a URL scheme or a host rather than a path. */
function isExternal(target: string): boolean {
  return /^[a-z][\d+.a-z-]*:/iu.test(target) || target.startsWith('//');
}

// endregion | Helpers
