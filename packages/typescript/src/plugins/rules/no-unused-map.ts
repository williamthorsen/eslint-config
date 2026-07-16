import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

const create: TSESLint.RuleCreateFunction<'unusedMap'> = (context) => {
  return {
    CallExpression(node: TSESTree.CallExpression) {
      if (isMapCall(node) && !isResultUsed(node)) {
        context.report({
          node,
          messageId: 'unusedMap',
        });
      }
    },
  };
};

// region | Helper functions
function isMapCall(node: TSESTree.CallExpression) {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'map'
  );
}

function isResultUsed(node: TSESTree.Node): boolean {
  // Start from the parent: the `.map()` call is itself a `CallExpression`, so beginning
  // at `node` would match the "result is used" list immediately and never report.
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      [
        AST_NODE_TYPES.ArrayExpression,
        AST_NODE_TYPES.AssignmentExpression,
        AST_NODE_TYPES.CallExpression,
        AST_NODE_TYPES.Property,
        AST_NODE_TYPES.ReturnStatement,
        AST_NODE_TYPES.VariableDeclarator,
      ].includes(current.type)
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

// endregion | Helper functions

const ruleDefinition = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      unusedMap: 'Unused result of Array#map. Consider using Array#forEach instead.',
    },
  },
  create,
} as const;

export default ruleDefinition;
