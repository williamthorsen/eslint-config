import { AST_NODE_TYPES, TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { findEnclosingFunction } from './utils/ast-ancestry.ts';

type MessageId = 'realTimeSleep';

const timersPromisesSources: ReadonlySet<string> = new Set(['node:timers/promises', 'timers/promises']);

/** Reports a promise that settles on a real timer: a `Promise` resolved from `setTimeout`, or `timers/promises`'s. */
const create: TSESLint.RuleCreateFunction<MessageId> = (context) => {
  const { sourceCode } = context;

  return {
    CallExpression(node: TSESTree.CallExpression) {
      if (isTimersPromisesSetTimeout(sourceCode, node.callee) && hasNonZeroDelay(node.arguments[0])) {
        context.report({ node, messageId: 'realTimeSleep' });
      }
    },
    NewExpression(node: TSESTree.NewExpression) {
      if (!isGlobalIdentifier(sourceCode, node.callee, 'Promise')) {
        return;
      }

      const [executor] = node.arguments;
      if (
        executor?.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
        executor?.type !== AST_NODE_TYPES.FunctionExpression
      ) {
        return;
      }

      const [resolveParameter] = executor.params;
      const resolve = sourceCode
        .getDeclaredVariables(executor)
        .find((variable) => variable.identifiers.some((identifier) => identifier === resolveParameter));
      if (resolve === undefined) {
        return;
      }

      if (resolve.references.some((reference) => isResolvedByTimer(sourceCode, reference.identifier, executor))) {
        context.report({ node, messageId: 'realTimeSleep' });
      }
    },
  };
};

const ruleDefinition = {
  create,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow a promise that waits on a real timer',
    },
    schema: [],
    messages: {
      realTimeSleep:
        'A wait on real time passes or fails with machine load. Install fake timers and advance them explicitly, as Vitest does with `vi.useFakeTimers()` and `await vi.advanceTimersByTimeAsync(ms)`.',
    },
  },
} as const;

export default ruleDefinition;

// region | Helpers

/** Returns the import binding that the identifier resolves to, or undefined when it resolves to anything else. */
function findImportBinding(
  sourceCode: TSESLint.SourceCode,
  identifier: TSESTree.Identifier,
): TSESLint.Scope.Definition | undefined {
  const variable = findReference(sourceCode, identifier)?.resolved;
  return variable?.defs.find((definition) => definition.type === TSESLint.Scope.DefinitionType.ImportBinding);
}

/** Returns the scope-analysis reference that the identifier makes. */
function findReference(
  sourceCode: TSESLint.SourceCode,
  identifier: TSESTree.Identifier,
): TSESLint.Scope.Reference | undefined {
  return sourceCode.getScope(identifier).references.find((reference) => reference.identifier === identifier);
}

/** Returns true unless the delay is omitted or a literal `0`, either of which yields a turn rather than waiting. */
function hasNonZeroDelay(delay: TSESTree.CallExpressionArgument | undefined): boolean {
  return !(delay === undefined || (delay.type === AST_NODE_TYPES.Literal && delay.value === 0));
}

/** Returns true if the callee is the global `setTimeout`, named bare or as a member of `globalThis`. */
function isGlobalSetTimeout(sourceCode: TSESLint.SourceCode, callee: TSESTree.Expression): boolean {
  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    return (
      !callee.computed &&
      callee.property.type === AST_NODE_TYPES.Identifier &&
      callee.property.name === 'setTimeout' &&
      isGlobalIdentifier(sourceCode, callee.object, 'globalThis')
    );
  }
  return isGlobalIdentifier(sourceCode, callee, 'setTimeout');
}

/**
 * Returns true if the node names the global of that name: a reference that nothing declares, or a global-scope
 * variable that only the environment defines, such as an ES builtin or a configured global.
 */
function isGlobalIdentifier(sourceCode: TSESLint.SourceCode, node: TSESTree.Node, name: string): boolean {
  if (node.type !== AST_NODE_TYPES.Identifier || node.name !== name) {
    return false;
  }

  const reference = findReference(sourceCode, node);
  if (reference === undefined) {
    return false;
  }

  const variable = reference.resolved;
  return variable === null || (variable.scope.type === TSESLint.Scope.ScopeType.global && variable.defs.length === 0);
}

/**
 * Returns true if this reference to the executor's `resolve` settles the promise from a global `setTimeout` with a
 * non-zero delay: passed as the timer's handler, or called anywhere inside a function passed as the handler.
 */
function isResolvedByTimer(
  sourceCode: TSESLint.SourceCode,
  identifier: TSESTree.Identifier | TSESTree.JSXIdentifier,
  executor: TSESTree.Node,
): boolean {
  const { parent } = identifier;
  if (parent.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  if (parent.arguments[0] === identifier) {
    return isTimerCall(sourceCode, parent);
  }

  if (parent.callee !== identifier) {
    return false;
  }

  for (let fn = findEnclosingFunction(parent); fn !== undefined && fn !== executor; fn = findEnclosingFunction(fn)) {
    if (
      fn.parent.type === AST_NODE_TYPES.CallExpression &&
      fn.parent.arguments[0] === fn &&
      isTimerCall(sourceCode, fn.parent)
    ) {
      return true;
    }
  }
  return false;
}

/** Returns true if the call is a global `setTimeout` whose delay is not zero. */
function isTimerCall(sourceCode: TSESLint.SourceCode, call: TSESTree.CallExpression): boolean {
  return isGlobalSetTimeout(sourceCode, call.callee) && hasNonZeroDelay(call.arguments[1]);
}

/**
 * Returns true if the callee is the `setTimeout` export of `timers/promises`: a named import, renamed or not, or a
 * member of the module's namespace or default import.
 */
function isTimersPromisesSetTimeout(sourceCode: TSESLint.SourceCode, callee: TSESTree.Expression): boolean {
  if (callee.type === AST_NODE_TYPES.Identifier) {
    const binding = findImportBinding(sourceCode, callee);
    return (
      binding?.node.type === AST_NODE_TYPES.ImportSpecifier &&
      binding.node.imported.type === AST_NODE_TYPES.Identifier &&
      binding.node.imported.name === 'setTimeout' &&
      isTimersPromisesImport(binding)
    );
  }

  if (
    callee.type !== AST_NODE_TYPES.MemberExpression ||
    callee.computed ||
    callee.property.type !== AST_NODE_TYPES.Identifier ||
    callee.property.name !== 'setTimeout' ||
    callee.object.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }

  const binding = findImportBinding(sourceCode, callee.object);
  return (
    (binding?.node.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
      binding?.node.type === AST_NODE_TYPES.ImportNamespaceSpecifier) &&
    isTimersPromisesImport(binding)
  );
}

/** Returns true if the import binding comes from `timers/promises`, with or without the `node:` prefix. */
function isTimersPromisesImport(binding: TSESLint.Scope.Definition): boolean {
  return (
    binding.parent?.type === AST_NODE_TYPES.ImportDeclaration && timersPromisesSources.has(binding.parent.source.value)
  );
}

// endregion | Helpers
