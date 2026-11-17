/**
 * Readiness checks for a project consuming @williamthorsen/tsconfig.
 *
 * The kit ships inside the package, so it always runs at the version that the consumer has installed.
 * That is what it asserts: whether the surrounding tsconfigs are wired for this version, never
 * whether the version itself is current.
 *
 * The kit reserves `error` for a failure that breaks or impairs use of the base. Only the Node floor
 * qualifies, because `tsc` cannot see what runtime a project runs on; everything a typecheck would
 * report on its own caps at `warn`.
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

import { type ChainClassification, classifyChain } from '../../src/readiness/classifyChain.ts';
import { findEsYearMismatches, readDeclaredEsYear } from '../../src/readiness/es-year.ts';
import { type EscapingPath, findEscapingPaths } from '../../src/readiness/findEscapingPaths.ts';
import { findRedundantOptions } from '../../src/readiness/findRedundantOptions.ts';
import { listSearchDirs } from '../../src/readiness/listSearchDirs.ts';
import {
  classifyNodeEsYear,
  findLowestNodeMajor,
  judgeNodeFloor,
  NO_BASE_ES_YEAR,
  type NodeEsYear,
} from '../../src/readiness/node-floor.ts';
import {
  appendUnreadNote,
  noteUnreadChains,
  skipUnlessChainRead,
  sortChainReads,
  type UnreadChain,
} from '../../src/readiness/tsconfig-chain-reads.ts';

const PACKAGE_NAME = '@williamthorsen/tsconfig';
const BASE_SPECIFIER = `${PACKAGE_NAME}/tsconfig.base.json`;
const ADOPTION_URL = 'https://github.com/williamthorsen/eslint-config/tree/main/packages/tsconfig#adopting-the-base';

type Adoption = ChainClassification & { path: string };

type AdoptedTsconfig = Extract<Adoption, { kind: 'adopted' }>;

// Kept for the life of one `rdy` run, which is one process targeting one project.
const cache: { adoptions?: Adoption[]; chains: Map<string, TsconfigChain | undefined> } = {
  chains: new Map(),
};

export default defineRdyKit({
  description: `Adoption, alignment, and hygiene checks for a project consuming ${PACKAGE_NAME}`,
  defaultSeverity: 'warn',
  checklists: [
    {
      name: 'adoption',
      checks: [
        {
          name: `Every workspace tsconfig extends ${PACKAGE_NAME}`,
          skip: skipUnlessSomeTsconfigIsAccountable,
          check: checkEveryTsconfigAdoptsTheBase,
          fix: `Extend ${BASE_SPECIFIER} from each tsconfig named above, and declare ${PACKAGE_NAME} as a devDependency of each package that names it but cannot resolve it. Adoption: ${ADOPTION_URL}`,
        },
        {
          name: 'No tsconfig re-declares an option that the base already supplies',
          severity: 'recommend',
          skip: skipUnlessSomeChainWasRead,
          check: checkNoRedundantOptions,
          fix: 'Delete each option named above: The base already supplies it with the same value',
        },
      ],
    },
    {
      name: 'alignment',
      checks: [
        {
          name: `No tsconfig declares an ES year other than the one ${PACKAGE_NAME} sets`,
          skip: skipUnlessBaseEsYearKnown,
          check: checkEveryEsYearMatchesTheBase,
          fix: 'Delete the target or lib declaration named above, so that the ES year set by the base applies',
        },
        {
          name: "The declared Node floor supports the base's ES year",
          severity: 'error',
          skip: skipUnlessNodeFloorComparable,
          check: checkNodeFloorSupportsBaseEsYear,
          fix: "Raise engines.node to a major implementing the base's ES year: Below it, code that typechecks fails at runtime",
        },
      ],
    },
    {
      name: 'hygiene',
      checks: [
        {
          name: "No tsconfig's include, exclude, or files names a path outside its own directory",
          skip: skipUnlessSomeTsconfigWasFound,
          check: checkNoEscapingPaths,
          fix: "Declare the field named above in the config that owns the directory, listing every path that it needs, since a local declaration replaces the inherited one rather than merging and discards the default exclude of node_modules, bower_components, jspm_packages, and outDir; or prefix each path in the config being extended with ${configDir}, which resolves to the consuming config's directory",
        },
      ],
    },
  ],
});

// region | Helpers

/** Fails when a consumer's own tsconfig declares an ES year that departs from the base's. */
function checkEveryEsYearMatchesTheBase(): boolean | CheckOutcome {
  const baseEsYear = readBaseEsYear();
  if (baseEsYear === undefined) return true;

  const offenders = listAdoptedTsconfigs().flatMap((adoption) =>
    findEsYearMismatches(adoption.chain.entries, adoption.baseIndex, baseEsYear).map(
      (mismatch) => `${mismatch.path} (${mismatch.esYear})`,
    ),
  );
  const outcome =
    offenders.length === 0
      ? { ok: true, detail: `every tsconfig extending the base is at ${baseEsYear}` }
      : { ok: false, detail: `the base sets ${baseEsYear}; declared otherwise in: ${dedupe(offenders).join(', ')}` };
  return noteUnreadChains(outcome, listUnreadChains());
}

