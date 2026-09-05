import type { CycleMixedA } from './cycle-mixed-a.ts';

export function cycleMixedB(): string {
  const a: CycleMixedA = { label: 'b' };
  return a.label;
}
