/**
 * Readiness checks for a project consuming @williamthorsen/eslint-config-typescript.
 *
 * The package includes the kit, so the kit always runs at the version that the consumer has
 * installed. That is what it asserts: whether the surrounding configuration is wired correctly for
 * this version, never whether the version itself is current. Prompting an upgrade needs a kit that
 * outlives the version being replaced, which a package-hosted kit cannot be.
 *
 * `error` is reserved for a failure that stops ESLint loading or running the config. Everything
 * else caps at `warn`: these checks are a migration aid, not a gate.
 */
import { type CheckOutcome, defineRdyKit, pickJson } from 'readyup';
import {
  discoverWorkspaces,
  fileExists,
  getJsonValue,
  readFile,
  readJsonFile,
  readTsconfigChain,
  type TsconfigChain,
} from 'readyup/check-utils';

import {
  declaresParserProject,
  enablesNextPlugin,
  importsFromDir,
  listRelativeNextRootDirs,
  setsNextRootDir,
  setsTsconfigRootDir,
} from '../../src/readiness/eslint-config-contents.ts';
import {
  ESLINT_CONFIG_BASENAMES,
  findOwningTsconfig,
  listEslintConfigCandidates,
  listShadowedEslintConfigDirs,
  resolveDirPath,
} from '../../src/readiness/eslint-config-paths.ts';
import { listSearchDirs } from '../../src/readiness/listSearchDirs.ts';
import { comparePeer, judgePeerFloor, type PeerComparison, pickLowestVersion } from '../../src/readiness/peer-floor.ts';
import { permitsTsExtensionImports } from '../../src/readiness/permitsTsExtensionImports.ts';
import { skipBelowTypeScriptConfigSupport } from '../../src/readiness/skipBelowTypeScriptConfigSupport.ts';
import { type InputCoverage, judgeInputCoverage } from '../../src/readiness/tsconfig-inputs.ts';

const PACKAGE_NAME = '@williamthorsen/eslint-config-typescript';
const MIGRATION_URL = `https://github.com/williamthorsen/eslint-config/tree/main/packages/typescript#migrating-from-parseroptionsproject`;
const TS_ESLINT_CONFIG_MIGRATION_URL = `https://github.com/williamthorsen/eslint-config/tree/main/packages/typescript#migrating-eslint-configs-to-typescript`;
const IMPORT_SPECIFIER_URL = `https://github.com/williamthorsen/eslint-config/tree/main/packages/typescript#import-specifiers`;

// Inlined at compile time, so the floors track the package's own peer ranges instead of a copy.
const PEER_RANGES = pickJson('../../package.json', ['peerDependencies']);

interface InputJudgement {
  configPath: string;
  coverage: InputCoverage;
}

const installedVersions = new Map<string, string | undefined>();

// Held for the life of one `rdy` run so that the kit reads a tsconfig's chain once, however many
// eslint configs the tsconfig owns.
const tsconfigChains = new Map<string, TsconfigChain | undefined>();

