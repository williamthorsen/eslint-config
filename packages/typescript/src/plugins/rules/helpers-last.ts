import { AST_NODE_TYPES, AST_TOKEN_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

type MessageId = 'exportAfterHelpers' | 'outsideRegion' | 'testAfterHelpers' | 'unsorted';

/** A region fold, from its `region` marker to its matching `endregion` marker or, when unclosed, the end of the file. */
interface Region {
  end: number;
  name: string;
  parent: Region | undefined;
  start: number;
}

/** An unexported top-level function, its overload signatures and implementation counted once. */
interface Helper {
  id: TSESTree.Identifier;
  region: Region | undefined;
}

const MARKER_PATTERN = /^ (end)?region \| (\S.*?)\s*$/u;

const TEST_FUNCTIONS = new Set(['describe', 'it', 'test']);

/**
 * Reports each unexported function that is outside a region fold or out of order in its region, and each export or
 * test call after the first region that contains a helper.
 */
const create: TSESLint.RuleCreateFunction<MessageId> = (context) => {
  return {
    'Program:exit'(program: TSESTree.Program) {
      const regions = collectRegions(program, context.sourceCode.getAllComments());
      const helpers = collectHelpers(program, regions);

      const helpersByRegion = new Map<Region, Helper[]>();
      for (const helper of helpers) {
        if (helper.region === undefined) {
          context.report({ node: helper.id, messageId: 'outsideRegion', data: { name: helper.id.name } });
          continue;
        }
        helpersByRegion.set(helper.region, [...(helpersByRegion.get(helper.region) ?? []), helper]);
      }

      for (const regionHelpers of helpersByRegion.values()) {
        const misplaced = findFirstUnsorted(regionHelpers);
        if (misplaced !== undefined) {
          context.report({
            node: misplaced.helper.id,
            messageId: 'unsorted',
            data: { name: misplaced.helper.id.name, previous: misplaced.previous.id.name },
          });
        }
      }

      const firstRegionalHelper = helpers.find((helper) => helper.region !== undefined);
      if (firstRegionalHelper?.region === undefined) {
        return;
      }
      const boundary = findOutermostRegion(firstRegionalHelper.region);
      const data = { helper: firstRegionalHelper.id.name, region: boundary.name };

      for (const statement of program.body) {
        if (statement.range[0] < boundary.start) {
          continue;
        }
        if (isExportStatement(statement)) {
          context.report({ node: statement, messageId: 'exportAfterHelpers', data });
        } else if (isTestCall(statement)) {
          context.report({ node: statement, messageId: 'testAfterHelpers', data });
        }
      }
    },
  };
};

const ruleDefinition = {
  create,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require unexported functions to sit last, in sorted region folds',
    },
    schema: [],
    messages: {
      exportAfterHelpers: "Move this export above the region '{{region}}', which contains the helper '{{helper}}'.",
      outsideRegion: "Move the unexported function '{{name}}' into a region fold, such as `// region | Helpers`.",
      testAfterHelpers: "Move this test call above the region '{{region}}', which contains the helper '{{helper}}'.",
      unsorted: "Sort '{{name}}' before '{{previous}}': Helpers in a region are sorted case-insensitively by name.",
    },
  },
} as const;

export default ruleDefinition;

// region | Helpers

/** Collects the program's helpers in source order, each with the innermost region that contains it. */
function collectHelpers(program: TSESTree.Program, regions: Region[]): Helper[] {
  const helpers: Helper[] = [];
  let previousName: string | undefined;

  for (const statement of program.body) {
    const id = findHelperId(statement);
    if (id === undefined) {
      previousName = undefined;
      continue;
    }
    // Consecutive declarations of one name are overloads followed by their implementation.
    if (id.name !== previousName) {
      helpers.push({ id, region: findInnermostRegion(regions, statement.range[0]) });
    }
    previousName = id.name;
  }
  return helpers;
}

/**
 * Collects the region folds marked by top-level line comments, in order of their start. An `endregion` closes the
 * innermost open region only when the names match, and is ignored otherwise.
 */
