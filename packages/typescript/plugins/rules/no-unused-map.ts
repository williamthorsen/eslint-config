import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

const create: TSESLint.LooseRuleCreateFunction = (context: TSESLint.RuleContext<'unusedMap', unknown[]>) => {
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
  let current: TSESTree.Node | undefined = node;
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
};

export default ruleDefinition;
