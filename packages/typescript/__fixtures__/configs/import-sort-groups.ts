import fs from 'node:fs';

import { resolve } from 'import-meta-resolve';
import { z } from 'zod';

import { at } from '@/at';

import { tilde } from '~/tilde';

import { hash } from '#src/hash.ts';

import { lib } from '$lib/lib';

import { relative } from './relative.ts';

import './setup.ts';
import 'reflect-metadata';
import './styles.css';

export const values = [fs, resolve, z, at, tilde, hash, lib, relative];
