#!/usr/bin/env node --loader @esbuild-kit/esm-loader

import { strictLint } from '../src/strictLint.js';

await strictLint();
