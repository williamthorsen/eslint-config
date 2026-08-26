import fs from 'node:fs';
import path from 'node:path';

import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

type MessageId = 'unbuiltBarrel' | 'unpublishedBarrel';

interface Options {
  outDir: string;
  sourceDir: string;
}

interface Manifest {
  dir: string;
  publishedTargets: ReadonlySet<string>;
}

type TypeExpression =
  | TSESTree.TSAsExpression
  | TSESTree.TSInstantiationExpression
  | TSESTree.TSNonNullExpression
  | TSESTree.TSSatisfiesExpression
  | TSESTree.TSTypeAssertion;

const defaultOptions: Options = { outDir: 'dist/esm', sourceDir: 'src' };

// Test scaffolding ships nothing, so a barrel under one of these has no entry point to sit at.
const scaffoldingDirs = new Set(['__fixtures__', '__mocks__', '__tests__', 'test-utils']);

const emittedExtensions = new Map([
  ['.cts', '.cjs'],
  ['.jsx', '.js'],
  ['.mts', '.mjs'],
  ['.ts', '.js'],
  ['.tsx', '.js'],
]);

const typeExpressionTypes = new Set<TSESTree.Node['type']>([
  AST_NODE_TYPES.TSAsExpression,
  AST_NODE_TYPES.TSInstantiationExpression,
  AST_NODE_TYPES.TSNonNullExpression,
  AST_NODE_TYPES.TSSatisfiesExpression,
  AST_NODE_TYPES.TSTypeAssertion,
]);

// Resolved manifests are memoized for the life of the process, so an edit to a package's entry points needs
// an ESLint server restart to take effect in an editor session.
const manifestCache = new Map<string, Manifest | undefined>();

const create: TSESLint.RuleCreateFunction<MessageId, [Partial<Options>?]> = (context) => {
  return {
    Program(node: TSESTree.Program) {
      if (!isBarrel(node)) {
        return;
      }

      const manifest = findNearestManifest(path.dirname(context.filename));
      if (manifest === undefined) {
        return;
      }

      const relativePath = toPosix(path.relative(manifest.dir, context.filename));
      if (hasScaffoldingSegment(relativePath)) {
        return;
      }

      // A manifest naming the file's own path publishes the source rather than a build of it.
      if (isPublished(relativePath, manifest.publishedTargets)) {
        return;
      }

      const options = { ...defaultOptions, ...context.options[0] };
      const target = toPublishedTarget(relativePath, options);

      if (target === undefined) {
        context.report({
          loc: node.loc.start,
          messageId: 'unbuiltBarrel',
          data: { sourceDir: options.sourceDir, sourcePath: relativePath },
        });
        return;
      }
      if (!isPublished(target, manifest.publishedTargets)) {
        context.report({
          loc: node.loc.start,
          messageId: 'unpublishedBarrel',
          data: { sourcePath: relativePath, target },
        });
      }
    },
  };
};

// region | Helper functions

/** Collects the local names every import declaration binds. */
function collectImportedNames(program: TSESTree.Program): Set<string> {
  const names = new Set<string>();

  for (const node of program.body) {
    if (node.type === AST_NODE_TYPES.ImportDeclaration) {
      for (const specifier of node.specifiers) {
        names.add(specifier.local.name);
      }
    }
  }
  return names;
}

/**
 * Collects the paths the manifest publishes. `exports` is authoritative wherever it is present; the legacy
 * fields name the entry points of a package that predates it, `types` among them because a declaration file
 * reaches this rule with its extension intact.
 */
function collectPublishedTargets(manifest: Record<string, unknown>): Set<string> {
  const declared =
    manifest['exports'] === undefined
      ? [manifest['bin'], manifest['main'], manifest['module'], manifest['types']]
      : manifest['exports'];

  return new Set(collectStrings(declared).map(normalizeTarget));
}

/**
 * Collects every string reachable in the value, at any depth of array or object nesting. Taking the strings
 * rather than the keys covers the bare-string and conditional-object `exports` forms with no list of
 * condition names.
 */
function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (isUnknownArray(value)) {
    return value.flatMap((item) => collectStrings(item));
  }
  if (isRecord(value)) {
    return Object.values(value).flatMap((item) => collectStrings(item));
  }
  return [];
}

/**
 * Returns true if the published target covers the path. A `*` stands for any run of characters, `/`
 * included, as Node's subpath patterns do, and a target ending in `/` covers everything below it.
 */
function coversTarget(published: string, target: string): boolean {
  if (published.endsWith('/')) {
    return target.startsWith(published);
  }
  if (!published.includes('*')) {
    return published === target;
  }
  return new RegExp(`^${published.split('*').map(escapeRegExp).join('.*')}$`).test(target);
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);
}

/** Returns the manifest governing the directory, memoizing every directory the walk visits. */
function findNearestManifest(dir: string): Manifest | undefined {
  if (manifestCache.has(dir)) {
    return manifestCache.get(dir);
  }

  const resolved = resolveManifest(dir);
  manifestCache.set(dir, resolved);
  return resolved;
}

/**
 * Returns true if any directory between the package root and the file is one the rule exempts. The path is
 * package-relative, so a repository checked out below a directory of one of these names exempts nothing.
 */
function hasScaffoldingSegment(relativePath: string): boolean {
  return relativePath
    .split('/')
    .slice(0, -1)
    .some((segment) => scaffoldingDirs.has(segment));
}

