import type { CycleTripleA } from './cycle-triple-a.ts';

export interface CycleTripleC {
  a: CycleTripleA | undefined;
}
