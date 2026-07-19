import { existsSync, readFileSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';

import * as ts from 'typescript';

const nodeBuiltins = new Set(builtinModules);

// The static import/export edges of a single module, split by how the guard treats them: `relative`
// edges are followed into the package's own source, `external` names are checked against the manifest.
interface ModuleEdges {
  relative: string[];
  external: string[];
}

// Walk one entry file's static import graph and return every external runtime package it can reach,
// each mapped to the repo-relative source files that import it. Relative edges are followed into
// source; dynamic `import()` is never a module-level declaration, so it is excluded structurally and
// the opt-in configs sitting behind it never enter the graph.
export function collectStaticExternalImports(entryFile: string, repoRoot: string): Map<string, Set<string>> {
  const importersByPackage = new Map<string, Set<string>>();
  const visited = new Set<string>();

  function walk(candidate: string): void {
    const file = resolveModuleFile(candidate);
    if (file === undefined || visited.has(file)) {
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
  }

  walk(entryFile);
  return importersByPackage;
}

// Return the external runtime packages a single module imports, normalized to package names and
// sorted. Exposed so the classification logic can be exercised on inline source, without a fixture.
export function parseExternalImports(sourceText: string, fileName = 'inline.ts'): string[] {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, scriptKindFor(fileName));
  return [...new Set(collectEdges(sourceFile).external)].toSorted((a, b) => a.localeCompare(b));
}

function readSourceFile(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, scriptKindFor(file));
}

function collectEdges(sourceFile: ts.SourceFile): ModuleEdges {
  const relative: string[] = [];
  const external: string[] = [];

  for (const statement of sourceFile.statements) {
    const specifier = runtimeModuleSpecifier(statement);
    if (specifier === undefined) {
      continue;
    }
    if (specifier.startsWith('.')) {
      relative.push(specifier);
    } else if (!isNodeBuiltin(specifier)) {
      external.push(toPackageName(specifier));
    }
  }

  return { relative, external };
}

// The module specifier of a statement that pulls in runtime code, or `undefined` when the statement
// is not a runtime import/export-from — including fully type-only ones, which are erased on compile.
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

// An import is runtime unless it is fully type-only: a side-effect import, a default binding, a
// namespace binding, or a named list with at least one value element each count as runtime.
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

// Reduce a bare specifier to its package name: `@scope/pkg/sub` -> `@scope/pkg`, `pkg/sub` -> `pkg`.
function toPackageName(specifier: string): string {
  const segments = specifier.split('/');
  if (specifier.startsWith('@')) {
    return segments.slice(0, 2).join('/');
  }
  return segments[0] ?? specifier;
}

function isNodeBuiltin(specifier: string): boolean {
  if (specifier.startsWith('node:')) {
    return true;
  }
  return nodeBuiltins.has(specifier);
}

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

function scriptKindFor(file: string): ts.ScriptKind {
  return file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}
