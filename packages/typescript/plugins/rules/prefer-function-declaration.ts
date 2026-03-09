/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

const create: TSESLint.RuleCreateFunction<'preferDeclaration'> = (context) => {
  return {
    VariableDeclarator(node: TSESTree.VariableDeclarator) {
      if (
        node.init &&
        [AST_NODE_TYPES.ArrowFunctionExpression, AST_NODE_TYPES.FunctionExpression].includes(node.init.type) &&
        !node.id.typeAnnotation // Preserves exception for typed functions
      ) {
        // If the function is an arrow function and uses 'this', then a function declaration might not be possible,
        // so do not report it as a rule violation.
        if (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression && containsThisExpression(node.init.body)) {
          return;
        }

        context.report({
          node,
          messageId: 'preferDeclaration',
        });
      }
    },
  };
};

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
      if (Object.hasOwn(node, key)) {
        const child = node[key as keyof TSESTree.Node];

        if (Array.isArray(child)) {
          for (const c of child) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (typeof c === 'object' && c !== null) {
              stack.push(c as TSESTree.Node);
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (typeof child === 'object' && child !== null) {
          stack.push(child as TSESTree.Node);
        }
      }
    }
  }
  return false;
}

const ruleDefinition = {
  create,
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
};

export default ruleDefinition;
