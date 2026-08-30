import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

type MessageId = 'splitImports';

/** One named binding of the merged statement: its source text and whether it imports a type. */
interface NamedSpecifier {
  isType: boolean;
  text: string;
}

/** The bindings one statement contributes to the merge. */
interface Contribution {
  defaultName: string | undefined;
  named: NamedSpecifier[];
  node: TSESTree.ImportDeclaration;
}

const create: TSESLint.RuleCreateFunction<MessageId> = (context) => {
  return {
    Program(program: TSESTree.Program) {
      for (const [source, contributions] of collectMergeableGroups(program)) {
        if (contributions.length < 2) {
          continue;
        }

        // Two default imports cannot share a statement, so a group holding both has no single-statement form.
        if (contributions.filter((contribution) => contribution.defaultName !== undefined).length > 1) {
          continue;
        }

        const nodes = contributions.map((contribution) => contribution.node);
        const [first, second] = nodes;
        if (first === undefined || second === undefined) {
          continue;
        }

        context.report({
          node: second,
          messageId: 'splitImports',
          data: { count: contributions.length, source },
          // The fix is withheld where it would delete or orphan a comment.
          fix: fixWouldLoseComment(context.sourceCode, first, nodes.slice(1))
            ? null
            : (fixer) => [
                fixer.replaceText(first, renderMerged(context.sourceCode, contributions)),
                ...nodes.slice(1).map((node) => fixer.removeRange(rangeWithLine(context.sourceCode, node))),
              ],
        });
      }
    },
  };
};

// region | Helpers

/**
 * Groups the program's mergeable import statements by module, in source order. A statement that cannot share
 * a statement with named bindings (a side-effect import, a namespace import, a type-only default, or one that
 * carries import attributes) is left out, so it is neither merged into nor removed.
 */
function collectMergeableGroups(program: TSESTree.Program): Map<string, Contribution[]> {
  const groups = new Map<string, Contribution[]>();

  for (const node of program.body) {
    if (node.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue;
    }
    const contribution = toContribution(node);
    if (contribution === undefined) {
      continue;
    }

    const source = node.source.value;
    const group = groups.get(source);
    if (group === undefined) {
      groups.set(source, [contribution]);
    } else {
      group.push(contribution);
    }
  }
  return groups;
}

/**
 * Returns true if the fix would delete or orphan a comment: one inside the rewritten first statement, or one
 * attached to a removed statement, whether leading it on its own line, sitting inside it, or trailing on its
 * last line. A comment elsewhere in the group's span annotates code the fix leaves in place.
 */
function fixWouldLoseComment(
  sourceCode: TSESLint.SourceCode,
  first: TSESTree.Node,
  removed: readonly TSESTree.Node[],
): boolean {
  const comments = sourceCode.getAllComments();
  if (comments.some((comment) => rangesOverlap(comment.range, first.range))) {
    return true;
  }

  return removed.some((node) => {
    const previousToken = sourceCode.getTokenBefore(node);
    const previousEnd = previousToken?.range[1] ?? 0;
    const previousEndLine = previousToken?.loc.end.line ?? 0;

    return comments.some(
      (comment) =>
        rangesOverlap(comment.range, node.range) ||
        (comment.range[0] >= node.range[1] && comment.loc.start.line === node.loc.end.line) ||
        (comment.range[0] >= previousEnd &&
          comment.range[1] <= node.range[0] &&
          comment.loc.start.line > previousEndLine),
    );
  });
}

/**
 * Widens a statement's range so its removal leaves no trace: the whole line where nothing else shares it, and
 * otherwise the spaces that separated it from what follows.
 */
function rangeWithLine(sourceCode: TSESLint.SourceCode, node: TSESTree.Node): TSESTree.Range {
  const { text } = sourceCode;
  const [start, end] = node.range;
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const lineBreakLength = /^\r?\n/.exec(text.slice(end))?.[0].length ?? 0;

  if (text.slice(lineStart, start).trim() !== '' || lineBreakLength === 0) {
    const trailingSpaces = /^[ \t]*/.exec(text.slice(end))?.[0].length ?? 0;
    return [start, end + trailingSpaces];
  }
  return [lineStart, end + lineBreakLength];
}