export default defineRdyKit({
  description: `Alignment checks for a project consuming ${PACKAGE_NAME}`,
  defaultSeverity: 'warn',
  checklists: [
    {
      name: 'peers',
      checks: [
        {
          name: 'eslint satisfies the peer range declared by this config',
          severity: 'error',
          skip: () => skipUnlessPeerComparable('eslint'),
          check: () => checkPeerFloor('eslint'),
          fix: 'Upgrade eslint to the version that this config requires as a peer',
        },
        {
          name: 'typescript satisfies the peer range declared by this config',
          severity: 'error',
          skip: () => skipUnlessPeerComparable('typescript'),
          check: () => checkPeerFloor('typescript'),
          fix: 'Upgrade typescript to the version that this config requires as a peer',
        },
      ],
    },
    {
      name: 'config',
      checks: [
        {
          name: 'A root eslint config exists',
          check: () => findRootEslintConfig() !== undefined,
          fix: `Add eslint.config.ts at the repo root, extending ${PACKAGE_NAME}`,
          checks: [
            {
              name: `The root eslint config extends ${PACKAGE_NAME}`,
              check: rootEslintConfigExtendsThisPackage,
              fix: `Import ${PACKAGE_NAME} in the root eslint config and spread it into the exported config`,
            },
          ],
        },
        {
          name: 'No JavaScript eslint config shadows a TypeScript one',
          severity: 'error',
          skip: skipUnlessEslintLoadsTypeScript,
          check: noShadowedEslintConfig,
          fix: 'Delete the JavaScript eslint config sharing a directory with a TypeScript one: The loader resolves the JavaScript basename first, so the TypeScript config never runs',
        },
        {
          name: 'An eslint config anchors the project service with tsconfigRootDir',
          check: tsconfigRootDirAnchored,
          fix: 'Set parserOptions.tsconfigRootDir (import.meta.dirname) in the root eslint config so that type-aware linting resolves from the repo root rather than the working directory',
        },
        {
          name: 'An eslint config sets settings.next.rootDir',
          skip: skipUnlessNextRootDirApplies,
          check: nextRootDirSet,
          fix: 'Set settings.next.rootDir (import.meta.dirname) in the eslint config enabling the Next plugin: Unset, it falls back to the working directory, and no-html-link-for-pages stops running wherever that holds no pages directory',
          checks: [
            {
              name: 'Every settings.next.rootDir is absolute',
              check: nextRootDirsAbsolute,
              fix: 'Replace each relative settings.next.rootDir with an absolute path (import.meta.dirname): The plugin globs the value against the working directory, so a relative one anchors to wherever eslint was launched',
            },
          ],
        },
      ],
    },
    {
      name: 'tsconfig',
      checks: [
        {
          name: "The repo's tsconfigs permit a TypeScript-extension import",
          skip: skipUnlessTsconfigPresent,
          check: tsExtensionImportsPermitted,
          fix: `Set rewriteRelativeImportExtensions in each tsconfig named, or allowImportingTsExtensions alongside noEmit or emitDeclarationOnly when the config emits nothing. The config requires a relative specifier to name its TypeScript source, which TypeScript rejects without one of them. Migration: ${IMPORT_SPECIFIER_URL}`,
        },
        {
          name: "A tsconfig enumerating an eslint config's siblings names the config itself",
          skip: skipUnlessEnumerated,
          check: eslintConfigEnumerated,
          fix: `Replace the enumeration with a *.ts glob, which also covers any root-level config file added later; appending eslint.config.ts is the narrower fallback. Migration: ${TS_ESLINT_CONFIG_MIGRATION_URL}`,
        },
      ],
    },
    {
      name: 'projectservice',
      checks: [
        {
          name: 'No eslint config sets parserOptions.project',
          severity: 'error',
          check: noLegacyParserProject,
          fix: `Remove parserOptions.project: This config enables projectService, and typescript-eslint throws when both are set. Migration: ${MIGRATION_URL}`,
        },
        {
          name: 'No tsconfig.eslint.json files remain',
          severity: 'recommend',
          check: noTsconfigEslintJson,
          fix: `Fold any lint-only include entries into tsconfig.json and delete tsconfig.eslint.json. Migration: ${MIGRATION_URL}`,
        },
      ],
    },
  ],
});

// region | Helpers

/** Compares a peer dependency's installed version against the floor that this package's peer range sets. */
function checkPeerFloor(name: string): boolean | CheckOutcome {
  const comparison = comparePeerVersions(name);
  return comparison.kind === 'unknown' ? { ok: false, detail: comparison.reason } : judgePeerFloor(comparison);
}

/** Pairs a peer's declared range with its installed version. */
function comparePeerVersions(name: string): PeerComparison {
  return comparePeer({ installed: readInstalledVersion(name), name, owner: PACKAGE_NAME, range: readPeerRange(name) });
}

/** Fails when a tsconfig's enumerated inputs omit an eslint config located among the files that they name. */
function eslintConfigEnumerated(): boolean | CheckOutcome {
  const offenders: string[] = [];
  for (const { configPath, coverage } of listInputJudgements()) {
    if (coverage.kind !== 'enumerated-without') continue;
    const sites = coverage.sites.map((site) => `${site.field} in ${site.declaredIn}`).join(', ');
    offenders.push(`${configPath} (${sites})`);
  }
  if (offenders.length === 0) return true;
  return { ok: false, detail: `an enumeration omits the eslint config: ${offenders.join('; ')}` };
}

/** Lists every eslint config present across the repo's search directories. */
function findEslintConfigs(): string[] {
  return listEslintConfigCandidates(listRepoSearchDirs()).filter((configPath) => fileExists(configPath));
}

/** Resolves the root eslint config as the loader does, taking the first basename in precedence order. */
function findRootEslintConfig(): string | undefined {
  return ESLINT_CONFIG_BASENAMES.find((basename) => fileExists(basename));
}

