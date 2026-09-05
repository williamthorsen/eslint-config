import type { CycleJsextA } from './cycle-jsext-a.js';

export interface CycleJsextB {
  a: CycleJsextA | undefined;
}
