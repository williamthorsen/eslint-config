/**
 * Readiness checks for a project consuming @williamthorsen/tsconfig.
 *
 * The kit ships inside the package, so it always runs at the version the consumer has installed.
 * That is what it asserts: whether the surrounding tsconfigs are wired for this version, never
 * whether the version itself is current.
 *
 * `error` is reserved for a failure that breaks or impairs use of the base. Only the Node floor
 * qualifies, because `tsc` cannot see what runtime a project ships on; everything a typecheck would
 * surface on its own caps at `warn`.
 */
import { type CheckOutcome, defineRdyKit, type Progress } from 'readyup';
import {
  discoverWorkspaces,
  esYearForNodeMajor,
  fileExists,
  readEnginesNodeFloor,
  readJsonFile,
  readToolVersionsNode,
  readTsconfigChain,
  type TsconfigChain,
} from 'readyup/check-utils';

import { isConsumerOwnedConfig } from '../../src/readiness/base-chain.ts';
import { classifyChain } from '../../src/readiness/classifyChain.ts';
import { isEsYearAtLeast, readDeclaredEsYear } from '../../src/readiness/es-year.ts';
import { findRedundantOptions } from '../../src/readiness/findRedundantOptions.ts';
import { classifyNodeEsYear, findLowestNodeMajor, type NodeEsYear } from '../../src/readiness/node-floor.ts';

const PACKAGE_NAME = '@williamthorsen/tsconfig';
const BASE_SPECIFIER = `${PACKAGE_NAME}/tsconfig.base.json`;
const ADOPTION_URL = 'https://github.com/williamthorsen/eslint-config/tree/main/packages/tsconfig#adopting-the-base';

const NO_BASE_ES_YEAR = `no tsconfig reaches a ${PACKAGE_NAME} base declaring an ES year`;
const NO_NODE_ES_YEAR = 'no ES year is known for the declared Node floor';

type Adoption =
  | { baseIndex: number; chain: TsconfigChain; kind: 'adopted'; path: string }
  | { kind: 'external-base' | 'unadopted' | 'uninstalled'; path: string };

type AdoptedTsconfig = Extract<Adoption, { kind: 'adopted' }>;

type FloorVerdict = { detail: string; kind: 'fail' | 'pass' } | { kind: 'skip'; reason: string };

// Held for the life of one `rdy` run, which is one process targeting one project.
const cache: { adoptions?: Adoption[]; chains: Map<string, TsconfigChain | undefined> } = {
  chains: new Map(),
};

export default defineRdyKit({
  description: `Adoption and alignment checks for a project consuming ${PACKAGE_NAME}`,
  defaultSeverity: 'warn',
  checklists: [
    {
      name: 'adoption',
      checks: [
        {
          name: `Every workspace tsconfig extends ${PACKAGE_NAME}`,
          skip: skipUnlessSomeTsconfigIsAccountable,
          check: everyTsconfigAdoptsTheBase,
          fix: `Extend ${BASE_SPECIFIER} from each tsconfig named above, and declare ${PACKAGE_NAME} as a devDependency of each package that names it but cannot resolve it. Adoption: ${ADOPTION_URL}`,
        },
        {
          name: 'No tsconfig re-declares an option the base already supplies',
          severity: 'recommend',
          check: noRedundantOptions,
          fix: 'Delete each option named above: the base already supplies it with the same value',
        },
      ],
    },
    {
      name: 'alignment',
      checks: [
        {
          name: `No tsconfig declares an ES year other than the one ${PACKAGE_NAME} sets`,
          skip: skipUnlessBaseEsYearKnown,
          check: everyEsYearMatchesTheBase,
          fix: 'Delete the target or lib declaration named above, so the ES year the base sets applies',
        },
        {
          name: "The declared Node floor supports the base's ES year",
          severity: 'error',
          skip: skipUnlessNodeFloorComparable,
          check: nodeFloorSupportsBaseEsYear,
          fix: "Raise engines.node to a major implementing the base's ES year: below it, code that typechecks fails at runtime",
        },
      ],
    },
  ],
});

// region | Helpers

/** Classifies every workspace tsconfig by how it reaches, or fails to reach, this package's base. */
function classifyAdoptions(): Adoption[] {
  cache.adoptions ??= findTsconfigs().map((path) => classifyTsconfig(path));
  return cache.adoptions;
}