/** Fails when a workspace tsconfig neither reaches the base nor legitimately opts out of it. */
function checkEveryTsconfigAdoptsTheBase(): boolean | CheckOutcome {
  const accountable = classifyAdoptions().filter((adoption) => adoption.kind !== 'external-base');
  const adopted = accountable.filter((adoption) => adoption.kind === 'adopted');
  const progress: Progress = { type: 'fraction', passedCount: adopted.length, count: accountable.length };

  const uninstalled = listPathsOfKind(accountable, 'uninstalled');
  const unadopted = listPathsOfKind(accountable, 'unadopted');
  const unread = listUnreadChains();
  if (uninstalled.length === 0 && unadopted.length === 0) return noteUnreadChains({ ok: true, progress }, unread);

  const details = [
    uninstalled.length > 0 ? `${PACKAGE_NAME} is named but not installed in: ${uninstalled.join(', ')}` : undefined,
    unadopted.length > 0 ? `no extends chain reaches the base from: ${unadopted.join(', ')}` : undefined,
  ].filter((detail) => detail !== undefined);
  return noteUnreadChains({ ok: false, detail: details.join('; '), progress }, unread);
}

/** Fails when the lowest declared Node floor predates the ES year set by the base. */
function checkNodeFloorSupportsBaseEsYear(): boolean | CheckOutcome {
  const verdict = judgeNodeFloor(readBaseEsYear(), readNodeEsYear());
  return verdict.kind === 'skip' || { ok: verdict.kind === 'pass', detail: verdict.detail };
}

/** Fails when a workspace tsconfig is governed by an include, exclude, or files path outside its own directory. */
function checkNoEscapingPaths(): boolean | CheckOutcome {
  const { judged, unread } = sortEscapeJudgements();
  const offenders = judged.filter((judgedConfig) => judgedConfig.escapes.length > 0);
  const progress: Progress = {
    type: 'fraction',
    passedCount: judged.length - offenders.length,
    count: judged.length + unread.length,
  };
  if (offenders.length === 0) return noteUnreadChains({ ok: true, progress }, unread);

  const details = offenders.flatMap((offender) =>
    offender.escapes.map((escaping) => `${offender.path} (${describeEscape(offender.path, escaping)})`),
  );
  return noteUnreadChains({ ok: false, detail: details.join(', '), progress }, unread);
}

/** Fails when a tsconfig re-declares an option that the base already supplies with the same value. */
function checkNoRedundantOptions(): boolean | CheckOutcome {
  const offenders = listAdoptedTsconfigs().flatMap((adoption) =>
    findRedundantOptions(adoption.chain.entries, adoption.baseIndex).map(
      (redundant) => `${redundant.path} (${redundant.key})`,
    ),
  );
  const outcome = offenders.length === 0 || {
    ok: false,
    detail: `the base already supplies: ${dedupe(offenders).join(', ')}`,
  };
  return noteUnreadChains(outcome, listUnreadChains());
}

/** Classifies every workspace tsconfig by how it reaches, or fails to reach, this package's base. */
function classifyAdoptions(): Adoption[] {
  cache.adoptions ??= findTsconfigs().map((path) => classifyTsconfig(path));
  return cache.adoptions;
}

/** Classifies one tsconfig by how it reaches, or fails to reach, this package's base. */
function classifyTsconfig(path: string): Adoption {
  return { ...classifyChain(readChain(path)), path };
}

