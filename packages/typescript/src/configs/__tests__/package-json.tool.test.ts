import { describe, expect, it } from 'vitest';

import { lintManifest } from '../test-utils/lintManifest.ts';

// A manifest satisfying every rule under test. Each case departs from it in one field, so a report names
// the departure rather than some unrelated gap.
const compliantManifest: Record<string, unknown> = {
  name: '@scope/subject',
  version: '1.0.0',
  description: 'Subject of the package.json tier suite',
  keywords: ['subject'],
  homepage: 'https://example.com/subject#readme',
  bugs: { url: 'https://example.com/subject/issues' },
  license: 'ISC',
  author: 'Subject Author <author@example.com>',
  engines: { node: '>=24' },
};

const publishableTierRules = [
  'package-json/require-bugs',
  'package-json/require-homepage',
  'package-json/require-keywords',
];

const universalTierRules = ['package-json/require-author', 'package-json/require-engines'];

const publishableTierFields = ['bugs', 'homepage', 'keywords'];

const universalTierFields = ['author', 'engines'];

describe('rules binding only publishable packages', () => {
  it('report nothing against a private manifest omitting every field they require', async () => {
    const reported = await lintManifest({ ...omitFields(compliantManifest, publishableTierFields), private: true });

    expect(reported.filter((ruleId) => publishableTierRules.includes(ruleId))).toStrictEqual([]);
  });

  it('report against a publishable manifest omitting the same fields', async () => {
    const reported = await lintManifest(omitFields(compliantManifest, publishableTierFields));

    expect(reported.filter((ruleId) => publishableTierRules.includes(ruleId)).toSorted()).toStrictEqual(
      publishableTierRules,
    );
  });
});

describe('rules binding every package', () => {
  it('report against a private manifest omitting author and engines', async () => {
    const reported = await lintManifest({ ...omitFields(compliantManifest, universalTierFields), private: true });

    expect(reported.filter((ruleId) => universalTierRules.includes(ruleId)).toSorted()).toStrictEqual(
      universalTierRules,
    );
  });
});

describe('the ban on local dependency paths', () => {
  it('reports a file: dependency in a publishable manifest', async () => {
    const reported = await lintManifest({ ...compliantManifest, dependencies: { '@scope/other': 'file:../other' } });

    expect(reported).toContain('package-json/no-local-dependencies');
  });

  it('reports nothing for a private manifest', async () => {
    const reported = await lintManifest({
      ...compliantManifest,
      dependencies: { '@scope/other': 'file:../other' },
      private: true,
    });

    expect(reported).not.toContain('package-json/no-local-dependencies');
  });

  it('reports nothing for the workspace protocol, which pnpm rewrites at publish time', async () => {
    const reported = await lintManifest({ ...compliantManifest, dependencies: { '@scope/other': 'workspace:*' } });

    expect(reported).not.toContain('package-json/no-local-dependencies');
  });
});

// region | Helpers

/** Returns the manifest without the named top-level fields. */
function omitFields(manifest: Record<string, unknown>, fields: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(manifest).filter(([field]) => !fields.includes(field)));
}

// endregion | Helpers