function collectRegions(program: TSESTree.Program, comments: TSESTree.Comment[]): Region[] {
  const regions: Region[] = [];
  const open: Region[] = [];

  for (const comment of comments) {
    if (comment.type !== AST_TOKEN_TYPES.Line || isInsideStatement(program, comment)) {
      continue;
    }
    const match = MARKER_PATTERN.exec(comment.value);
    const name = match?.[2];
    if (match === null || name === undefined) {
      continue;
    }

    if (match[1] === undefined) {
      const region = { end: Infinity, name, parent: open.at(-1), start: comment.range[0] };
      open.push(region);
      regions.push(region);
    } else if (open.at(-1)?.name === name) {
      const closed = open.pop();
      if (closed !== undefined) {
        closed.end = comment.range[0];
      }
    }
  }
  return regions;
}

/** Returns the expression at the root of a call chain, such as `describe` in `describe.each(table)(name, fn)`. */
function findCalleeRoot(callee: TSESTree.Expression): TSESTree.Expression {
  let node = callee;
  for (;;) {
    switch (node.type) {
      case AST_NODE_TYPES.CallExpression:
        node = node.callee;
        break;
      case AST_NODE_TYPES.MemberExpression:
        node = node.object;
        break;
      case AST_NODE_TYPES.TaggedTemplateExpression:
        node = node.tag;
        break;
      default:
        return node;
    }
  }
}

/** Returns the first helper whose name sorts before that of the helper preceding it, together with that helper. */
function findFirstUnsorted(helpers: Helper[]): { helper: Helper; previous: Helper } | undefined {
  for (const [index, helper] of helpers.entries()) {
    const previous = helpers[index - 1];
    if (previous !== undefined && previous.id.name.toLowerCase() > helper.id.name.toLowerCase()) {
      return { helper, previous };
    }
  }
  return undefined;
}

/** Returns the name of an unexported, non-ambient function declaration or overload signature. */
function findHelperId(statement: TSESTree.ProgramStatement): TSESTree.Identifier | undefined {
  if (
    statement.type === AST_NODE_TYPES.FunctionDeclaration ||
    (statement.type === AST_NODE_TYPES.TSDeclareFunction && !statement.declare)
  ) {
    return statement.id ?? undefined;
  }
  return undefined;
}

/** Returns the innermost region that contains the position. Because nested regions start later, it is the last match. */
function findInnermostRegion(regions: Region[], position: number): Region | undefined {
  return regions.findLast((region) => region.start < position && position < region.end);
}

/** Returns the region's outermost enclosing region, or the region itself when no region encloses it. */
function findOutermostRegion(region: Region): Region {
  return region.parent === undefined ? region : findOutermostRegion(region.parent);
}

/** Returns true for any statement that exports, re-exports included. */
function isExportStatement(statement: TSESTree.ProgramStatement): boolean {
  return [
    AST_NODE_TYPES.ExportAllDeclaration,
    AST_NODE_TYPES.ExportDefaultDeclaration,
    AST_NODE_TYPES.ExportNamedDeclaration,
    AST_NODE_TYPES.TSExportAssignment,
  ].includes(statement.type);
}

/** Returns true if the comment lies within a top-level statement rather than between statements. */
function isInsideStatement(program: TSESTree.Program, comment: TSESTree.Comment): boolean {
  return program.body.some(
    (statement) => statement.range[0] <= comment.range[0] && comment.range[1] <= statement.range[1],
  );
}

/** Returns true for a top-level call rooted at `describe`, `it`, or `test`, such as `it.skip(...)`. */
function isTestCall(statement: TSESTree.ProgramStatement): boolean {
  if (
    statement.type !== AST_NODE_TYPES.ExpressionStatement ||
    statement.expression.type !== AST_NODE_TYPES.CallExpression
  ) {
    return false;
  }
  const root = findCalleeRoot(statement.expression.callee);
  return root.type === AST_NODE_TYPES.Identifier && TEST_FUNCTIONS.has(root.name);
}

// endregion | Helpers
