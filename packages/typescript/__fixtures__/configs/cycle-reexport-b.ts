import type { CycleReexportA } from './cycle-reexport-a.ts';

export interface CycleReexportB {
  a: CycleReexportA | undefined;
}
