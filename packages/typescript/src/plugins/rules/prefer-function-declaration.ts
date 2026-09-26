/* eslint-disable @typescript-eslint/consistent-type-assertions --
 * The AST walk indexes nodes by `for...in` keys, typed as `string`, and narrows child values by shape alone. */
import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

/** Reports an untyped variable initialized with a function expression. */
const create: TSESLint.RuleCreateFunction<'preferDeclaration'> = (context) => {
  return {
    VariableDeclarator(node: TSESTree.VariableDeclarator) {
      if (!(
        node.init &&
        [AST_NODE_TYPES.ArrowFunctionExpression, AST_NODE_TYPES.FunctionExpression].includes(node.init.type) &&
        !node.id.typeAnnotation // Exempt a typed variable: A declaration cannot take its annotation
      )) {
        return;
      }

      // Skip an arrow function that uses `this`: A declaration would rebind it.
      if (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression && containsThisExpression(node.init.body)) {
        return;
      }

      context.report({
        node,
        messageId: 'preferDeclaration',
      });
    },
  };
};

/** Returns true if a `ThisExpression` occurs anywhere beneath the root, nested functions included. */
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
      if (!Object.hasOwn(node, key)) {
        continue;
      }

      const child = node[key as keyof TSESTree.Node];

      if (Array.isArray(child)) {
        for (const c of child) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (typeof c === 'object' && c !== null) {
            stack.push(c);
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (typeof child === 'object' && child !== null) {
        stack.push(child as TSESTree.Node);
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
} as const;

export default ruleDefinition;
