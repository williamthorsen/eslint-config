/* eslint-disable unicorn/no-lonely-if */

import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

/** Reports each unmemoized function that a custom hook returns in an object literal. */
const create: TSESLint.RuleCreateFunction<'memoizedFunctionsReturnedByHook'> = (context) => {
  return {
    FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
      if (!isCustomHook(node)) return;
      checkReturnedFunctions(node, context);
    },
    VariableDeclarator(node: TSESTree.VariableDeclarator) {
      if (!isCustomHook(node)) return;

      const functionNode = getFunctionFromVariableDeclarator(node);
      if (!functionNode) return;

      checkReturnedFunctions(functionNode, context);
    },
  };
};

// region | Helper functions
/** Returns the declarator's initializer when it is a function or arrow function expression. */
function getFunctionFromVariableDeclarator(
  node: TSESTree.VariableDeclarator,
): TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | undefined {
  if (
    node.init &&
    (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression || node.init.type === AST_NODE_TYPES.FunctionExpression)
  ) {
    return node.init;
  }
  return undefined;
}

/** Reports each function in the returned object that is not wrapped in `useCallback` or `useMemo`. */
function checkReturnedFunctions(
  node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
  context: TSESLint.RuleContext<'memoizedFunctionsReturnedByHook', unknown[]>,
): void {
  const properties = getReturnedObjectProperties(node);

  for (const prop of properties) {
    if (isFunction(prop.value)) {
      if (!isUseCallbackOrUseMemo(prop.value.parent)) {
        context.report({
          node: prop.value,
          messageId: 'memoizedFunctionsReturnedByHook',
        });
      }
    }

    // Resolve a shorthand property to the local function that it names.
    if (prop.shorthand && prop.key.type === AST_NODE_TYPES.Identifier) {
      const functionNode = findFunctionByName(node, prop.key.name);
      if (functionNode && !isUseCallbackOrUseMemo(functionNode.parent)) {
        context.report({
          node: functionNode,
          messageId: 'memoizedFunctionsReturnedByHook',
        });
      }
    }
  }
}
/** Returns true if the node calls `useCallback` or `useMemo`, bare or as a member. */
function isUseCallbackOrUseMemo(node: TSESTree.Node | undefined): boolean {
  if (!node || node.type !== AST_NODE_TYPES.CallExpression) return false;

  if (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    (node.callee.name === 'useCallback' || node.callee.name === 'useMemo')
  ) {
    return true;
  }
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    (node.callee.property.name === 'useCallback' || node.callee.property.name === 'useMemo')
  );
}

/** Returns true if the node is a function expression or an arrow function. */
function isFunction(
  node: TSESTree.Node | undefined,
): node is TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression {
  return (
    !!node && (node.type === AST_NODE_TYPES.FunctionExpression || node.type === AST_NODE_TYPES.ArrowFunctionExpression)
  );
}

/** Returns true if the declared name starts with `use`. */
function isCustomHook(node: TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator): boolean {
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration &&
    node.id?.type === AST_NODE_TYPES.Identifier &&
    node.id.name.startsWith('use')
  ) {
    return true;
  }
  return (
    node.type === AST_NODE_TYPES.VariableDeclarator &&
    node.id.type === AST_NODE_TYPES.Identifier &&
    node.id.name.startsWith('use')
  );
}

/** Returns the function declaration with the given name among the statements. */
function findFunctionDeclaration(
  statements: TSESTree.Statement[],
  functionName: string,
): TSESTree.FunctionDeclaration | undefined {
  for (const stmt of statements) {
    if (stmt.type === AST_NODE_TYPES.FunctionDeclaration && stmt.id.name === functionName) {
      return stmt;
    }
  }
  return undefined;
}

/** Returns the function expression that the statements' variable declarations assign to the given name. */
function findFunctionExpression(
  statements: TSESTree.Statement[],
  functionName: string,
): TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | undefined {
  for (const stmt of statements) {
    if (stmt.type !== AST_NODE_TYPES.VariableDeclaration) continue;

    for (const declarator of stmt.declarations) {
      if (
        declarator.id.type === AST_NODE_TYPES.Identifier &&
        declarator.id.name === functionName &&
        declarator.init &&
        (declarator.init.type === AST_NODE_TYPES.FunctionExpression ||
          declarator.init.type === AST_NODE_TYPES.ArrowFunctionExpression)
      ) {
        return declarator.init;
      }
    }
  }
  return undefined;
}

/** Returns the function with the given name declared at the top level of the function's block body. */
function findFunctionByName(
  node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
  functionName: string,
): TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | undefined {
  if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
    return undefined;
  }

  return findFunctionDeclaration(node.body.body, functionName) || findFunctionExpression(node.body.body, functionName);
}

/** Returns the object's properties, omitting spread elements. */
function extractPropertiesFromObject(obj: TSESTree.ObjectExpression): TSESTree.Property[] {
  const properties: TSESTree.Property[] = [];
  for (const prop of obj.properties) {
    if (prop.type === AST_NODE_TYPES.Property) {
      properties.push(prop);
    }
  }
  return properties;
}

/** Returns the properties of each object literal returned by a top-level `return` in the block. */
function extractPropertiesFromBlockBody(body: TSESTree.BlockStatement): TSESTree.Property[] {
  const properties: TSESTree.Property[] = [];

  for (const stmt of body.body) {
    if (stmt.type === AST_NODE_TYPES.ReturnStatement && stmt.argument?.type === AST_NODE_TYPES.ObjectExpression) {
      properties.push(...extractPropertiesFromObject(stmt.argument));
    }
  }

  return properties;
}

/** Returns the properties of an object literal that the arrow function returns implicitly. */
function extractPropertiesFromArrowFunction(node: TSESTree.ArrowFunctionExpression): TSESTree.Property[] {
  if (node.body.type === AST_NODE_TYPES.ObjectExpression) {
    return extractPropertiesFromObject(node.body);
  }
  return [];
}

/** Returns the properties of every object literal that the function returns. */
function getReturnedObjectProperties(
  node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
): TSESTree.Property[] {
  if (node.body.type === AST_NODE_TYPES.BlockStatement) {
    return extractPropertiesFromBlockBody(node.body);
  }

  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    return extractPropertiesFromArrowFunction(node);
  }

  return [];
}
// endregion | Helper functions

const ruleDefinition = {
  create,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure functions returned by hooks are memoized with useCallback or useMemo.',
    },
    schema: [],
    messages: {
      memoizedFunctionsReturnedByHook: 'Functions returned by hooks must be memoized with useCallback or useMemo.',
    },
  },
} as const;

export default ruleDefinition;
