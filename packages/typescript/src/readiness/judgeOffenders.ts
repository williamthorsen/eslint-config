/** Passes when nothing offends, and otherwise fails with a detail that follows the label with every offender. */
export function judgeOffenders(
  offenders: readonly string[],
  label: string,
  separator = ', ',
): true | { detail: string; ok: false } {
  if (offenders.length === 0) return true;
  return { ok: false, detail: `${label} ${offenders.join(separator)}` };
}
