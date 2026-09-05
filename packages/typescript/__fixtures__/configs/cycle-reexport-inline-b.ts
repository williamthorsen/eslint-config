import type { CycleReexportInlineA } from './cycle-reexport-inline-a.ts';

export interface CycleReexportInlineB {
  a: CycleReexportInlineA | undefined;
}
