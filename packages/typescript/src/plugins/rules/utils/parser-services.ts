import type { ParserServices } from '@typescript-eslint/utils';

interface ServicesContext {
  readonly sourceCode: { readonly parserServices?: Partial<ParserServices> };
}

/**
 * Returns the parser services, or undefined when the parser supplies no node maps, as a non-TypeScript parser does.
 * `program` is null in the returned services when the configuration provides no type information.
 */
export function findParserServices(context: ServicesContext): ParserServices | undefined {
  const services = context.sourceCode.parserServices;
  return hasNodeMaps(services) ? services : undefined;
}

// region | Helpers

/** Returns true if the services contain both node maps, the condition under which `getParserServices` succeeds. */
function hasNodeMaps(services: Partial<ParserServices> | undefined): services is ParserServices {
  // A parser other than `@typescript-eslint/parser` may set a map to null, which the type does not admit.
  return Boolean(services?.esTreeNodeToTSNodeMap && services.tsNodeToESTreeNodeMap);
}

// endregion | Helpers
