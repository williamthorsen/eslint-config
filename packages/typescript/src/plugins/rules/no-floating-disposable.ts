import { AST_NODE_TYPES, ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

type MessageId = 'bindWithKeyword' | 'floatingDisposable' | 'unboundDisposable';

interface Options {
  allow: string[];
  checkDeclarations: boolean;
}

type EnclosingFunction = TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;
type ReferenceIdentifier = TSESTree.Identifier | TSESTree.JSXIdentifier;
type ResourceExpression = TSESTree.CallExpression | TSESTree.NewExpression;
type TypedServices = NonNullable<ReturnType<typeof getTypedServicesOrNull>>;

const blockNodeTypes: ReadonlySet<AST_NODE_TYPES> = new Set([
  AST_NODE_TYPES.BlockStatement,
  AST_NODE_TYPES.Program,
  AST_NODE_TYPES.StaticBlock,
  AST_NODE_TYPES.SwitchCase,
]);

// Callees exempted for one of two reasons. Node's timer globals return a `Timeout` implementing `Symbol.dispose`, so
// every `setTimeout(fn, ms);` statement would otherwise report a resource whose discard is the point. `node:crypto`'s
// factories return a `Transform` or `Writable` wrapping an OpenSSL context, inheriting `Symbol.asyncDispose` from the
// stream base while owning no descriptor, socket, process, or lock: nothing is released, so nothing needs binding.
const defaultAllow: readonly string[] = [
  'createCipheriv',
  'createDecipheriv',
  'createHash',
  'createHmac',
  'createSign',
  'createVerify',
  'setImmediate',
  'setInterval',
  'setTimeout',
];

const functionNodeTypes: ReadonlySet<AST_NODE_TYPES> = new Set([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

const create: TSESLint.RuleCreateFunction<MessageId, [Partial<Options>?]> = (context) => {
  const services = getTypedServicesOrNull(context);

  // Nothing about `foo();` identifies a disposable without types, so an untyped parse reports nothing at all.
  if (services === null) {
    return {};
  }

  const checker = services.program.getTypeChecker();
  const allow = new Set([...defaultAllow, ...(context.options[0]?.allow ?? [])]);
  const checkDeclarations = context.options[0]?.checkDeclarations ?? true;

  const checkResourceExpression: TSESLint.RuleFunction<ResourceExpression> = (node) => {
    const discarded = readDiscardedExpression(node);
    const calleeName = readCalleeName(node);
    if (discarded === undefined || (calleeName !== undefined && allow.has(calleeName))) {
      return;
    }

    const type = services.getTypeAtLocation(discarded);
    const keyword = readDisposalKeyword(type, checker);
    if (
      keyword === undefined ||
      isReceiverType(node, type, services, checker) ||
      isOwnershipPassthrough(node, type, services)
    ) {
      return;
    }

    context.report({ node, messageId: 'floatingDisposable', data: { keyword } });
  };

  const checkDeclarator: TSESLint.RuleFunction<TSESTree.VariableDeclarator> = (node) => {
    const declaration = node.parent;
    const { init } = node;
    if (
      !checkDeclarations ||
      init === null ||
      node.id.type !== AST_NODE_TYPES.Identifier ||
      declaration.kind === 'await using' ||
      declaration.kind === 'using'
    ) {
      return;
    }

    const acquisition = readAcquisitionExpression(init);
    if (acquisition === undefined) {
      return;
    }

    const calleeName = readCalleeName(acquisition);
    if (calleeName !== undefined && allow.has(calleeName)) {
      return;
    }

    // The initializer carries the resource, so an awaited promise reads as the resource rather than the promise.
    const type = services.getTypeAtLocation(init);
    const keyword = readDisposalKeyword(type, checker);
    if (
      keyword === undefined ||
      isReceiverType(acquisition, type, services, checker) ||
      isOwnershipPassthrough(acquisition, type, services) ||
      !isScopeBound(node, context.sourceCode, services)
    ) {
      return;
    }

    context.report({
      node,
      messageId: 'unboundDisposable',
      data: { keyword, kind: declaration.kind },
      suggest: readRebindSuggestions(node, declaration, keyword, context.sourceCode),
    });
  };

  return {
    CallExpression: checkResourceExpression,
    NewExpression: checkResourceExpression,
    VariableDeclarator: checkDeclarator,
  };
};

// region | Helper functions

/** Returns the nearest statement list enclosing the node, which is the scope a `using` binding would be released at. */
function findEnclosingBlock(node: TSESTree.Node): TSESTree.Node | undefined {
  for (const ancestor of listAncestors(node)) {
    if (blockNodeTypes.has(ancestor.type)) {
      return ancestor;
    }
  }
  return undefined;
}

/** Returns the nearest function enclosing the node, or undefined where the node sits at module or class level. */
function findEnclosingFunction(node: TSESTree.Node): EnclosingFunction | undefined {
  for (const ancestor of listAncestors(node)) {
    if (isEnclosingFunction(ancestor)) {
      return ancestor;
    }
  }
  return undefined;
}

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

/** Returns true if the identifier is the object of a member expression, which reads or drives the resource in place. */
function isContainedUse(identifier: ReferenceIdentifier): boolean {
  const { parent } = identifier;
  return parent.type === AST_NODE_TYPES.MemberExpression && parent.object === identifier;
}

/**
 * Returns true if the reference is the receiver of a call taking a function argument, reached directly or through a
 * property, as `child.on(event, listener)` and `child.stdout.on(...)` are. Such a call schedules work the declaring
 * block does not contain, so releasing the resource at the block's end would cut the callback off. No signature says
 * whether an argument is invoked during the call or retained for later, so a synchronous higher-order call such as
 * `lines.forEach(...)` qualifies too.
 */
function isContinuationRegistration(identifier: ReferenceIdentifier, services: TypedServices): boolean {
  let node: TSESTree.Node = identifier;
  while (node.parent.type === AST_NODE_TYPES.MemberExpression && node.parent.object === node) {
    node = node.parent;
  }

  const { parent } = node;
  return (
    parent.type === AST_NODE_TYPES.CallExpression &&
    parent.callee === node &&
    parent.arguments.some((argument) => isPossiblyFunction(argument, services))
  );
}

/**
 * Returns true if the identifier is the object of a `Symbol.dispose` or `Symbol.asyncDispose` access. Code that
 * releases the resource by hand is correct; preferring `using` over a hand-written `finally` belongs to
 * `unicorn/prefer-dispose`, which reads the disposal call this rule only has to recognize.
 */
function isDisposalAccess(identifier: ReferenceIdentifier): boolean {
  const { parent } = identifier;
  if (parent.type !== AST_NODE_TYPES.MemberExpression || !parent.computed || parent.object !== identifier) {
    return false;
  }

  const { property } = parent;
  return (
    property.type === AST_NODE_TYPES.MemberExpression &&
    property.object.type === AST_NODE_TYPES.Identifier &&
    property.object.name === 'Symbol' &&
    property.property.type === AST_NODE_TYPES.Identifier &&
    (property.property.name === 'asyncDispose' || property.property.name === 'dispose')
  );
}

/** Returns true if the node is a function whose body a resource's references would be captured in. */
function isEnclosingFunction(node: TSESTree.Node): node is EnclosingFunction {
  return functionNodeTypes.has(node.type);
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
 * Returns true if the argument may be a function. A spread's elements carry no node to read a type from, and `any`
 * withholds the answer, so both count: a resource wrongly reported costs more than one wrongly exempted.
 */
function isPossiblyFunction(argument: TSESTree.CallExpressionArgument, services: TypedServices): boolean {
  if (argument.type === AST_NODE_TYPES.SpreadElement) {
    return true;
  }

  const type = services.getTypeAtLocation(argument);
  return (type.flags & ts.TypeFlags.Any) !== 0 || type.getCallSignatures().length > 0;
}

/**
 * Returns true if the call yields the receiver it was called on. Such a method chains onto a resource the caller
 * already holds, as `server.listen(port)` does, rather than acquiring one. Two tests answer it: the call's type is
 * the receiver's own, which covers a fluent method annotated with its own class type; or the signature declares
 * `this`, which holds wherever instantiating `this` yields a type object distinct from the receiver's.
 */
function isReceiverType(
  node: ResourceExpression,
  type: ts.Type,
  services: TypedServices,
  checker: ts.TypeChecker,
): boolean {
  const { callee } = node;
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }

  return services.getTypeAtLocation(callee.object) === type || returnsThisType(node, services, checker);
}

/**
 * Returns true if the declared resource belongs to the scope that declares it, which is what makes `using` the
 * binding it calls for. Every reference must be a member access sitting in the declaring block and function: a
 * return, an argument, an assignment, or a literal element all hand the resource somewhere that outlives this scope,
 * where releasing it at the scope's end would be wrong. Requiring the declaring block covers a `var`, whose binding
 * a caller may read past the block a `using` would be released at. A reference registering a continuation disqualifies
 * the declaration too, the resource then being finished by the callback rather than by the block returning.
 */
function isScopeBound(
  declarator: TSESTree.VariableDeclarator,
  sourceCode: TSESLint.SourceCode,
  services: TypedServices,
): boolean {
  const block = findEnclosingBlock(declarator);

  // A module-scope resource is released at the end of module evaluation, before any importer runs.
  if (block === undefined || block.type === AST_NODE_TYPES.Program) {
    return false;
  }

  const [variable] = sourceCode.getDeclaredVariables(declarator);
  if (variable === undefined) {
    return false;
  }

  const declaringFunction = findEnclosingFunction(declarator);
  return variable.references.every((reference) => {
    // The declarator's own binding is a write that every declaration carries.
    if (reference.init === true) {
      return true;
    }

    const { identifier } = reference;
    return (
      !reference.isWrite() &&
      findEnclosingFunction(identifier) === declaringFunction &&
      isWithin(identifier, block) &&
      isContainedUse(identifier) &&
      !isDisposalAccess(identifier) &&
      !isContinuationRegistration(identifier, services)
    );
  });
}

/** Returns true if the node's source range falls inside the container's. */
function isWithin(node: TSESTree.Node, container: TSESTree.Node): boolean {
  return node.range[0] >= container.range[0] && node.range[1] <= container.range[1];
}

/**
 * Yields the node's ancestors, nearest first, ending at the `Program` it is rooted in. The walk stops there rather
 * than on an absent parent: ESLint sets the `Program`'s parent to `null`, which `TSESTree.Node['parent']` declares
 * non-nullable, so a walk guarding on the parent reads as unnecessary to the type checker and throws at the root.
 */
function* listAncestors(node: TSESTree.Node): Generator<TSESTree.Node> {
  let current: TSESTree.Node = node;
  while (current.type !== AST_NODE_TYPES.Program) {
    current = current.parent;
    yield current;
  }
}

/**
 * Returns the call or `new` expression an initializer acquires its value from, or undefined where the initializer is
 * not an acquisition site. An alias or a property read carries a resource some other expression already acquired.
 */
function readAcquisitionExpression(init: TSESTree.Expression): ResourceExpression | undefined {
  let expression: TSESTree.Expression = init;
  while (expression.type === AST_NODE_TYPES.AwaitExpression || expression.type === AST_NODE_TYPES.ChainExpression) {
    expression = expression.type === AST_NODE_TYPES.AwaitExpression ? expression.argument : expression.expression;
  }

  return expression.type === AST_NODE_TYPES.CallExpression || expression.type === AST_NODE_TYPES.NewExpression
    ? expression
    : undefined;
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

/**
 * Returns the suggestion that rebinds the declaration keyword, or an empty array where no valid edit exists. A
 * declaration holding several declarators would bind its siblings too, and `await using` needs an enclosing `async`
 * function to appear in.
 */
function readRebindSuggestions(
  declarator: TSESTree.VariableDeclarator,
  declaration: TSESTree.VariableDeclaration,
  keyword: 'await using' | 'using',
  sourceCode: TSESLint.SourceCode,
): TSESLint.ReportSuggestionArray<MessageId> {
  if (declaration.declarations.length > 1) {
    return [];
  }
  if (keyword === 'await using' && findEnclosingFunction(declarator)?.async !== true) {
    return [];
  }

  const token = sourceCode.getFirstToken(declaration);
  if (token === null || token.value !== declaration.kind) {
    return [];
  }

  return [
    {
      messageId: 'bindWithKeyword',
      data: { keyword },
      fix: (fixer) => fixer.replaceText(token, keyword),
    },
  ];
}

/**
 * Returns true if the call resolves to a signature whose declared return type is the `this` type, which returns the
 * receiver by construction whatever the receiver's own type is. The signature is re-derived from its declaration
 * because the resolved signature has already substituted the receiver for `this`, leaving nothing to recognize.
 */
function returnsThisType(node: ResourceExpression, services: TypedServices, checker: ts.TypeChecker): boolean {
  const signature = checker.getResolvedSignature(services.esTreeNodeToTSNodeMap.get(node));
  const declaration = signature?.declaration;
  if (declaration === undefined || declaration.kind === ts.SyntaxKind.JSDocSignature) {
    return false;
  }

  const declared = checker.getSignatureFromDeclaration(declaration);
  if (declared === undefined) {
    return false;
  }

  const returnType = checker.getReturnTypeOfSignature(declared);
  return returnType.isTypeParameter() && 'isThisType' in returnType && returnType.isThisType === true;
}

// endregion | Helper functions

const ruleDefinition = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow leaving a disposable resource unbound by `using`',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
          checkDeclarations: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      bindWithKeyword: 'Bind with `{{keyword}}`.',
      floatingDisposable:
        'Discarded disposable resource. Bind the result with `{{keyword}}`, or mark the discard with `void`.',
      unboundDisposable:
        'Resource is acquired and never disposed. Bind it with `{{keyword}}` instead of `{{kind}}`, so it is released when the scope ends.',
    },
  },
  create,
} as const;

export default ruleDefinition;
