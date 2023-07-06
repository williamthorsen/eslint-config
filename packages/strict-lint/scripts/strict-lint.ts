#!/usr/bin/env node --loader @esbuild-kit/esm-loader

import { strictLint } from '../index.js';

await strictLint();
