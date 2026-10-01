import { target as exact } from '#target';
import { target as omitted } from '#src/target';
import { target as carried } from '#src/target.ts';

export const total = exact + omitted + carried;
