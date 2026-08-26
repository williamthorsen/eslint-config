import { AST_NODE_TYPES, ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

type MessageId = 'floatingDisposable';

interface Options {
  allow: string[];
}

type ResourceExpression = TSESTree.CallExpression | TSESTree.NewExpression;
type TypedServices = NonNullable<ReturnType<typeof getTypedServicesOrNull>>;

// Callees whose disposable result is routinely discarded on purpose. Node's timer globals return a `Timeout`, which
// implements `Symbol.dispose`, so every `setTimeout(fn, ms);` statement would otherwise report.
const defaultAllow: readonly string[] = ['setImmediate', 'setInterval', 'setTimeout'];

const create: TSESLint.RuleCreateFunction<MessageId, [Partial<Options>?]> = (context) => {
  const services = getTypedServicesOrNull(context);

  // Nothing about `foo();` identifies a disposable without types, so an untyped parse reports nothing at all.
  if (services === null) {
    return {};
  }

  const checker = services.program.getTypeChecker();
  const allow = new Set([...defaultAllow, ...(context.options[0]?.allow ?? [])]);

  const checkResourceExpression: TSESLint.RuleFunction<ResourceExpression> = (node) => {
    const calleeName = readCalleeName(node);
    if (!isResultDiscarded(node) || (calleeName !== undefined && allow.has(calleeName))) {
      return;
    }

    const type = services.getTypeAtLocation(node);
    const keyword = readDisposalKeyword(type, checker);
    if (
      keyword === undefined ||
      isThisReturning(node, services, checker) ||
      isOwnershipPassthrough(node, type, services)
    ) {
      return;
    }

    context.report({ node, messageId: 'floatingDisposable', data: { keyword } });
  };

  return {
    CallExpression: checkResourceExpression,
    NewExpression: checkResourceExpression,
  };
};

// region | Helper functions

/**
 * Returns type-aware parser services, or null when the parser supplies none or the configuration provides no program.
 * `getParserServices` throws for a non-TypeScript parser even with `allowWithoutFullTypeInformation`, making the throw
 * the only available signal.
 */
function getTypedServicesOrNull(context: Parameters<TSESLint.RuleCreateFunction<MessageId>>[0]) {
  try {
    const services = ESLintUtils.getParserServices(context, true);
    return services.program === null ? null : services;
  } catch {
    return null;
  }
}

/**
 * Returns true if the expression yields the same resource it was handed, as `<T extends Disposable>(resource: T): T`
 * does. Such a callee registers the resource's disposal elsewhere, so the caller has passed ownership on rather than
 * acquired it. A callee returning a different resource is still the caller's to bind.
 */
function isOwnershipPassthrough(node: ResourceExpression, type: ts.Type, services: TypedServices): boolean {
  return node.arguments.some(
    (argument) => argument.type !== AST_NODE_TYPES.SpreadElement && services.getTypeAtLocation(argument) === type,
  );
}

/**
 * Returns true if the expression sits in statement position, where its result is discarded; every other position
 * consumes the value. An optional chain (`resource?.acquire();`) interposes a `ChainExpression` before the
 * `ExpressionStatement`. A `void` operator interposes a `UnaryExpression` instead, which is what makes it the
 * deliberate-discard escape hatch.
 */
function isResultDiscarded(node: ResourceExpression): boolean {
  const parent = node.parent.type === AST_NODE_TYPES.ChainExpression ? node.parent.parent : node.parent;
  return parent.type === AST_NODE_TYPES.ExpressionStatement;
}

/**
 * Returns true if the resolved signature declares `this` as its return type. Such a method chains a call onto an
 * existing resource, as `server.listen(port)` does, rather than creating one the caller owns.
 */
function isThisReturning(node: ResourceExpression, services: TypedServices, checker: ts.TypeChecker): boolean {
  const tsNode = services.esTreeNodeToTSNodeMap.get(node);
  if (!ts.isCallExpression(tsNode) && !ts.isNewExpression(tsNode)) {
    return false;
  }
  const declaration = checker.getResolvedSignature(tsNode)?.declaration;
  return declaration !== undefined && 'type' in declaration && declaration.type?.kind === ts.SyntaxKind.ThisType;
}

/** Returns the name the `allow` list matches against: the callee itself, or the property of a member call. */
function readCalleeName(node: ResourceExpression): string | undefined {
  const { callee } = node;
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.computed &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return callee.property.name;
  }
  return undefined;
}

/**
 * Returns the binding keyword the type calls for, or undefined when the type is not disposable. Nullability is
 * stripped first: `getProperties()` resolves a union to its common properties, so `Disposable | undefined` would
 * otherwise report as bare of any property at all. Every remaining constituent must be disposable, so a union mixing
 * a resource with a plain value is left alone.
 *
 * Resolving properties can crash inside TypeScript while it computes module specifiers for symbols declared
 * elsewhere, and disposability cannot then be confirmed, so a throw is treated as a non-disposable type.
 */
function readDisposalKeyword(type: ts.Type, checker: ts.TypeChecker): 'await using' | 'using' | undefined {
  try {
    const nonNullable = checker.getNonNullableType(type);
    const parts = nonNullable.isUnion() ? nonNullable.types : [nonNullable];

    let isAsync = false;
    for (const part of parts) {
      // TypeScript stores a well-known symbol member under the escaped name `__@<name>@<id>`, such as `__@dispose@9`.
      const names = part.getProperties().map((property) => String(property.escapedName));
      const hasAsyncDispose = names.some((name) => name.startsWith('__@asyncDispose'));
      if (!hasAsyncDispose && names.every((name) => !name.startsWith('__@dispose'))) {
        return undefined;
      }
      isAsync ||= hasAsyncDispose;
    }

    return isAsync ? 'await using' : 'using';
  } catch {
    return undefined;
  }
}

// endregion | Helper functions

const ruleDefinition = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow discarding a disposable resource instead of binding it with `using`',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      floatingDisposable:
        'Discarded disposable resource. Bind the result with `{{keyword}}`, or mark the discard with `void`.',
    },
  },
  create,
} as const;

export default ruleDefinition;
