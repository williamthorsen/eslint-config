const ES_YEAR = /^es\d{4}$/;

/**
 * Reports whether one ES year is at least another. Every year is `es` followed by four digits, so
 * comparing the names as text orders them by year.
 */
export function isEsYearAtLeast(candidate: string, floor: string): boolean {
  return candidate >= floor;
}

/**
 * Normalizes the ES year named by a `target` or `lib` entry, or returns `undefined` when it names
 * none. No `esnext` form names a year, and neither does a suffixed lib such as `ESNext.Disposable`.
 */
export function parseEsYear(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  return ES_YEAR.test(normalized) ? normalized : undefined;
}

/**
 * Reads the ES year that a config declares in its own right, from `target` first and `lib` second. Among
 * several `lib` entries the highest year wins, since a lib list is additive.
 */
export function readDeclaredEsYear(compilerOptions: Record<string, unknown>): string | undefined {
  const target = compilerOptions['target'];
  const targetYear = typeof target === 'string' ? parseEsYear(target) : undefined;
  if (targetYear !== undefined) return targetYear;

  const libYears = toStringArray(compilerOptions['lib']).flatMap((entry) => {
    const year = parseEsYear(entry);
    return year === undefined ? [] : [year];
  });
  return libYears.toSorted().at(-1);
}

// region | Helpers

/** Narrows an arbitrary JSON value to the strings that it holds, treating anything else as empty. */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry: unknown): entry is string => typeof entry === 'string');
}

// endregion | Helpers
