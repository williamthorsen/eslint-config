import { AST_NODE_TYPES, ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

const create: TSESLint.RuleCreateFunction<'unusedMap'> = (context) => {
  const services = getServicesOrNull(context);

  return {
    CallExpression(node: TSESTree.CallExpression) {
      if (!isMapCall(node) || !isResultDiscarded(node)) {
        return;
      }
      if (services !== null && services.program !== null) {
        const checker = services.program.getTypeChecker();
        const receiverType = services.getTypeAtLocation(node.callee.object);
        if (!isArrayLikeType(receiverType, checker)) {
          return;
        }
      }
      context.report({
        node,
        messageId: 'unusedMap',
      });
    },
  };
};

// region | Helper functions
type MapCall = TSESTree.CallExpression & { callee: TSESTree.MemberExpression };

/** Returns true if the node is a non-computed call to a method named `map`. */
function isMapCall(node: TSESTree.CallExpression): node is MapCall {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    !node.callee.computed &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'map'
  );
}

/**
 * Returns the parser services, or null when the parser supplies none. `getParserServices` throws for a non-TypeScript
 * parser even with `allowWithoutFullTypeInformation`, making the throw the only available signal.
 */
function getServicesOrNull(context: Parameters<TSESLint.RuleCreateFunction<'unusedMap'>>[0]) {
  try {
    return ESLintUtils.getParserServices(context, true);
  } catch {
    return null;
  }
}

/**
 * Returns true if the call sits in statement position, where its result is discarded; every other position consumes
 * the value. An optional chain (`items?.map(fn);`) interposes a `ChainExpression` before the `ExpressionStatement`.
 */
function isResultDiscarded(node: TSESTree.CallExpression): boolean {
  const parent = node.parent.type === AST_NODE_TYPES.ChainExpression ? node.parent.parent : node.parent;
  return parent.type === AST_NODE_TYPES.ExpressionStatement;
}

/**
 * Returns true if every non-nullable constituent of the type is array-like. Stripping `undefined` and `null` keeps an
 * optional-chained receiver (typed `T[] | undefined`) array-like. `any` and TS's error type are assignable to
 * `readonly any[]`, so the flag check rejects them; `unknown` already fails the checker's test.
 */
function isArrayLikeType(type: ts.Type, checker: ts.TypeChecker): boolean {
  const nonNullable = checker.getNonNullableType(type);
  const parts = nonNullable.isUnion() ? nonNullable.types : [nonNullable];
  return parts.every((part) => (part.flags & ts.TypeFlags.Any) === 0 && checker.isArrayLikeType(part));
}

// endregion | Helper functions

const ruleDefinition = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow discarding the result of Array#map',
    },
    schema: [],
    messages: {
      unusedMap: 'Unused result of Array#map. Consider using Array#forEach instead.',
    },
  },
  create,
} as const;

export default ruleDefinition;
