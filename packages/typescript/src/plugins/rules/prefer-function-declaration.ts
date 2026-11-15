import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

/** Reports an untyped variable initialized with a function expression. */
const create: TSESLint.RuleCreateFunction<'preferDeclaration'> = (context) => {
  type FunctionNode = TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;

  const enclosingFunctions: FunctionNode[] = [];
  const arrowsUsingThis = new WeakSet<TSESTree.ArrowFunctionExpression>();

  /** Records a function as the innermost one enclosing the nodes visited next. */
  function enterFunction(node: FunctionNode): void {
    enclosingFunctions.push(node);
  }

  /** Removes the innermost enclosing function once its subtree has been visited. */
  function exitFunction(): void {
    enclosingFunctions.pop();
  }

  return {
    ArrowFunctionExpression: enterFunction,
    'ArrowFunctionExpression:exit': exitFunction,
    FunctionDeclaration: enterFunction,
    'FunctionDeclaration:exit': exitFunction,
    FunctionExpression: enterFunction,
    'FunctionExpression:exit': exitFunction,

    ThisExpression() {
      // Mark the arrows that inherit this `this`: those inside the nearest non-arrow function.
      for (let index = enclosingFunctions.length - 1; index >= 0; index--) {
        const enclosingFunction = enclosingFunctions[index];
        if (enclosingFunction?.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
          break;
        }
        arrowsUsingThis.add(enclosingFunction);
      }
    },

    // Check on exit, once the initializer's body has been visited.
    'VariableDeclarator:exit'(node: TSESTree.VariableDeclarator) {
      if (!(
        node.init &&
        [AST_NODE_TYPES.ArrowFunctionExpression, AST_NODE_TYPES.FunctionExpression].includes(node.init.type) &&
        !node.id.typeAnnotation // Exempt a typed variable: A declaration cannot take its annotation
      )) {
        return;
      }

      // Skip an arrow function that uses `this`: A declaration would rebind it.
      if (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression && arrowsUsingThis.has(node.init)) {
        return;
      }

      context.report({
        node,
        messageId: 'preferDeclaration',
      });
    },
  };
};

export const preferFunctionDeclarationRule = {
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
