import type { DownstreamCycleC } from './downstream-cycle-c.ts';

export interface DownstreamCycleB {
  c: DownstreamCycleC | undefined;
}
