export function report(items: readonly string[], isVerbose: boolean): void {
  // Leading with the complex operand is what `unicorn/prefer-simple-condition-first` reports.
  if (items.length > 0 && isVerbose) {
    // Iterating with `Array#forEach` is what `unicorn/no-for-each` reports.
    items.forEach((item) => {
      console.log(item);
    });
  }
}

export function describeCount(count: number): string {
  // An unparenthesized ternary in the alternate, the form in which Prettier writes it, is what `unicorn/no-nested-ternary` reports.
  return count === 0 ? 'none' : count === 1 ? 'one' : 'many';
}