/** Lists the eslint configs whose content matches the given predicate, skipping any that cannot be read. */
function listEslintConfigsMatching(matches: (content: string) => boolean): string[] {
  return findEslintConfigs().filter((configPath) => {
    const content = readFile(configPath);
    return content !== undefined && matches(content);
  });
}

/** Judges how each eslint config is treated by the inputs of the tsconfig owning it. */
function listInputJudgements(): InputJudgement[] {
  return findEslintConfigs().flatMap((configPath) => {
    const tsconfigPath = findOwningTsconfig(configPath, fileExists);
    if (tsconfigPath === undefined) return [];
    const chain = readChain(tsconfigPath);
    if (chain === undefined) return [];
    return [{ configPath, coverage: judgeInputCoverage(chain.entries, configPath) }];
  });
}

/** Lists the workspace directories providing this package, which the repo developing it imports by path. */
function listProviderWorkspaceDirs(): string[] {
  return discoverWorkspaces()
    .filter((workspace) => workspace.name === PACKAGE_NAME)
    .map((workspace) => workspace.dir);
}

/** Lists the directories in which a repo's configs are: the repo root and every workspace. */
function listRepoSearchDirs(): string[] {
  return listSearchDirs(discoverWorkspaces().map((workspace) => workspace.dir));
}

/**
 * Lists the tsconfigs owning the repo's sources: the one at the root and one per workspace declaring it.
 * A repo containing TypeScript declares at least one, so their absence stands in for a repo with no
 * TypeScript source to measure.
 */
function listRepoTsconfigs(): string[] {
  const declared = listRepoSearchDirs()
    .map((dir) => resolveDirPath(dir, 'tsconfig.json'))
    .filter((candidate) => fileExists(candidate));

  return [...new Set(declared)];
}

/** Fails when an eslint config sets a relative settings.next.rootDir, naming the offenders and their values. */
function nextRootDirsAbsolute(): boolean | CheckOutcome {
  const offenders = findEslintConfigs().flatMap((configPath) => {
    const content = readFile(configPath);
    if (content === undefined) return [];
    const relative = listRelativeNextRootDirs(content);
    return relative.length === 0 ? [] : [`${configPath} (${relative.join(', ')})`];
  });
  if (offenders.length === 0) return true;
  return { ok: false, detail: `settings.next.rootDir is relative in ${offenders.join(', ')}` };
}

/** Fails when an eslint config enables the Next plugin and none sets settings.next.rootDir. */
function nextRootDirSet(): boolean | CheckOutcome {
  const setting = listEslintConfigsMatching(setsNextRootDir);
  if (setting.length > 0) return { ok: true, detail: `settings.next.rootDir is set in ${setting.join(', ')}` };
  const reaching = listEslintConfigsMatching(enablesNextPlugin);
  return {
    ok: false,
    detail: `The Next plugin is enabled in ${reaching.join(', ')} and no eslint config sets settings.next.rootDir`,
  };
}

/** Fails when an eslint config still declares parserOptions.project, naming the offenders. */
function noLegacyParserProject(): boolean | CheckOutcome {
  const offenders = listEslintConfigsMatching(declaresParserProject);
  if (offenders.length === 0) return true;
  return { ok: false, detail: `parserOptions.project found in: ${offenders.join(', ')}` };
}

/** Fails when a JavaScript eslint config shadows a TypeScript one, naming the directories. */
function noShadowedEslintConfig(): boolean | CheckOutcome {
  const dirs = listShadowedEslintConfigDirs(findEslintConfigs());
  if (dirs.length === 0) return true;
  return { ok: false, detail: `a JavaScript config shadows a TypeScript one in: ${dirs.join(', ')}` };
}

/** Fails when a tsconfig.eslint.json remains, naming the offenders. */
function noTsconfigEslintJson(): boolean | CheckOutcome {
  const offenders = listRepoSearchDirs()
    .map((dir) => resolveDirPath(dir, 'tsconfig.eslint.json'))
    .filter((configPath) => fileExists(configPath));
  if (offenders.length === 0) return true;
  return { ok: false, detail: `tsconfig.eslint.json found: ${offenders.join(', ')}` };
}

/** Reads a tsconfig's resolved extends chain, once per path for the life of the run. */
function readChain(tsconfigPath: string): TsconfigChain | undefined {
  if (!tsconfigChains.has(tsconfigPath)) tsconfigChains.set(tsconfigPath, readTsconfigChain(tsconfigPath));
  return tsconfigChains.get(tsconfigPath);
}

