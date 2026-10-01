import { existsSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';

import * as ts from 'typescript';

const nodeBuiltins = new Set(builtinModules);

/**
 * The static import/export edges of a single module, split by how the guard treats them: The walk follows
 * `relative` and `subpath` (`#`-prefixed) edges into the package's own source, and the guard checks `external`
 * names against the manifest.
 */
interface ModuleEdges {
  relative: string[];
  subpath: string[];
  external: string[];
}

/**
 * Walks one entry file's static import graph and returns every external runtime package that it can reach, each
 * mapped to the repo-relative source files that import it. A dynamic `import()` is never a module-level declaration,
 * so the opt-in configs that one loads never enter the graph.
 */
export function collectStaticExternalImports(entryFile: string, repoRoot: string): Map<string, Set<string>> {
  const importersByPackage = new Map<string, Set<string>>();
  const visited = new Set<string>();

  /** Records a module's external imports and recurses into its relative ones. */
  function walk(candidate: string): void {
    const file = resolveModuleFile(candidate);
    if (file === undefined) {
      // Fail on an unresolved edge: Skipping it would truncate the graph and let an undeclared import beyond it
      // escape the guard.
      throw new Error(`Unresolved import in the static import graph: ${candidate}`);
    }
    if (visited.has(file)) {
      return;
    }
    visited.add(file);

    const edges = collectEdges(readSourceFile(file));
    const importer = path.relative(repoRoot, file);
    for (const name of edges.external) {
      const importers = importersByPackage.get(name) ?? new Set<string>();
      importers.add(importer);
      importersByPackage.set(name, importers);
    }
    for (const relative of edges.relative) {
      walk(path.resolve(path.dirname(file), relative));
    }
    for (const subpath of edges.subpath) {
      walk(resolveSubpathImport(subpath, file));
    }
  }

  walk(entryFile);
  return importersByPackage;
}

/** Returns the external runtime packages that a single module imports, as sorted package names. */
export function parseExternalImports(sourceText: string, fileName = 'inline.ts'): string[] {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, scriptKindFor(fileName));
  return [...new Set(collectEdges(sourceFile).external)].toSorted((a, b) => a.localeCompare(b));
}

/** Parses a file into a TypeScript source file. */
function readSourceFile(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, scriptKindFor(file));
}

/** Splits a module's runtime import and export-from specifiers into relative paths, subpath imports, and external package names. */
function collectEdges(sourceFile: ts.SourceFile): ModuleEdges {
  const relative: string[] = [];
  const subpath: string[] = [];
  const external: string[] = [];

  for (const statement of sourceFile.statements) {
    const specifier = runtimeModuleSpecifier(statement);
    if (specifier === undefined) {
      continue;
    }
    if (specifier.startsWith('.')) {
      relative.push(specifier);
    } else if (specifier.startsWith('#')) {
      subpath.push(specifier);
    } else if (!isNodeBuiltin(specifier)) {
      external.push(toPackageName(specifier));
    }
  }

  return { relative, subpath, external };
}

/**
 * Returns the module specifier of a runtime import or export-from statement, or `undefined` for any other statement,
 * including a fully type-only one, which compilation erases.
 */
function runtimeModuleSpecifier(statement: ts.Statement): string | undefined {
  if (ts.isImportDeclaration(statement)) {
    if (!isRuntimeImport(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      return undefined;
    }
    return statement.moduleSpecifier.text;
  }
  if (ts.isExportDeclaration(statement)) {
    const { moduleSpecifier } = statement;
    if (moduleSpecifier === undefined || statement.isTypeOnly || !ts.isStringLiteral(moduleSpecifier)) {
      return undefined;
    }
    return moduleSpecifier.text;
  }
  return undefined;
}

/** Reports whether an import loads runtime code: It does unless it is type-only as a whole or in every element. */
function isRuntimeImport(node: ts.ImportDeclaration): boolean {
  const clause = node.importClause;
  if (clause === undefined) {
    return true;
  }
  if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) {
    return false;
  }
  if (clause.name !== undefined) {
    return true;
  }
  const bindings = clause.namedBindings;
  if (bindings === undefined || ts.isNamespaceImport(bindings)) {
    return true;
  }
  return bindings.elements.some((element) => !element.isTypeOnly);
}

/** Reduces a bare specifier to its package name: `@scope/pkg/sub` -> `@scope/pkg`, `pkg/sub` -> `pkg`. */
function toPackageName(specifier: string): string {
  const segments = specifier.split('/');
  if (specifier.startsWith('@')) {
    return segments.slice(0, 2).join('/');
  }
  return segments[0] ?? specifier;
}

/** Reports whether a specifier names a Node builtin, with or without the `node:` prefix. */
function isNodeBuiltin(specifier: string): boolean {
  if (specifier.startsWith('node:')) {
    return true;
  }
  return nodeBuiltins.has(specifier);
}

/**
 * Resolves a `#` subpath import against the wildcard patterns in the `imports` map of the importing file's nearest `package.json`. Returns
 * the specifier unchanged when no pattern matches, which the walk then reports as an unresolved edge.
 */
function resolveSubpathImport(specifier: string, importer: string): string {
  const manifestPath = findNearestManifest(path.dirname(importer));
  if (manifestPath === undefined) {
    return specifier;
  }
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const imports = isRecord(manifest) && isRecord(manifest['imports']) ? manifest['imports'] : {};
  for (const [pattern, target] of Object.entries(imports)) {
    const patternStar = pattern.indexOf('*');
    const targetStar = typeof target === 'string' ? target.indexOf('*') : -1;
    if (typeof target !== 'string' || patternStar === -1 || targetStar === -1) {
      continue;
    }
    const prefix = pattern.slice(0, patternStar);
    const suffix = pattern.slice(patternStar + 1);
    if (specifier.startsWith(prefix) && specifier.endsWith(suffix)) {
      const match = specifier.slice(prefix.length, specifier.length - suffix.length);
      const resolved = target.slice(0, targetStar) + match + target.slice(targetStar + 1);
      return path.resolve(path.dirname(manifestPath), resolved);
    }
  }
  return specifier;
}

/** Finds the `package.json` in `directory` or its nearest ancestor that contains one. */
function findNearestManifest(directory: string): string | undefined {
  const candidate = path.join(directory, 'package.json');
  if (existsSync(candidate)) {
    return candidate;
  }
  const parent = path.dirname(directory);
  return parent === directory ? undefined : findNearestManifest(parent);
}

/** Reports whether a value is a non-array object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Resolves an import path to a source file by trying the TypeScript extensions and directory indexes. */
function resolveModuleFile(candidate: string): string | undefined {
  const attempts = [
    candidate,
    `${candidate}.ts`,
    `${candidate}.tsx`,
    path.join(candidate, 'index.ts'),
    path.join(candidate, 'index.tsx'),
  ];
  return attempts.find((attempt) => existsSync(attempt) && statSync(attempt).isFile());
}

/** Returns the script kind that matches a file's extension. */
function scriptKindFor(file: string): ts.ScriptKind {
  return file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}
