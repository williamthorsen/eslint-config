import { AST_NODE_TYPES, ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

const create: TSESLint.RuleCreateFunction<'undefinedWithNumber'> = (context) => {
  const parserServices = ESLintUtils.getParserServices(context);
  const checker = parserServices.program.getTypeChecker();

  return {
    CallExpression(node: TSESTree.CallExpression) {
      if (node.callee.type === AST_NODE_TYPES.Identifier && node.callee.name === 'Number') {
        const [arg] = node.arguments;
        if (arg) {
          const tsNode = parserServices.esTreeNodeToTSNodeMap.get(arg);
          const type = checker.getTypeAtLocation(tsNode);
          if (checker.typeToString(type).includes('undefined')) {
            context.report({
              node: arg,
              messageId: 'undefinedWithNumber',
            });
          }
        }
      }
    },
  };
};

const ruleDefinition = {
  create,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow passing possibly undefined values to Number()',
    },
    schema: [],
    messages: {
      avoidUndefined: 'Do not pass a possibly undefined value to `Number()`.',
    },
  },
};

export default ruleDefinition;