/**
 * Reads a dependency's installed version, taking the lowest found across the repo's search
 * directories so that a workspace resolving an older copy decides the comparison. The result is cached
 * for the life of the process, which holds while one `rdy` run targets one project.
 */
function readInstalledVersion(name: string): string | undefined {
  const cached = installedVersions.get(name);
  if (cached !== undefined || installedVersions.has(name)) return cached;

  const versions = listRepoSearchDirs().flatMap((dir) => {
    const manifest = readJsonFile(resolveDirPath(dir, `node_modules/${name}/package.json`));
    const version = manifest === undefined ? undefined : getJsonValue(manifest, 'version');
    return typeof version === 'string' ? [version] : [];
  });
  const lowest = pickLowestVersion(versions);
  installedVersions.set(name, lowest);
  return lowest;
}

/** Reads the peer range that this package declares for a dependency. */
function readPeerRange(name: string): string | undefined {
  const range = getJsonValue(PEER_RANGES, 'peerDependencies', name);
  return typeof range === 'string' ? range : undefined;
}

/**
 * Reports whether the root eslint config extends this package, by package specifier or by a path
 * into a workspace providing it. The repo developing this package imports it by the second route,
 * since importing the specifier there would resolve to a build artifact.
 */
function rootEslintConfigExtendsThisPackage(): boolean | CheckOutcome {
  const basename = findRootEslintConfig();
  if (basename === undefined) return false;

  const content = readFile(basename);
  if (content === undefined) return false;
  if (content.includes(PACKAGE_NAME)) return true;

  const providerDir = listProviderWorkspaceDirs().find((dir) => importsFromDir(content, dir));
  return providerDir !== undefined && { ok: true, detail: `imported by source path from ${providerDir}` };
}

/** Skips the enumeration check when no eslint config's nearest tsconfig covers it or names a TypeScript file beside it. */
function skipUnlessEnumerated(): false | string {
  const judged = listInputJudgements();
  if (judged.some((judgement) => judgement.coverage.kind !== 'not-enumerated')) return false;
  return 'No tsconfig owning an eslint config enumerates a sibling TypeScript file by name';
}

/** Skips the shadowing check below eslint 10, which can load only a JavaScript config. */
function skipUnlessEslintLoadsTypeScript(): false | string {
  return skipBelowTypeScriptConfigSupport(readInstalledVersion('eslint'));
}

/**
 * Skips the next.rootDir checks when no eslint config enables the Next plugin and none sets the
 * value. The trigger is the union of the two, so a config enabling the plugin through a local
 * re-export is still judged on the value that it writes.
 */
function skipUnlessNextRootDirApplies(): false | string {
  if (
    listEslintConfigsMatching(enablesNextPlugin).length > 0 ||
    listEslintConfigsMatching(setsNextRootDir).length > 0
  ) {
    return false;
  }
  return 'No eslint config enables the Next plugin or sets settings.next.rootDir';
}

/** Skips a peer floor check when either side of the comparison is unavailable. */
function skipUnlessPeerComparable(name: string): false | string {
  const comparison = comparePeerVersions(name);
  return comparison.kind !== 'comparable' && comparison.reason;
}

/**
 * Skips the extension-import check when the repo declares no tsconfig, which the kit takes to mean
 * no TypeScript source.
 */
function skipUnlessTsconfigPresent(): false | string {
  return listRepoTsconfigs().length === 0 && 'The repo declares no tsconfig';
}

/** Passes when any eslint config anchors the project service with tsconfigRootDir. */
function tsconfigRootDirAnchored(): boolean | CheckOutcome {
  if (listEslintConfigsMatching(setsTsconfigRootDir).length > 0) return true;
  return { ok: false, detail: 'no eslint config sets parserOptions.tsconfigRootDir' };
}

/** Fails when a tsconfig owning the repo's sources permits no import path ending in a TypeScript extension. */
function tsExtensionImportsPermitted(): boolean | CheckOutcome {
  const offenders = listRepoTsconfigs().filter((tsconfigPath) => {
    const chain = readChain(tsconfigPath);
    return chain !== undefined && !permitsTsExtensionImports(chain.entries);
  });
  if (offenders.length === 0) return true;
  return { ok: false, detail: `no compiler option permits the import under ${offenders.join(', ')}` };
}

// endregion | Helpers