/** Removes repeats while keeping first-seen order, so that a shared config is named once. */
function dedupe(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/**
 * Describes one escaping path, naming the config that declared it when that is not the config being
 * reported, since an inherited path is fixed where it was written.
 */
function describeEscape(configPath: string, escaping: EscapingPath): string {
  const source = escaping.declaredIn === configPath ? '' : `, from ${escaping.declaredIn}`;
  return `${escaping.field}: ${escaping.path}${source}`;
}

/** Lists every workspace tsconfig present, the repo root included. */
function findTsconfigs(): string[] {
  return listTsconfigSearchDirs()
    .map((dir) => resolveDirPath(dir, 'tsconfig.json'))
    .filter((path) => fileExists(path));
}

/** Lists the tsconfigs that reach the base, each with the chain that reached it. */
function listAdoptedTsconfigs(): AdoptedTsconfig[] {
  return classifyAdoptions().filter((adoption) => adoption.kind === 'adopted');
}

/** Lists the Node floors declared by the repo, preferring the contract that a manifest publishes. */
function listDeclaredNodeFloors(): string[] {
  const engineFloors = listTsconfigSearchDirs().flatMap((dir) => {
    const manifest = readJsonFile(resolveDirPath(dir, 'package.json'));
    if (manifest === undefined) return [];
    const floor = readEnginesNodeFloor(manifest);
    return floor.kind === 'found' ? floor.floor : [];
  });
  if (engineFloors.length > 0) return engineFloors;

  const toolVersionsFloor = readToolVersionsNode();
  return toolVersionsFloor === undefined ? [] : [toolVersionsFloor];
}

/** Lists the paths of the classified tsconfigs of one kind. */
function listPathsOfKind(classified: readonly Adoption[], kind: Adoption['kind']): string[] {
  return classified.filter((adoption) => adoption.kind === kind).map((adoption) => adoption.path);
}

/** Lists the directories that may contain a tsconfig: the repo root and every workspace. */
function listTsconfigSearchDirs(): string[] {
  return listSearchDirs(discoverWorkspaces().map((workspace) => workspace.dir));
}

/** Lists the tsconfigs whose chains could not be read in full, and why. */
function listUnreadChains(): UnreadChain[] {
  return classifyAdoptions().flatMap((adoption) =>
    adoption.kind === 'unread' ? { path: adoption.path, reason: adoption.reason } : [],
  );
}

/**
 * Reads the ES year from the base's own chain entry, so that the comparison tracks the version
 * that the consumer extends.
 */
function readBaseEsYear(): string | undefined {
  for (const adoption of listAdoptedTsconfigs()) {
    const baseOptions = adoption.chain.entries[adoption.baseIndex]?.compilerOptions;
    const esYear = baseOptions === undefined ? undefined : readDeclaredEsYear(baseOptions);
    if (esYear !== undefined) return esYear;
  }
  return undefined;
}

/** Reads a tsconfig's extends chain, caching it for the several checks that walk it. */
function readChain(path: string): TsconfigChain | undefined {
  if (!cache.chains.has(path)) cache.chains.set(path, readTsconfigChain(path));
  return cache.chains.get(path);
}

/**
 * Reads the ES year that the repo's declared Node floor implements.
 * `engines.node` is the floor that a package publishes as a contract;
 * `.tool-versions` describes one dev machine, so it decides only when no manifest declares one.
 */
function readNodeEsYear(): NodeEsYear | undefined {
  const major = findLowestNodeMajor(listDeclaredNodeFloors());
  return major === undefined ? undefined : classifyNodeEsYear(major, esYearForNodeMajor);
}

/** Resolves a directory-relative path, treating the repo root ('.') as bare. */
function resolveDirPath(dir: string, basename: string): string {
  return dir === '.' ? basename : `${dir}/${basename}`;
}

/**
 * Skips the ES year check until some chain reaches a base declaring one, naming the unread chains,
 * any of which may be the one that reaches it.
 */
function skipUnlessBaseEsYearKnown(): false | string {
  return readBaseEsYear() === undefined && appendUnreadNote(NO_BASE_ES_YEAR, listUnreadChains());
}

/** Skips the Node floor check when either side of the comparison is unavailable. */
function skipUnlessNodeFloorComparable(): false | string {
  const verdict = judgeNodeFloor(readBaseEsYear(), readNodeEsYear());
  if (verdict.kind !== 'skip') return false;
  return verdict.reason === NO_BASE_ES_YEAR ? appendUnreadNote(verdict.reason, listUnreadChains()) : verdict.reason;
}

/** Skips a check that judges the configs reaching the base when no chain could be read. */
function skipUnlessSomeChainWasRead(): false | string {
  const unread = listUnreadChains();
  return skipUnlessChainRead(classifyAdoptions().length - unread.length, unread);
}

/** Skips the adoption check when every tsconfig found extends a base belonging to another package. */
function skipUnlessSomeTsconfigIsAccountable(): false | string {
  const classified = classifyAdoptions();
  if (classified.length === 0) return 'no workspace tsconfig was found';
  const accountable = classified.filter((adoption) => adoption.kind !== 'external-base');
  if (accountable.length === 0) return 'every workspace tsconfig extends a base belonging to another package';

  const unread = listUnreadChains();
  return skipUnlessChainRead(accountable.length - unread.length, unread);
}

/** Skips the escaping-path check when the project has no tsconfig to judge or could read none. */
function skipUnlessSomeTsconfigWasFound(): false | string {
  if (findTsconfigs().length === 0) return 'no workspace tsconfig was found';
  const { judged, unread } = sortEscapeJudgements();
  return skipUnlessChainRead(judged.length, unread);
}

/**
 * Judges every workspace tsconfig read in full for escaping paths. Any unresolved `extends` leaves
 * a chain unread here, the base's own included, since the check judges what the chain declares
 * rather than whether it adopts the base.
 */
function sortEscapeJudgements(): { judged: Array<{ escapes: EscapingPath[]; path: string }>; unread: UnreadChain[] } {
  const { read, unread } = sortChainReads(findTsconfigs(), readChain);
  return { judged: read.map(({ chain, path }) => ({ escapes: findEscapingPaths(chain.entries), path })), unread };
}

// endregion | Helpers