/** Returns true if the body holds only imports and re-exports, which is what makes the file a barrel. */
function isBarrel(program: TSESTree.Program): boolean {
  const importedNames = collectImportedNames(program);
  let hasReExport = false;

  for (const node of program.body) {
    if (node.type === AST_NODE_TYPES.ImportDeclaration) {
      // A side-effect import gives the file a purpose beyond re-exporting.
      if (node.specifiers.length === 0) {
        return false;
      }
      continue;
    }
    if (node.type === AST_NODE_TYPES.ExportAllDeclaration) {
      hasReExport = true;
      continue;
    }
    if (node.type === AST_NODE_TYPES.ExportNamedDeclaration) {
      if (node.declaration !== null || namesLocalBinding(node, importedNames)) {
        return false;
      }
      hasReExport ||= node.specifiers.length > 0;
      continue;
    }
    if (
      node.type === AST_NODE_TYPES.ExportDefaultDeclaration &&
      isImportedIdentifier(node.declaration, importedNames)
    ) {
      hasReExport = true;
      continue;
    }
    return false;
  }
  return hasReExport;
}

/** Returns true if the node resolves, through any wrapping type expression, to an imported binding. */
function isImportedIdentifier(node: TSESTree.Node, importedNames: ReadonlySet<string>): boolean {
  const unwrapped = unwrapTypeExpressions(node);

  return unwrapped.type === AST_NODE_TYPES.Identifier && importedNames.has(unwrapped.name);
}

/** Returns true if the specifier exports a binding the file imported. A string-named local never is one. */
function isImportedLocal(specifier: TSESTree.ExportSpecifier, importedNames: ReadonlySet<string>): boolean {
  return specifier.local.type === AST_NODE_TYPES.Identifier && importedNames.has(specifier.local.name);
}

/** Returns true if any target the manifest publishes covers the path. */
function isPublished(target: string, publishedTargets: ReadonlySet<string>): boolean {
  for (const published of publishedTargets) {
    if (coversTarget(published, target)) {
      return true;
    }
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTypeExpression(node: TSESTree.Node): node is TypeExpression {
  return typeExpressionTypes.has(node.type);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** Returns true if the source-less export names a binding the file defines rather than one it imported. */
function namesLocalBinding(node: TSESTree.ExportNamedDeclaration, importedNames: ReadonlySet<string>): boolean {
  return node.source === null && node.specifiers.some((specifier) => !isImportedLocal(specifier, importedNames));
}

/** Reduces a manifest path to the form a computed target takes: posix separators and no leading `./`. */
function normalizeTarget(target: string): string {
  return toPosix(target).replace(/^\.\//, '');
}

/** Reads the manifest at the path. A missing file and a malformed one are alike: neither states what a package publishes. */
function readManifest(manifestPath: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Reads the directory's own manifest, walking to the parent until one is found or the root is reached. */
function resolveManifest(dir: string): Manifest | undefined {
  const manifest = readManifest(path.join(dir, 'package.json'));
  if (manifest !== undefined) {
    return { dir, publishedTargets: collectPublishedTargets(manifest) };
  }

  const parent = path.dirname(dir);
  return parent === dir ? undefined : findNearestManifest(parent);
}

/** Splits a directory option into segments, treating `.` and an empty string as no directory at all. */
function splitDir(dir: string): string[] {
  return toPosix(dir)
    .split('/')
    .filter((segment) => !['', '.'].includes(segment));
}

/**
 * Rewrites a built path's extension to the one the compiler emits for it. A declaration file is already an
 * emitted form, so it keeps the extension it has.
 */
function toEmittedPath(builtPath: string): string {
  if (/\.d\.[cm]?ts$/.test(builtPath)) {
    return builtPath;
  }

  const extension = path.extname(builtPath);
  const emitted = emittedExtensions.get(extension);
  return emitted === undefined ? builtPath : builtPath.slice(0, -extension.length) + emitted;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/**
 * Maps a package-relative source path to the path the build emits for it, or undefined where the file lies
 * outside the source directory and so is never built.
 */
function toPublishedTarget(relativePath: string, options: Options): string | undefined {
  const sourceSegments = splitDir(options.sourceDir);
  const segments = relativePath.split('/');

  if (sourceSegments.some((segment, index) => segments[index] !== segment)) {
    return undefined;
  }
  return toEmittedPath([...splitDir(options.outDir), ...segments.slice(sourceSegments.length)].join('/'));
}

/** Strips the type-only expressions that can wrap a re-exported default. */
function unwrapTypeExpressions(node: TSESTree.Node): TSESTree.Node {
  let current = node;

  while (isTypeExpression(current)) {
    current = current.expression;
  }
  return current;
}

// endregion | Helper functions

const ruleDefinition = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow a barrel file outside a published entry point',
    },
    schema: [
      {
        type: 'object',
        properties: {
          outDir: { type: 'string' },
          sourceDir: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unbuiltBarrel:
        'Barrel outside a published entry point: this file is outside `{{sourceDir}}`, so the build emits no module for it, and the nearest package.json publishes no `{{sourcePath}}`. Import the defining modules directly, or publish this module.',
      unpublishedBarrel:
        'Barrel outside a published entry point: the nearest package.json publishes neither `{{target}}` nor `{{sourcePath}}`. Import the defining modules directly, or publish this module.',
    },
  },
  create,
} as const;

export default ruleDefinition;
