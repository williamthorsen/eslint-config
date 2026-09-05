import type { CycleTypeTopA } from './cycle-type-top-a.ts';

export interface CycleTypeTopB {
  a: CycleTypeTopA | undefined;
}
