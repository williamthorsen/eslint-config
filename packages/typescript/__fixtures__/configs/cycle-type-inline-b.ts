import { type CycleTypeInlineA } from './cycle-type-inline-a.ts';

export interface CycleTypeInlineB {
  a: CycleTypeInlineA | undefined;
}
