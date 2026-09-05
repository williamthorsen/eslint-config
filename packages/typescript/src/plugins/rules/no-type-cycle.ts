import path from 'node:path';

import { ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

type MessageId = 'typeCycle';

/** One edge of the module graph: the file it reaches, and whether TypeScript erases it. */
interface Edge {
  isTypeOnly: boolean;
  source: ts.Node;
  target: ts.SourceFile;
}

/** A module specifier and the kind of edge its syntax makes. */
interface ModuleReference {
  isTypeOnly: boolean;
  specifier: ts.StringLiteralLike;
}

// Keying on the program rather than on a file path is what lets an editor session pick up an edit: the project
// service builds a new program, which finds no entry here and walks the graph afresh.
const graphs = new WeakMap<ts.Program, Map<ts.SourceFile, readonly Edge[]>>();

const create: TSESLint.RuleCreateFunction<MessageId> = (context) => {
  const services = getServicesOrNull(context);
  const program = services?.program ?? null;
  if (services === null || program === null) {
    return {};
  }

  return {
    Program(node: TSESTree.Program) {
      const origin = services.esTreeNodeToTSNodeMap.get(node);

      for (const edge of listEdges(program, origin)) {
        const chain = findCycle(program, origin, edge);
        if (chain === undefined) {
          continue;
        }
        context.report({
          node: services.tsNodeToESTreeNodeMap.get(edge.source),
          messageId: 'typeCycle',
          data: { cycle: renderChain(context.cwd, chain) },
        });
      }
    },
  };
};

// region | Helper functions

/** Collects the edges leaving a file, resolving each specifier the way `tsc` does. */
function collectEdges(program: ts.Program, file: ts.SourceFile): readonly Edge[] {
  const checker = program.getTypeChecker();
  const edges: Edge[] = [];

  // An `import()` in type position is not a statement, so the walk descends the whole file rather than its
  // statement list.
  function visit(node: ts.Node): void {
    const reference = toModuleReference(node);
    if (reference !== undefined) {
      const target = resolveModule(program, checker, reference.specifier);
      if (target !== undefined) {
        edges.push({ isTypeOnly: reference.isTypeOnly, source: node, target });
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(file, visit);

  return edges;
}

/** Returns true if every binding an export clause names is a type. */
function exportsTypesOnly(node: ts.ExportDeclaration): boolean {
  if (node.isTypeOnly) {
    return true;
  }

  const clause = node.exportClause;
  // `export * from './m.ts'` carries no clause and re-exports values.
  if (clause === undefined || !ts.isNamedExports(clause)) {
    return false;
  }

  // `Array#every` holds for the empty list, which would make `export {} from './m.ts'` a type edge.
  return clause.elements.length > 0 && clause.elements.every((element) => element.isTypeOnly);
}

/**
 * Returns the chain of files from the edge's target back to the origin, or undefined when no such path passes
 * through a type-only edge. The search is over `(file, typeSeen)` pairs, since a file already visited without a
 * type-only edge behind it can still lie on a cycle reached with one.
 */
function findCycle(program: ts.Program, origin: ts.SourceFile, edge: Edge): readonly ts.SourceFile[] | undefined {
  const visited = new Set<string>();
  const chain: ts.SourceFile[] = [];

  function walk(file: ts.SourceFile, typeSeen: boolean): boolean {
    if (file === origin) {
      return typeSeen;
    }

    const key = `${typeSeen ? 'type' : 'value'}\0${file.fileName}`;
    if (visited.has(key)) {
      return false;
    }
    visited.add(key);

    chain.push(file);
    for (const next of listEdges(program, file)) {
      if (walk(next.target, typeSeen || next.isTypeOnly)) {
        return true;
      }
    }
    chain.pop();

    return false;
  }

  return walk(edge.target, edge.isTypeOnly) ? [...chain, origin] : undefined;
}

/**
 * Returns the parser services, or null when the parser supplies none. `getParserServices` throws for a
 * non-TypeScript parser even with `allowWithoutFullTypeInformation`, making the throw the only available signal.
 */
function getServicesOrNull(context: Parameters<TSESLint.RuleCreateFunction<MessageId>>[0]) {
  try {
    return ESLintUtils.getParserServices(context, true);
  } catch {
    return null;
  }
}

/** Returns true if every binding an import clause names is a type. */
function importsTypesOnly(clause: ts.ImportClause | undefined): boolean {
  // A side-effect import (`import './m.ts'`) carries no clause and runs at load time.
  if (clause === undefined) {
    return false;
  }
  // The modifier also spells `defer`, which defers a value import rather than erasing it.
  if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) {
    return true;
  }
  // A default binding and a namespace binding are both values.
  if (clause.name !== undefined) {
    return false;
  }

  const bindings = clause.namedBindings;
  if (bindings === undefined || !ts.isNamedImports(bindings)) {
    return false;
  }

  // `Array#every` holds for the empty list, which would make `import {} from './m.ts'` a type edge.
  return bindings.elements.length > 0 && bindings.elements.every((element) => element.isTypeOnly);
}

/** Returns the edges leaving a file, walking it on first request and memoizing the result for the program. */
function listEdges(program: ts.Program, file: ts.SourceFile): readonly Edge[] {
  let graph = graphs.get(program);
  if (graph === undefined) {
    graph = new Map<ts.SourceFile, readonly Edge[]>();
    graphs.set(program, graph);
  }

  const memoized = graph.get(file);
  if (memoized !== undefined) {
    return memoized;
  }

  const edges = collectEdges(program, file);
  graph.set(file, edges);

  return edges;
}

/** Renders a chain of files as the cycle the message names. */
function renderChain(cwd: string, chain: readonly ts.SourceFile[]): string {
  return chain.map((file) => toDisplayPath(cwd, file.fileName)).join(' → ');
}

/** Resolves a specifier to the file it names, or undefined for one outside the graph. */
function resolveModule(
  program: ts.Program,
  checker: ts.TypeChecker,
  specifier: ts.StringLiteralLike,
): ts.SourceFile | undefined {
  const target = checker.getSymbolAtLocation(specifier)?.declarations?.find((node) => ts.isSourceFile(node));
  if (target === undefined || !ts.isSourceFile(target)) {
    return undefined;
  }

  // Exclusion is by provenance, not by file kind, so a hand-written `.d.ts` in the consumer's own source stays a
  // node while `node_modules` and `lib.*.d.ts` do not.
  const isOutsideGraph = program.isSourceFileFromExternalLibrary(target) || program.isSourceFileDefaultLibrary(target);

  return isOutsideGraph ? undefined : target;
}

/** Renders one file as a specifier-like path, relative to the lint run's directory where it sits under it. */
function toDisplayPath(cwd: string, fileName: string): string {
  const relative = path.relative(cwd, fileName);

  return relative.startsWith('..') || path.isAbsolute(relative) ? fileName : `./${relative}`;
}

/** Returns the module a node references, or undefined for a node that references none. */
function toModuleReference(node: ts.Node): ModuleReference | undefined {
  if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
    return { isTypeOnly: importsTypesOnly(node.importClause), specifier: node.moduleSpecifier };
  }
  if (
    ts.isExportDeclaration(node) &&
    node.moduleSpecifier !== undefined &&
    ts.isStringLiteralLike(node.moduleSpecifier)
  ) {
    return { isTypeOnly: exportsTypesOnly(node), specifier: node.moduleSpecifier };
  }
  if (
    ts.isImportTypeNode(node) &&
    ts.isLiteralTypeNode(node.argument) &&
    ts.isStringLiteralLike(node.argument.literal)
  ) {
    return { isTypeOnly: true, specifier: node.argument.literal };
  }
  if (
    ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference) &&
    ts.isStringLiteralLike(node.moduleReference.expression)
  ) {
    return { isTypeOnly: node.isTypeOnly, specifier: node.moduleReference.expression };
  }

  // A dynamic `import()` expression loads asynchronously, so it makes no edge here.
  return undefined;
}

// endregion | Helper functions

const ruleDefinition = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow a module cycle that passes through a type-only import',
    },
    schema: [],
    messages: {
      typeCycle: 'Dependency cycle through a type-only import: {{cycle}}',
    },
  },
  create,
} as const;

export default ruleDefinition;
