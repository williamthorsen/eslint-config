import { cycleMixedB } from './cycle-mixed-b.ts';

export interface CycleMixedA {
  label: string;
}

export function cycleMixedA(): string {
  return cycleMixedB();
}
