const NODE_MAJOR = /^v?(\d+)(?:[.\s]|$)/;

// The widest range a Node major can occupy, bounding the search for the lowest major a table covers.
const NODE_MAJOR_CEILING = 99;

export type NodeEsYear = { esYear: string; kind: 'exact' } | { esYear: string; kind: 'under' } | { kind: 'unknown' };

/**
 * Classifies the ES year a Node major implements, against a table covering only some majors. A major
 * the table skips or postdates is unknown; one below every major it holds is not, since it predates
 * the table's lowest entry and so implements strictly less than that entry's year.
 */
export function classifyNodeEsYear(
  major: number,
  esYearForMajor: (candidate: number) => string | undefined,
): NodeEsYear {
  const esYear = esYearForMajor(major);
  if (esYear !== undefined) return { esYear, kind: 'exact' };

  const lowestKnown = findLowestKnownMajor(esYearForMajor);
  if (lowestKnown === undefined || major > lowestKnown) return { kind: 'unknown' };

  const lowestEsYear = esYearForMajor(lowestKnown);
  return lowestEsYear === undefined ? { kind: 'unknown' } : { esYear: lowestEsYear, kind: 'under' };
}

/**
 * Reduces declared Node floors to the lowest major they name. The weakest link decides: a repo runs
 * on the oldest Node any of its packages admits.
 */
export function findLowestNodeMajor(floors: readonly string[]): number | undefined {
  const majors = floors.flatMap((floor) => {
    const major = readNodeMajor(floor);
    return major === undefined ? [] : [major];
  });
  return majors.length === 0 ? undefined : Math.min(...majors);
}

/**
 * Reads the major version a Node floor names, such as `24`, `24.5`, or `v22.11.0`. A comparator or
 * an alias yields `undefined` rather than an invented major.
 */
export function readNodeMajor(floor: string): number | undefined {
  const major = NODE_MAJOR.exec(floor.trim())?.[1];
  return major === undefined ? undefined : Number(major);
}

// region | Helpers

/** Finds the lowest Node major a table covers. */
function findLowestKnownMajor(esYearForMajor: (candidate: number) => string | undefined): number | undefined {
  for (let candidate = 1; candidate <= NODE_MAJOR_CEILING; candidate += 1) {
    if (esYearForMajor(candidate) !== undefined) return candidate;
  }
  return undefined;
}

// endregion | Helpers
