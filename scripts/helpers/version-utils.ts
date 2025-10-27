/**
 * Version comparison utilities
 */

export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;

    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  return 0;
}

export function getHighestVersion(versions: Record<string, string>): { packageName: string; version: string } | null {
  const entries = Object.entries(versions);

  if (entries.length === 0) {
    return null;
  }

  const firstEntry = entries[0];
  if (!firstEntry) {
    return null;
  }

  let highest = firstEntry;

  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const [packageName, version] = entry;
    if (compareVersions(version, highest[1]) > 0) {
      highest = [packageName, version];
    }
  }

  return {
    packageName: highest[0],
    version: highest[1],
  };
}
