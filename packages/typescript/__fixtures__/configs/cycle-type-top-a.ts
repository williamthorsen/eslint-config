import type { CycleTypeTopB } from './cycle-type-top-b.ts';

export interface CycleTypeTopA {
  b: CycleTypeTopB | undefined;
}
