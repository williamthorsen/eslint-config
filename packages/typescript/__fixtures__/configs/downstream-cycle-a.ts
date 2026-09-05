import type { DownstreamCycleB } from './downstream-cycle-b.ts';

export interface DownstreamCycleA {
  b: DownstreamCycleB | undefined;
}
