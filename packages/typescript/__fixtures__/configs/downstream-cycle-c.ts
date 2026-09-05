import type { DownstreamCycleB } from './downstream-cycle-b.ts';

export interface DownstreamCycleC {
  b: DownstreamCycleB | undefined;
}
