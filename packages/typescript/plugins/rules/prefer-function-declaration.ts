import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

function create(context: TSESLint.RuleContext<'preferDeclaration', unknown[]>) {
  return {
    VariableDeclarator(node: TSESTree.VariableDeclarator) {
      if (
        node.init &&
        [AST_NODE_TYPES.ArrowFunctionExpression, AST_NODE_TYPES.FunctionExpression].includes(node.init.type) &&
        !node.id.typeAnnotation // Preserves exception for typed functions
      ) {
        if (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression) {
          // Check if the arrow function uses 'this'
          if (containsThisExpression(node.init.body)) {
            // Do not report if 'this' is used within this function
            return;
          }
        }

        context.report({
          node,
          messageId: 'preferDeclaration',
        });
      }
    },
  };
}

// eslint-disable-next-line complexity
function containsThisExpression(root: TSESTree.Node): boolean {
  const stack: TSESTree.Node[] = [root];
  const visited = new Set<TSESTree.Node>();

  while (stack.length > 0) {
    const node = stack.pop();

    if (!node || typeof node !== 'object' || visited.has(node)) {
      continue;
    }
    visited.add(node);

    if (node.type === AST_NODE_TYPES.ThisExpression) {
      return true;
    }

    for (const key in node) {
      if (Object.hasOwnProperty.call(node, key)) {
        const child = node[key as keyof TSESTree.Node];

        if (Array.isArray(child)) {
          for (const c of child) {
            if (typeof c === 'object' && c !== null) {
              stack.push(c as TSESTree.Node);
            }
          }
        } else if (typeof child === 'object' && child !== null) {
          stack.push(child as TSESTree.Node);
        }
      }
    }
  }
  return false;
}

const ruleDefinition: TSESLint.LooseRuleDefinition = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prefer function declarations over function expressions',
      recommended: false,
    },
    schema: [],
    messages: {
      preferDeclaration: 'Prefer function declarations over function expressions.',
    },
  },
  create,
};

export default ruleDefinition;