/** Classifies one tsconfig by how it reaches, or fails to reach, this package's base. */
function classifyTsconfig(path: string): Adoption {
  const chain = readChain(path);
  if (chain === undefined) return { kind: 'unadopted', path };

  const classification = classifyChain(chain);
  return classification.kind === 'adopted'
    ? { baseIndex: classification.baseIndex, chain, kind: 'adopted', path }
    : { kind: classification.kind, path };
}

/** Removes repeats while keeping first-seen order, so a shared config is named once. */
function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/** Fails when a consumer's own tsconfig declares an ES year that departs from the base's. */
function everyEsYearMatchesTheBase(): boolean | CheckOutcome {
  const baseEsYear = readBaseEsYear();
  if (baseEsYear === undefined) return true;

  const offenders: string[] = [];
  for (const adoption of listAdoptedTsconfigs()) {
    for (const entry of adoption.chain.entries.slice(0, adoption.baseIndex)) {
      if (!isConsumerOwnedConfig(entry.path)) continue;
      const declared = readDeclaredEsYear(entry.compilerOptions);
      if (declared !== undefined && declared !== baseEsYear) offenders.push(`${entry.path} (${declared})`);
    }
  }
  if (offenders.length === 0) return { ok: true, detail: `every tsconfig extending the base is at ${baseEsYear}` };
  return {
    ok: false,
    detail: `the base sets ${baseEsYear}; declared otherwise in: ${dedupe(offenders).join(', ')}`,
  };
}

/** Fails when a workspace tsconfig neither reaches the base nor legitimately opts out of it. */
function everyTsconfigAdoptsTheBase(): boolean | CheckOutcome {
  const accountable = classifyAdoptions().filter((adoption) => adoption.kind !== 'external-base');
  const adopted = accountable.filter((adoption) => adoption.kind === 'adopted');
  const progress: Progress = { type: 'fraction', passedCount: adopted.length, count: accountable.length };

  const uninstalled = listPathsOfKind(accountable, 'uninstalled');
  const unadopted = listPathsOfKind(accountable, 'unadopted');
  if (uninstalled.length === 0 && unadopted.length === 0) return { ok: true, progress };

  const details = [
    uninstalled.length > 0 ? `${PACKAGE_NAME} is named but not installed in: ${uninstalled.join(', ')}` : undefined,
    unadopted.length > 0 ? `no extends chain reaches the base from: ${unadopted.join(', ')}` : undefined,
  ].filter((detail) => detail !== undefined);
  return { ok: false, detail: details.join('; '), progress };
}

/** Lists every workspace tsconfig present, the repo root included. */
function findTsconfigs(): string[] {
  return listTsconfigSearchDirs()
    .map((dir) => resolveDirPath(dir, 'tsconfig.json'))
    .filter((path) => fileExists(path));
}

/**
 * Judges the lowest declared Node floor against the ES year the base sets, or names why the two
 * cannot be compared.
 */
function judgeNodeFloor(): FloorVerdict {
  const baseEsYear = readBaseEsYear();
  if (baseEsYear === undefined) return { kind: 'skip', reason: NO_BASE_ES_YEAR };

  const nodeEsYear = readNodeEsYear();
  if (nodeEsYear === undefined) return { kind: 'skip', reason: 'no declared Node floor names a major' };

  // A major the table skips or postdates means unknown, not unsupported: a consumer running ahead of
  // the table is not in breach.
  if (nodeEsYear.kind === 'unknown') return { kind: 'skip', reason: NO_NODE_ES_YEAR };

  if (nodeEsYear.kind === 'under') {
    return isEsYearAtLeast(baseEsYear, nodeEsYear.esYear)
      ? {
          detail: `the declared Node floor implements less than ${nodeEsYear.esYear}, below the base's ${baseEsYear}`,
          kind: 'fail',
        }
      : { kind: 'skip', reason: NO_NODE_ES_YEAR };
  }

  return isEsYearAtLeast(nodeEsYear.esYear, baseEsYear)
    ? { detail: `the declared Node floor implements ${nodeEsYear.esYear}`, kind: 'pass' }
    : {
        detail: `the declared Node floor implements only ${nodeEsYear.esYear}, below the base's ${baseEsYear}`,
        kind: 'fail',
      };
}

/** Lists the tsconfigs that reach the base, each with the chain that reached it. */
function listAdoptedTsconfigs(): AdoptedTsconfig[] {
  return classifyAdoptions().filter((adoption) => adoption.kind === 'adopted');
}

