export interface CycleQueryA {
  b: import('./cycle-query-b.ts').CycleQueryB | undefined;
}
