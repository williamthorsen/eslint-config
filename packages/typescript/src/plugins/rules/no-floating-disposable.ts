import { AST_NODE_TYPES, ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import type ts from 'typescript';

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
    const discarded = readDiscardedExpression(node);
    const calleeName = readCalleeName(node);
    if (discarded === undefined || (calleeName !== undefined && allow.has(calleeName))) {
      return;
    }

    const type = services.getTypeAtLocation(discarded);
    const keyword = readDisposalKeyword(type, checker);
    if (keyword === undefined || isReceiverType(node, type, services) || isOwnershipPassthrough(node, type, services)) {
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
 * Returns true if the expression yields the type of one of its arguments, as `<T extends Disposable>(resource: T): T`
 * does. Such a callee registers the resource's disposal elsewhere, so the caller has passed ownership on rather than
 * acquired it.
 */
function isOwnershipPassthrough(node: ResourceExpression, type: ts.Type, services: TypedServices): boolean {
  return node.arguments.some(
    (argument) => argument.type !== AST_NODE_TYPES.SpreadElement && services.getTypeAtLocation(argument) === type,
  );
}

/**
 * Returns true if the expression yields the type of the receiver it was called on. Such a method chains onto a
 * resource the caller already holds, as `server.listen(port)` does, rather than acquiring one. Reading the type
 * covers a method whose `this` return is inferred as well as one that annotates it.
 */
function isReceiverType(node: ResourceExpression, type: ts.Type, services: TypedServices): boolean {
  const { callee } = node;
  return callee.type === AST_NODE_TYPES.MemberExpression && services.getTypeAtLocation(callee.object) === type;
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
 * Returns the expression whose value a statement discards, or undefined where the result is consumed. An optional
 * chain interposes a `ChainExpression` between the call and the statement, and `await` an `AwaitExpression`; the
 * outermost of them carries the value that goes unused, and an awaited promise carries the resource rather than the
 * promise wrapping it. A `void` operator interposes a `UnaryExpression` instead, which is what makes it the
 * deliberate-discard escape hatch.
 */
function readDiscardedExpression(node: ResourceExpression): TSESTree.Expression | undefined {
  let expression: TSESTree.Expression = node;
  if (expression.parent.type === AST_NODE_TYPES.ChainExpression) {
    expression = expression.parent;
  }
  if (expression.parent.type === AST_NODE_TYPES.AwaitExpression) {
    expression = expression.parent;
  }
  return expression.parent.type === AST_NODE_TYPES.ExpressionStatement ? expression : undefined;
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
