export function report(items: readonly string[], isVerbose: boolean): void {
  // Leading with the complex operand is what `unicorn/prefer-simple-condition-first` reports.
  if (items.length > 0 && isVerbose) {
    // Iterating with `Array#forEach` is what `unicorn/no-for-each` reports.
    items.forEach((item) => {
      console.log(item);
    });
  }
}
