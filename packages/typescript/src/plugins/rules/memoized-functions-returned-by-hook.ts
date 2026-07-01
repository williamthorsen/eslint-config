/* eslint-disable unicorn/no-lonely-if */

import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

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

// region | Helper Functions
/**
 * Gets the function node from a variable declarator if it's a function expression.
 */
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

/**
 * Checks all returned functions in a function node and reports unmemoized ones.
 */
function checkReturnedFunctions(
  node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
  context: TSESLint.RuleContext<'memoizedFunctionsReturnedByHook', unknown[]>,
): void {
  const properties = getReturnedObjectProperties(node);

  for (const prop of properties) {
    // Check explicit property values (prop.value)
    if (isFunction(prop.value)) {
      if (!isUseCallbackOrUseMemo(prop.value.parent)) {
        context.report({
          node: prop.value,
          messageId: 'memoizedFunctionsReturnedByHook',
        });
      }
    }

    // Check shorthand properties (prop.key when it references a function)
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
/**
 * Checks if a node is a call to useCallback or useMemo.
 */
function isUseCallbackOrUseMemo(node: TSESTree.Node | undefined): boolean {
  if (!node || node.type !== AST_NODE_TYPES.CallExpression) return false;

  // useCallback(fn, deps) or useMemo(fn, deps)
  if (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    (node.callee.name === 'useCallback' || node.callee.name === 'useMemo')
  ) {
    return true;
  }
  // React.useCallback / React.useMemo
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    (node.callee.property.name === 'useCallback' || node.callee.property.name === 'useMemo')
  );
}

/**
 * Checks if a node is a function expression or arrow function.
 */
function isFunction(
  node: TSESTree.Node | undefined,
): node is TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression {
  return (
    !!node && (node.type === AST_NODE_TYPES.FunctionExpression || node.type === AST_NODE_TYPES.ArrowFunctionExpression)
  );
}

/**
 * Determines if a function declaration or variable declarator is a custom hook.
 */
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

/**
 * Finds a function declaration by name within a function node.
 */
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

/**
 * Finds a function expression by name within variable declarations.
 */
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

/**
 * Finds a function declaration or expression by name within a function node.
 */
function findFunctionByName(
  node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
  functionName: string,
): TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | undefined {
  if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
    return undefined;
  }

  return findFunctionDeclaration(node.body.body, functionName) || findFunctionExpression(node.body.body, functionName);
}

/**
 * Extracts properties from an object expression.
 */
function extractPropertiesFromObject(obj: TSESTree.ObjectExpression): TSESTree.Property[] {
  const properties: TSESTree.Property[] = [];
  for (const prop of obj.properties) {
    if (prop.type === AST_NODE_TYPES.Property) {
      properties.push(prop);
    }
  }
  return properties;
}

/**
 * Extracts properties from return statements in a block body.
 */
function extractPropertiesFromBlockBody(body: TSESTree.BlockStatement): TSESTree.Property[] {
  const properties: TSESTree.Property[] = [];

  for (const stmt of body.body) {
    if (stmt.type === AST_NODE_TYPES.ReturnStatement && stmt.argument?.type === AST_NODE_TYPES.ObjectExpression) {
      properties.push(...extractPropertiesFromObject(stmt.argument));
    }
  }

  return properties;
}

/**
 * Extracts properties from an arrow function's implicit return.
 */
function extractPropertiesFromArrowFunction(node: TSESTree.ArrowFunctionExpression): TSESTree.Property[] {
  if (node.body.type === AST_NODE_TYPES.ObjectExpression) {
    return extractPropertiesFromObject(node.body);
  }
  return [];
}

/**
 * Finds all returned object properties from a function node.
 */
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
// endregion | Helper Functions

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
