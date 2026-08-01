export function shout(items: readonly string[]): void {
  // Discarding the result of `Array#map` is what `sky-pilot/no-unused-map` reports.
  items.map((item) => item.toUpperCase());
}