/** Lists the Node floors the repo declares, preferring the contract a manifest publishes. */
function listDeclaredNodeFloors(): string[] {
  const engineFloors = listTsconfigSearchDirs().flatMap((dir) => {
    const manifest = readJsonFile(resolveDirPath(dir, 'package.json'));
    if (manifest === undefined) return [];
    const floor = readEnginesNodeFloor(manifest);
    return floor.kind === 'found' ? [floor.floor] : [];
  });
  if (engineFloors.length > 0) return engineFloors;

  const toolVersionsFloor = readToolVersionsNode();
  return toolVersionsFloor === undefined ? [] : [toolVersionsFloor];
}

/** Lists the paths of the classified tsconfigs of one kind. */
function listPathsOfKind(classified: readonly Adoption[], kind: Adoption['kind']): string[] {
  return classified.filter((adoption) => adoption.kind === kind).map((adoption) => adoption.path);
}

/** Lists the directories that may hold a tsconfig: the repo root and every workspace. */
function listTsconfigSearchDirs(): string[] {
  return discoverWorkspaces().map((workspace) => workspace.dir);
}

/** Fails when the lowest declared Node floor predates the ES year the base sets. */
function nodeFloorSupportsBaseEsYear(): boolean | CheckOutcome {
  const verdict = judgeNodeFloor();
  return verdict.kind === 'skip' ? true : { ok: verdict.kind === 'pass', detail: verdict.detail };
}

/** Fails when a tsconfig re-declares an option the base already supplies with the same value. */
function noRedundantOptions(): boolean | CheckOutcome {
  const offenders = listAdoptedTsconfigs().flatMap((adoption) =>
    findRedundantOptions(adoption.chain.entries, adoption.baseIndex).map(
      (redundant) => `${redundant.path} (${redundant.key})`,
    ),
  );
  if (offenders.length === 0) return true;
  return { ok: false, detail: `the base already supplies: ${dedupe(offenders).join(', ')}` };
}

/**
 * Reads the ES year from the base's own chain entry, so the comparison tracks the version the
 * consumer extends rather than a constant compiled into this kit.
 */
function readBaseEsYear(): string | undefined {
  for (const adoption of listAdoptedTsconfigs()) {
    const baseOptions = adoption.chain.entries[adoption.baseIndex]?.compilerOptions;
    const esYear = baseOptions === undefined ? undefined : readDeclaredEsYear(baseOptions);
    if (esYear !== undefined) return esYear;
  }
  return undefined;
}

/** Reads a tsconfig's extends chain, which several checks walk. */
function readChain(path: string): TsconfigChain | undefined {
  if (!cache.chains.has(path)) cache.chains.set(path, readTsconfigChain(path));
  return cache.chains.get(path);
}

/**
 * Reads the ES year the repo's declared Node floor implements. `engines.node` is the floor a package
 * publishes as a contract; `.tool-versions` describes one dev machine, so it decides only where no
 * manifest declares one.
 */
function readNodeEsYear(): NodeEsYear | undefined {
  const major = findLowestNodeMajor(listDeclaredNodeFloors());
  return major === undefined ? undefined : classifyNodeEsYear(major, esYearForNodeMajor);
}

/** Resolves a directory-relative path, treating the repo root ('.') as bare. */
function resolveDirPath(dir: string, basename: string): string {
  return dir === '.' ? basename : `${dir}/${basename}`;
}

/** Skips the ES year check until some chain reaches a base declaring one. */
function skipUnlessBaseEsYearKnown(): false | string {
  return readBaseEsYear() === undefined ? NO_BASE_ES_YEAR : false;
}

/** Skips the Node floor check where either side of the comparison is unavailable. */
function skipUnlessNodeFloorComparable(): false | string {
  const verdict = judgeNodeFloor();
  return verdict.kind === 'skip' ? verdict.reason : false;
}

/** Skips the adoption check when every tsconfig found extends a base belonging to another package. */
function skipUnlessSomeTsconfigIsAccountable(): false | string {
  const classified = classifyAdoptions();
  if (classified.length === 0) return 'no workspace tsconfig was found';
  return classified.some((adoption) => adoption.kind !== 'external-base')
    ? false
    : 'every workspace tsconfig extends a base belonging to another package';
}

// endregion | Helpers