/** Returns true if the two ranges share any characters. */
function rangesOverlap(a: TSESTree.Range, b: TSESTree.Range): boolean {
  return a[0] < b[1] && a[1] > b[0];
}

/**
 * Renders the group as one statement. The specifiers keep their source order, and a binding imported twice is
 * kept once. Where every binding is a type, the statement is `import type { ... }`, which `verbatimModuleSyntax`
 * erases entirely; an inline form would leave a side-effect import behind.
 */
function renderMerged(sourceCode: TSESLint.SourceCode, contributions: readonly Contribution[]): string {
  const [first] = contributions;
  if (first === undefined) {
    return '';
  }

  const defaultName = contributions.find((contribution) => contribution.defaultName !== undefined)?.defaultName;
  const named = new Map<string, NamedSpecifier>();
  for (const contribution of contributions) {
    for (const specifier of contribution.named) {
      named.set(`${specifier.isType ? 'type' : 'value'}:${specifier.text}`, specifier);
    }
  }

  const allTypes = defaultName === undefined && named.values().every((specifier) => specifier.isType);
  const clauses: string[] = [];
  if (defaultName !== undefined) {
    clauses.push(defaultName);
  }
  if (named.size > 0) {
    const specifiers = named
      .values()
      .map((specifier) => (allTypes || !specifier.isType ? specifier.text : `type ${specifier.text}`))
      .toArray();
    clauses.push(`{ ${specifiers.join(', ')} }`);
  }

  const semicolon = sourceCode.getText(first.node).endsWith(';') ? ';' : '';
  return `import ${allTypes ? 'type ' : ''}${clauses.join(', ')} from ${sourceCode.getText(first.node.source)}${semicolon}`;
}

/** Reads the bindings a statement contributes, or undefined where the statement cannot take part in a merge. */
function toContribution(node: TSESTree.ImportDeclaration): Contribution | undefined {
  if (node.specifiers.length === 0 || node.attributes.length > 0) {
    return undefined;
  }

  const contribution: Contribution = { defaultName: undefined, named: [], node };
  for (const specifier of node.specifiers) {
    switch (specifier.type) {
      case AST_NODE_TYPES.ImportNamespaceSpecifier:
        return undefined;
      case AST_NODE_TYPES.ImportDefaultSpecifier:
        if (node.importKind === 'type') {
          return undefined;
        }
        contribution.defaultName = specifier.local.name;
        break;
      case AST_NODE_TYPES.ImportSpecifier:
        contribution.named.push(toNamedSpecifier(specifier, node.importKind === 'type'));
        break;
    }
  }
  return contribution;
}

/** Renders a named specifier without its `type` modifier, recording whether it imports a type. */
function toNamedSpecifier(specifier: TSESTree.ImportSpecifier, inTypeStatement: boolean): NamedSpecifier {
  const imported =
    specifier.imported.type === AST_NODE_TYPES.Identifier ? specifier.imported.name : specifier.imported.raw;
  const local = specifier.local.name;

  return {
    isType: inTypeStatement || specifier.importKind === 'type',
    text: imported === local ? local : `${imported} as ${local}`,
  };
}

// endregion | Helpers

// `import-x/no-duplicates` merges the shapes `toContribution` excludes, losing a kind, a side-effect
// import, or the parse.
const ruleDefinition = {
  create,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow importing one module in several statements where one statement could carry every binding',
    },
    fixable: 'code',
    schema: [],
    messages: {
      splitImports:
        "'{{source}}' is imported in {{count}} statements; one statement can carry every binding, with `type` on the specifiers that import types.",
    },
  },
} as const;

export default ruleDefinition;
