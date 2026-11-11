import path from 'node:path';

import { AST_NODE_TYPES, ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

type MessageId = 'tsExtension';

const JS_EXTENSIONS: ReadonlySet<string> = new Set(['.cjs', '.js', '.jsx', '.mjs']);

// A declaration file describes JavaScript that exists at the written path, so only a source makes the specifier wrong.
const TS_SOURCE_EXTENSIONS: ReadonlySet<string> = new Set([
  ts.Extension.Cts,
  ts.Extension.Mts,
  ts.Extension.Ts,
  ts.Extension.Tsx,
]);

// Key by program: After an edit, the project service builds a new program, whose compiler options may differ.
const resolutionCaches = new WeakMap<ts.Program, ts.ModuleResolutionCache>();

/** Reports a relative or `#` specifier written with a JavaScript extension that resolves to a TypeScript source. */
const create: TSESLint.RuleCreateFunction<MessageId> = (context) => {
  const services = getServicesOrNull(context);
  const program = services?.program ?? null;
  if (services === null || program === null) {
    return {};
  }

  const { esTreeNodeToTSNodeMap } = services;
  const options = program.getCompilerOptions();
  const cache = getResolutionCache(program);

  /** Reports the specifier if it names a TypeScript source of the same base name through a JavaScript extension. */
  function check(source: TSESTree.Node | null): void {
    if (source?.type !== AST_NODE_TYPES.Literal || typeof source.value !== 'string') {
      return;
    }

    const specifier = source.value;
    const written = path.extname(specifier);
    if (!isLocalSpecifier(specifier) || !JS_EXTENSIONS.has(written)) {
      return;
    }

    const literal = esTreeNodeToTSNodeMap.get(source);
    if (!ts.isStringLiteralLike(literal)) {
      return;
    }

    const file = literal.getSourceFile();
    const mode = ts.getModeForUsageLocation(file, literal, options);
    const resolved = ts.resolveModuleName(
      specifier,
      file.fileName,
      options,
      ts.sys,
      cache,
      undefined,
      mode,
    ).resolvedModule;
    if (
      resolved === undefined ||
      resolved.isExternalLibraryImport === true ||
      !TS_SOURCE_EXTENSIONS.has(resolved.extension) ||
      path.basename(resolved.resolvedFileName, resolved.extension) !== path.basename(specifier, written)
    ) {
      return;
    }

    const expected = resolved.extension;
    context.report({
      node: source,
      messageId: 'tsExtension',
      data: { extension: expected.slice(1), importPath: specifier },
      fix(fixer) {
        // Edit the raw text, which keeps the quote style and any escape sequence before the extension.
        const extensionEnd = source.range[1] - 1;
        const extensionStart = extensionEnd - written.length;
        if (context.sourceCode.text.slice(extensionStart, extensionEnd) !== written) {
          return null;
        }
        return fixer.replaceTextRange([extensionStart, extensionEnd], expected);
      },
    });
  }

  return {
    ExportAllDeclaration: (node) => check(node.source),
    ExportNamedDeclaration: (node) => check(node.source),
    ImportDeclaration: (node) => check(node.source),
    ImportExpression: (node) => check(node.source),
    TSExternalModuleReference: (node) => check(node.expression),
    TSImportType: (node) => check(node.source),
  };
};

// region | Helper functions

/** Returns the program's module-resolution cache, creating it on first request. */
function getResolutionCache(program: ts.Program): ts.ModuleResolutionCache {
  let cache = resolutionCaches.get(program);
  if (cache === undefined) {
    const getCanonicalFileName = ts.sys.useCaseSensitiveFileNames
      ? (fileName: string) => fileName
      : (fileName: string) => fileName.toLowerCase();
    cache = ts.createModuleResolutionCache(
      program.getCurrentDirectory(),
      getCanonicalFileName,
      program.getCompilerOptions(),
    );
    resolutionCaches.set(program, cache);
  }
  return cache;
}

/**
 * Returns the parser services, or null when the parser supplies none. `getParserServices` throws for a non-TypeScript
 * parser even with `allowWithoutFullTypeInformation`, making the throw the only available signal.
 */
function getServicesOrNull(context: Parameters<TSESLint.RuleCreateFunction<MessageId>>[0]) {
  try {
    return ESLintUtils.getParserServices(context, true);
  } catch {
    return null;
  }
}

/** Returns true if the specifier is relative or a subpath import; a bare specifier names a package's published path. */
function isLocalSpecifier(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('#');
}

// endregion | Helper functions

const ruleDefinition = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require a TypeScript extension on a specifier that names a TypeScript source',
    },
    fixable: 'code',
    schema: [],
    messages: {
      tsExtension: 'Expected file extension "{{extension}}" for "{{importPath}}"',
    },
  },
  create,
} as const;

export default ruleDefinition;
