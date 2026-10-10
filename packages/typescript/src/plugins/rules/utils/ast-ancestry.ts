import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

export type EnclosingFunction =
  TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;

const blockNodeTypes: ReadonlySet<AST_NODE_TYPES> = new Set([
  AST_NODE_TYPES.BlockStatement,
  AST_NODE_TYPES.Program,
  AST_NODE_TYPES.StaticBlock,
  AST_NODE_TYPES.SwitchCase,
]);

const functionNodeTypes: ReadonlySet<AST_NODE_TYPES> = new Set([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

/** Returns the nearest statement list enclosing the node: the scope at which a `using` binding would be released. */
export function findEnclosingBlock(node: TSESTree.Node): TSESTree.Node | undefined {
  for (const ancestor of listAncestors(node)) {
    if (blockNodeTypes.has(ancestor.type)) {
      return ancestor;
    }
  }
  return undefined;
}

/** Returns the nearest function enclosing the node, or undefined when the node is at module or class level. */
export function findEnclosingFunction(node: TSESTree.Node): EnclosingFunction | undefined {
  for (const ancestor of listAncestors(node)) {
    if (isEnclosingFunction(ancestor)) {
      return ancestor;
    }
  }
  return undefined;
}

/** Returns true if the node's source range falls inside the container's. */
export function isWithin(node: TSESTree.Node, container: TSESTree.Node): boolean {
  return node.range[0] >= container.range[0] && node.range[1] <= container.range[1];
}

// region | Helpers

/** Returns true if the node is a function in whose body a resource's references would be captured. */
function isEnclosingFunction(node: TSESTree.Node): node is EnclosingFunction {
  return functionNodeTypes.has(node.type);
}

/**
 * Yields the node's ancestors, nearest first, ending at the `Program` in which it is rooted. The walk tests for
 * `Program` because ESLint sets its parent to `null`, which `TSESTree.Node['parent']` declares non-nullable.
 */
function* listAncestors(node: TSESTree.Node): Generator<TSESTree.Node> {
  let current: TSESTree.Node = node;
  while (current.type !== AST_NODE_TYPES.Program) {
    current = current.parent;
    yield current;
  }
}

// endregion | Helpers
