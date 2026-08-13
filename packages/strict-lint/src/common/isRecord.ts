/** Whether a value is a non-null, non-array object, which is the shape every config and config element takes. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
