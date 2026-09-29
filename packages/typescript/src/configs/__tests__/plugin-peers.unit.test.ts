import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const configsDir = path.resolve(import.meta.dirname, '..');
const manifestPath = path.resolve(configsDir, '../../package.json');

// A plugin that a factory imports must be an optional peer: pnpm links a peer from the consumer into this
// package's own `node_modules`, whereas an undeclared import resolves only if pnpm hoists the consumer's copy.
describe('the plugins that the config factories import lazily', () => {
  const specifiers = listDynamicBareSpecifiers();
  const manifest = readManifest();

  it('are found in the config sources', () => {
    expect(specifiers).not.toStrictEqual([]);
  });

  it('are each declared as a peer dependency', () => {
    const undeclared = specifiers.filter((specifier) => !Object.hasOwn(manifest.peerDependencies, specifier));

    expect(undeclared).toStrictEqual([]);
  });

  it('are each marked optional', () => {
    const required = specifiers.filter((specifier) => manifest.peerDependenciesMeta[specifier]?.optional !== true);

    expect(required).toStrictEqual([]);
  });
});

// region | Helpers

interface PeerManifest {
  peerDependencies: Record<string, unknown>;
  peerDependenciesMeta: Record<string, { optional?: unknown } | undefined>;
}

/** Reports whether a value is a non-null object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Collects the non-relative specifiers that the config sources pass to `import()`, sorted and deduplicated. */
function listDynamicBareSpecifiers(): string[] {
  const specifiers = new Set<string>();
  const sourceFiles = readdirSync(configsDir, { withFileTypes: true }).filter(
    (entry) => entry.isFile() && entry.name.endsWith('.ts'),
  );

  for (const entry of sourceFiles) {
    const source = readFileSync(path.join(configsDir, entry.name), 'utf8');
    const matches = source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g);

    for (const [, specifier] of matches) {
      if (specifier !== undefined && !specifier.startsWith('.')) {
        specifiers.add(specifier);
      }
    }
  }

  return [...specifiers].toSorted();
}

/** Reads the peer fields from the package's manifest, treating a missing field as empty. */
function readManifest(): PeerManifest {
  const parsed: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const peers = isRecord(parsed) ? parsed['peerDependencies'] : undefined;
  const metas = isRecord(parsed) ? parsed['peerDependenciesMeta'] : undefined;
  const peerDependenciesMeta = Object.fromEntries(
    Object.entries(isRecord(metas) ? metas : {}).map(([name, meta]) => [name, isRecord(meta) ? meta : undefined]),
  );

  return { peerDependencies: isRecord(peers) ? peers : {}, peerDependenciesMeta };
}

// endregion | Helpers
