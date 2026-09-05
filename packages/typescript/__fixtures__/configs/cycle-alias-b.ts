import type { CycleAliasA } from '@fixture/cycle-alias-a.ts';

export interface CycleAliasB {
  a: CycleAliasA | undefined;
}
