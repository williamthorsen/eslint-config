import { compareVersions } from 'readyup/check-utils';

import { readVersionFloor } from './readVersionFloor.ts';

export type PeerComparison =
  { floor: string; installed: string; kind: 'comparable'; range: string } | { kind: 'unknown'; reason: string };

interface PeerVersions {
  installed: string | undefined;
  name: string;
  owner: string;
  range: string | undefined;
}

/** Resolves the two versions that a peer floor check compares, or the reason why they cannot be compared. */
export function comparePeer({ installed, name, owner, range }: PeerVersions): PeerComparison {
  if (range === undefined) return { kind: 'unknown', reason: `${owner} declares no ${name} peer` };

  const floor = readVersionFloor(range);
  if (floor === undefined) return { kind: 'unknown', reason: `peer range "${range}" names no single floor` };

  if (installed === undefined) return { kind: 'unknown', reason: `${name} is not installed` };

  return { floor, installed, kind: 'comparable', range };
}

/** Judges whether the installed version reaches the floor of the peer range. */
export function judgePeerFloor({ floor, installed, range }: Extract<PeerComparison, { kind: 'comparable' }>): {
  detail: string;
  ok: boolean;
} {
  return compareVersions(installed, floor) >= 0
    ? { ok: true, detail: `${installed} satisfies the ${range} peer range` }
    : { ok: false, detail: `${installed} is below the ${range} peer range` };
}

/** Returns the lowest of the versions, or undefined when there are none. */
export function pickLowestVersion(versions: readonly string[]): string | undefined {
  let lowest: string | undefined;
  for (const version of versions) {
    if (lowest === undefined || compareVersions(version, lowest) < 0) lowest = version;
  }
  return lowest;
}
