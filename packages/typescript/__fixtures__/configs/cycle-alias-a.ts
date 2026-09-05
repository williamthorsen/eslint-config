import type { CycleAliasB } from '@fixture/cycle-alias-b.ts';

export interface CycleAliasA {
  b: CycleAliasB | undefined;
}
