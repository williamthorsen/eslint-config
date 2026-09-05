import { type CycleTypeInlineB } from './cycle-type-inline-b.ts';

export interface CycleTypeInlineA {
  b: CycleTypeInlineB | undefined;
}
