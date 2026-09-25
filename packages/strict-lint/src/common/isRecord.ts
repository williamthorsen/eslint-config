/** Checks whether a value is a non-null, non-array object, the shape that every config and config element takes. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
