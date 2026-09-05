import type { CycleJsextB } from './cycle-jsext-b.js';

export interface CycleJsextA {
  b: CycleJsextB | undefined;
}
