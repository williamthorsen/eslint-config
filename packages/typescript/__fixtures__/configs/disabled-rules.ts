/**
 * Prints each item when verbose. A multi-line block whose lines lead with an asterisk is what
 * `unicorn/no-asterisk-prefix-in-documentation-comments` reports.
 */
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

// Consecutive guards that share an exit are what `unicorn/prefer-combined-guards` reports.
export function isComplete(name: string, age: number): boolean {
  if (name === '') return false;
  if (age < 0) return false;
  return true;
}

export function pairLines(names: readonly string[], ages: readonly number[]): string[] {
  const lines: string[] = [];
  // Indexing two arrays under a bound that covers both is what `unicorn/prefer-iterator-zip` reports.
  for (let index = 0; index < Math.min(names.length, ages.length); index++) {
    lines.push(`${names[index]}: ${ages[index]}`);
  }
  return lines;
}
