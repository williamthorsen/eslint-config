import { cycleValueA } from './cycle-value-a.ts';

export function cycleValueB(): string {
  return cycleValueA();
}
