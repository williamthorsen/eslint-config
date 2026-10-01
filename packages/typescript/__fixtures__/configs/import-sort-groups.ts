import fs from 'node:fs';

import { z } from 'zod';

import { at } from '@/at';

import { tilde } from '~/tilde';

import { hash } from '#src/hash.ts';

import { relative } from './relative.ts';

export const values = [fs, z, at, tilde, hash, relative];
