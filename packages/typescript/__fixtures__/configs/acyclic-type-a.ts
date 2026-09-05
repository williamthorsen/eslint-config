import type { AcyclicTypeB } from './acyclic-type-b.ts';

export interface AcyclicTypeA {
  b: AcyclicTypeB | undefined;
}
