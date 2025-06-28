import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isObject } from '@williamthorsen/toolbelt.objects';
import { build, type Format, type Platform, type Plugin } from 'esbuild';
import { glob } from 'glob';

const CACHE_FILE = 'dist/esm/.cache';
const format: Format = 'esm';
const platform: Platform = 'node';
const target = 'es2022';

const aliases = {
  // '~src/': 'src/',
};
const dependencies = ['package.json', 'build.config.ts'];
const outputConfig = { format, platform, target: [target] };

// Type for build configuration modules
interface BuildConfig {
  include: string[];
}

// Type guard to validate build config structure
function isBuildConfig(value: unknown): value is BuildConfig {
  return (
    isObject(value) &&
    'include' in value &&
    Array.isArray(value.include) &&
    value.include.every((item) => typeof item === 'string')
  );
}

// Get entry points from build configuration
const entryPoints = await getEntryPointsFromBuildConfig();

if (await hashChanged()) {
  await build({
    entryPoints,
    outdir: 'dist/esm/',
    bundle: false,
    sourcemap: false,
    plugins: [rewriteTsExtensions()],
    ...outputConfig,
  });
}

// region | Helper functions
async function getEntryPointsFromBuildConfig(): Promise<string[]> {
  const buildConfigPath = path.resolve(process.cwd(), 'build.config.ts');

  if (!existsSync(buildConfigPath)) {
    throw new Error('build.config.ts not found in current directory');
  }

  // Import the build config dynamically
  const buildConfigModule: unknown = await import(buildConfigPath);

  if (!isBuildConfig(buildConfigModule)) {
    throw new Error('Invalid build.config.ts. Expected module with "include" export containing array of strings.');
  }

  const patterns = buildConfigModule.include;
  const files = await glob(patterns, {
    ignore: ['**/__tests__/**', '**/*.d.ts'],
  });

  console.info(`Found ${files.length} TypeScript files to compile:`, files);
  return files;
}

async function hashChanged(): Promise<boolean> {
  const previousHash = existsSync(CACHE_FILE) ? readFileSync(CACHE_FILE, 'utf8') : undefined;
  const currentHash = await computeHash();

  if (previousHash === currentHash) {
    console.info('No changes detected. Skipping build.');
    return false;
  }

  console.info('Changes detected.');
  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, currentHash);
  return true;
}

async function computeHash(): Promise<string> {
  const hash = createHash('sha256');
  for (const file of [...entryPoints, ...dependencies]) {
    const content = await readFile(file);
    hash.update(content);
  }

  hash.update(JSON.stringify(outputConfig));
  return hash.digest('hex');
}

function rewriteTsExtensions(): Plugin {
  return {
    name: 'rewrite-ts-extensions',
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, async (args) => {
        const fileDir = path.dirname(args.path);
        let code = await readFile(args.path, 'utf8');

        code = resolveAliasImports(code, fileDir, aliases);
        code = rewriteTsImportExtensions(code);

        return { contents: code, loader: 'ts' };
      });
    },
  };
}

/**
 * Rewrites alias import paths to relative filesystem paths from the importing file.
 *
 * @param code - The TypeScript source code.
 * @param fileDir - The absolute path to the importing file's directory.
 * @param aliasMap - A map of alias prefixes (e.g. '@/') to base paths (e.g. 'src/').
 */
function resolveAliasImports(code: string, fileDir: string, aliasMap: Record<string, string> = {}): string {
  for (const [alias, targetDir] of Object.entries(aliasMap)) {
    const escaped = alias.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`); // escape regex
    const regex = new RegExp(`(?<=from\\s+['"])${escaped}([^'"]+)(?=['"])`, 'g');

    code = code.replace(regex, (_, subpath: string) => {
      const absolute = path.resolve(targetDir, subpath);
      const relative = path.relative(fileDir, absolute);
      return relative.startsWith('.') ? relative : `./${relative}`;
    });
  }

  return code;
}

/**
 * Rewrites relative imports ending in `.ts` to `.js` to match compiled output.
 */
function rewriteTsImportExtensions(code: string): string {
  return code.replaceAll(/(?<=from\s+['"])(\.{1,2}\/[^'"]+)\.ts(?=['"])/g, '$1.js');
}
// endregion | Helper functions
