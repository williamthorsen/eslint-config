import { cycleValueB } from './cycle-value-b.ts';

export function cycleValueA(): string {
  return cycleValueB();
}
