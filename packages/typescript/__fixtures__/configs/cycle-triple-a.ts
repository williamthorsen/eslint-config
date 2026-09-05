import type { CycleTripleB } from './cycle-triple-b.ts';

export interface CycleTripleA {
  b: CycleTripleB | undefined;
}
