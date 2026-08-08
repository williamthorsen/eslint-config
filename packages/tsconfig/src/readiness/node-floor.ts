const NODE_MAJOR = /^v?(\d+)(?:[.\s]|$)/;

/**
 * Reduces declared Node floors to the lowest major they name. The weakest link decides: a repo runs
 * on the oldest Node any of its packages admits.
 */
export function lowestNodeMajor(floors: readonly string[]): number | undefined {
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
