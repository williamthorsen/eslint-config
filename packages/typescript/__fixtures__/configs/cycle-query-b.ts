import type { CycleQueryA } from './cycle-query-a.ts';

export interface CycleQueryB {
  a: CycleQueryA | undefined;
}
