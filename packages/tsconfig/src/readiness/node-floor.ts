import { isEsYearAtLeast } from './es-year.ts';

export const NO_BASE_ES_YEAR = 'no tsconfig reaches a @williamthorsen/tsconfig base declaring an ES year';
const NO_NODE_ES_YEAR = 'no ES year is known for the declared Node floor';

const NODE_MAJOR = /^v?(\d+)(?:[.\s]|$)/;

// Bounds the search for the lowest major covered by a table.
const NODE_MAJOR_CEILING = 99;

export type FloorVerdict = { detail: string; kind: 'fail' | 'pass' } | { kind: 'skip'; reason: string };

export type NodeEsYear = { esYear: string; kind: 'exact' } | { esYear: string; kind: 'under' } | { kind: 'unknown' };

/**
 * Classifies the ES year that a Node major implements, against a table covering only some majors.
 * A major that the table skips or postdates is unknown. A major below the table's lowest entry is
 * under that entry's year, since it implements strictly less.
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
 * Reduces declared Node floors to the lowest major that they name.
 * A repo runs on the oldest Node that any of its packages admits.
 */
export function findLowestNodeMajor(floors: readonly string[]): number | undefined {
  const majors = floors.flatMap((floor) => {
    const major = readNodeMajor(floor);
    return major === undefined ? [] : major;
  });
  return majors.length === 0 ? undefined : Math.min(...majors);
}

/**
 * Judges the ES year that the lowest declared Node floor implements against the ES year set by the
 * base, or names why the two cannot be compared.
 */
export function judgeNodeFloor(baseEsYear: string | undefined, nodeEsYear: NodeEsYear | undefined): FloorVerdict {
  if (baseEsYear === undefined) return { kind: 'skip', reason: NO_BASE_ES_YEAR };
  if (nodeEsYear === undefined) return { kind: 'skip', reason: 'no declared Node floor names a major' };

  // A major that the table skips or postdates is unknown, not unsupported: A consumer running ahead
  // of the table is not in breach.
  if (nodeEsYear.kind === 'unknown') return { kind: 'skip', reason: NO_NODE_ES_YEAR };

  if (nodeEsYear.kind === 'under') {
    return isEsYearAtLeast(baseEsYear, nodeEsYear.esYear)
      ? {
          detail: `the declared Node floor implements less than ${nodeEsYear.esYear}, below the base's ${baseEsYear}`,
          kind: 'fail',
        }
      : { kind: 'skip', reason: NO_NODE_ES_YEAR };
  }

  return isEsYearAtLeast(nodeEsYear.esYear, baseEsYear)
    ? { detail: `the declared Node floor implements ${nodeEsYear.esYear}`, kind: 'pass' }
    : {
        detail: `the declared Node floor implements only ${nodeEsYear.esYear}, below the base's ${baseEsYear}`,
        kind: 'fail',
      };
}

/**
 * Reads the major version named by a Node floor, such as `24`, `24.5`, or `v22.11.0`.
 * A comparator or an alias yields `undefined`.
 */
export function readNodeMajor(floor: string): number | undefined {
  const major = NODE_MAJOR.exec(floor.trim())?.[1];
  return major === undefined ? undefined : Number(major);
}

// region | Helpers

/** Finds the lowest Node major covered by a table. */
function findLowestKnownMajor(esYearForMajor: (candidate: number) => string | undefined): number | undefined {
  for (let candidate = 1; candidate <= NODE_MAJOR_CEILING; candidate += 1) {
    if (esYearForMajor(candidate) !== undefined) return candidate;
  }
  return undefined;
}

// endregion | Helpers
