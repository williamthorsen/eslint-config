/**
 * Readiness checks for a project consuming @williamthorsen/eslint-config-typescript.
 *
 * The kit ships inside the package, so it always runs at the version the consumer has installed.
 * That is what it asserts: whether the surrounding configuration is wired correctly for this
 * version, never whether the version itself is current. Prompting an upgrade needs a kit that
 * outlives the version being replaced, which a package-hosted kit cannot be.
 *
 * `error` is reserved for a failure that stops ESLint loading or running the config. Everything
 * else caps at `warn`: these checks are a migration aid, not a gate.
 */
import { type CheckOutcome, defineRdyKit, pickJson } from 'readyup';
import {
  compareVersions,
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
  listTsExtensionImports,
  setsNextRootDir,
  setsTsconfigRootDir,
} from '../../src/readiness/eslint-config-contents.ts';
import {
  ESLINT_CONFIG_BASENAMES,
  listAncestorDirs,
  listEslintConfigCandidates,
  listShadowedEslintConfigDirs,
  resolveDirPath,
} from '../../src/readiness/eslint-config-paths.ts';
import { listSearchDirs } from '../../src/readiness/listSearchDirs.ts';
import { permitsTsExtensionImports } from '../../src/readiness/permitsTsExtensionImports.ts';
import { readVersionFloor } from '../../src/readiness/readVersionFloor.ts';
import { type InputCoverage, judgeInputCoverage } from '../../src/readiness/tsconfig-inputs.ts';

const PACKAGE_NAME = '@williamthorsen/eslint-config-typescript';
const MIGRATION_URL = `https://github.com/williamthorsen/eslint-config/tree/main/packages/typescript#migrating-from-parseroptionsproject`;
const TS_ESLINT_CONFIG_MIGRATION_URL = `https://github.com/williamthorsen/eslint-config/tree/main/packages/typescript#migrating-eslint-configs-to-typescript`;

// Inlined at compile time, so the floors track the package's own peer ranges instead of a copy.
const PEER_RANGES = pickJson('../../package.json', ['peerDependencies']);

// The first eslint major that loads a TypeScript config, below which a shadowed config is expected.
const ESLINT_TYPESCRIPT_FLOOR = '10.0.0';

type PeerComparison =
  { floor: string; installed: string; kind: 'comparable'; range: string } | { kind: 'unknown'; reason: string };

interface InputJudgement {
  configPath: string;
  coverage: InputCoverage;
}

interface TsExtensionImporter {
  configPath: string;
  specifiers: string[];
}

const installedVersions = new Map<string, string | undefined>();

// Held for the life of one `rdy` run, so several eslint configs owned by one tsconfig read it once.
const tsconfigChains = new Map<string, TsconfigChain | undefined>();

export default defineRdyKit({
  description: `Alignment checks for a project consuming ${PACKAGE_NAME}`,
  defaultSeverity: 'warn',
  checklists: [
    {
      name: 'peers',
      checks: [
        {
          name: 'eslint satisfies the peer range this config declares',
          severity: 'error',
          skip: () => skipUnlessPeerComparable('eslint'),
          check: () => checkPeerFloor('eslint'),
          fix: 'Upgrade eslint to the version this config requires as a peer',
        },
        {
          name: 'typescript satisfies the peer range this config declares',
          severity: 'error',
          skip: () => skipUnlessPeerComparable('typescript'),
          check: () => checkPeerFloor('typescript'),
          fix: 'Upgrade typescript to the version this config requires as a peer',
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
          fix: 'Delete the JavaScript eslint config sharing a directory with a TypeScript one: the loader resolves the JavaScript basename first, so the TypeScript config never runs',
        },
        {
          name: 'An eslint config anchors the project service with tsconfigRootDir',
          check: tsconfigRootDirAnchored,
          fix: 'Set parserOptions.tsconfigRootDir (import.meta.dirname) in the root eslint config, so type-aware linting resolves from the repo root rather than the working directory',
        },
        {
          name: 'An eslint config sets settings.next.rootDir',
          skip: skipUnlessNextRootDirApplies,
          check: nextRootDirSet,
          fix: 'Set settings.next.rootDir (import.meta.dirname) in the eslint config reaching the Next plugin: unset, it falls back to the working directory, and no-html-link-for-pages stops running wherever that holds no pages directory',
          checks: [
            {
              name: 'Every settings.next.rootDir is absolute',
              check: nextRootDirsAbsolute,
              fix: 'Replace each relative settings.next.rootDir with an absolute path (import.meta.dirname): the plugin globs the value against the working directory, so a relative one anchors to wherever eslint was launched',
            },
          ],
        },
      ],
    },
    {
      name: 'tsconfig',
      checks: [
        {
          name: 'The tsconfig owning an eslint config permits its TypeScript-extension imports',
          skip: skipUnlessTsExtensionImports,
          check: tsExtensionImportsPermitted,
          fix: `Set allowImportingTsExtensions in the tsconfig owning the eslint config, alongside one of noEmit, emitDeclarationOnly, or rewriteRelativeImportExtensions, one of which TypeScript requires with it. Migration: ${TS_ESLINT_CONFIG_MIGRATION_URL}`,
        },
        {
          name: "A tsconfig enumerating an eslint config's siblings names the config itself",
          skip: skipUnlessEnumerated,
          check: eslintConfigEnumerated,
          fix: `Replace the enumeration with a *.ts glob, which carries the next root-level config file to arrive as well; appending eslint.config.ts is the narrower fallback. Migration: ${TS_ESLINT_CONFIG_MIGRATION_URL}`,
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
          fix: `Remove parserOptions.project: this config enables projectService, and typescript-eslint throws when both are set. Migration: ${MIGRATION_URL}`,
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

/** Compares a peer dependency's installed version against the floor this package's peer range sets. */
function checkPeerFloor(name: string): boolean | CheckOutcome {
  const comparison = comparePeer(name);
  if (comparison.kind === 'unknown') return { ok: false, detail: comparison.reason };
  const { floor, installed, range } = comparison;
  return compareVersions(installed, floor) >= 0
    ? { ok: true, detail: `${installed} satisfies the ${range} peer range` }
    : { ok: false, detail: `${installed} is below the ${range} peer range` };
}

/** Resolves the two versions a peer floor check compares, or the reason they cannot be compared. */
function comparePeer(name: string): PeerComparison {
  const range = readPeerRange(name);
  if (range === undefined) return { kind: 'unknown', reason: `${PACKAGE_NAME} declares no ${name} peer` };

  const floor = readVersionFloor(range);
  if (floor === undefined) return { kind: 'unknown', reason: `peer range "${range}" names no single floor` };

  const installed = readInstalledVersion(name);
  if (installed === undefined) return { kind: 'unknown', reason: `${name} is not installed` };

  return { floor, installed, kind: 'comparable', range };
}

/** Fails when a tsconfig's enumerated inputs omit an eslint config sitting among the files they name. */
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
  return listEslintConfigCandidates(listEslintConfigSearchDirs()).filter((configPath) => fileExists(configPath));
}

/**
 * Finds the tsconfig owning a file, which is the nearest `tsconfig.json` at or above its directory.
 * That is the config the project service resolves; a sibling under another basename owns nothing.
 */
function findOwningTsconfig(filePath: string): string | undefined {
  const slash = filePath.lastIndexOf('/');
  const dir = slash === -1 ? '.' : filePath.slice(0, slash);
  return listAncestorDirs(dir)
    .map((ancestor) => resolveDirPath(ancestor, 'tsconfig.json'))
    .find((candidate) => fileExists(candidate));
}

/** Resolves the root eslint config as the loader does, taking the first basename in precedence order. */
function findRootEslintConfig(): string | undefined {
  return ESLINT_CONFIG_BASENAMES.find((basename) => fileExists(basename));
}

/** Lists the directories that may hold an eslint config: the repo root and every workspace. */
function listEslintConfigSearchDirs(): string[] {
  return listSearchDirs(discoverWorkspaces().map((workspace) => workspace.dir));
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
    const tsconfigPath = findOwningTsconfig(configPath);
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

/** Lists the eslint configs importing a file by TypeScript extension, with the specifiers they name. */
function listTsExtensionImporters(): TsExtensionImporter[] {
  return findEslintConfigs().flatMap((configPath) => {
    const content = readFile(configPath);
    if (content === undefined) return [];
    const specifiers = listTsExtensionImports(content);
    return specifiers.length === 0 ? [] : [{ configPath, specifiers }];
  });
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

/** Fails when an eslint config reaches the Next plugin and none sets settings.next.rootDir. */
function nextRootDirSet(): boolean | CheckOutcome {
  const setting = listEslintConfigsMatching(setsNextRootDir);
  if (setting.length > 0) return { ok: true, detail: `settings.next.rootDir is set in ${setting.join(', ')}` };
  const reaching = listEslintConfigsMatching(enablesNextPlugin);
  return {
    ok: false,
    detail: `The Next plugin is reached in ${reaching.join(', ')} and no eslint config sets settings.next.rootDir`,
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
  const offenders = listEslintConfigSearchDirs()
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
 * directories so a workspace resolving an older copy decides the comparison. The result is cached
 * for the life of the process, which holds while one `rdy` run targets one project.
 */
function readInstalledVersion(name: string): string | undefined {
  const cached = installedVersions.get(name);
  if (cached !== undefined || installedVersions.has(name)) return cached;

  let lowest: string | undefined;
  for (const dir of listEslintConfigSearchDirs()) {
    const manifest = readJsonFile(resolveDirPath(dir, `node_modules/${name}/package.json`));
    if (manifest === undefined) continue;
    const version = getJsonValue(manifest, 'version');
    if (typeof version !== 'string') continue;
    if (lowest === undefined || compareVersions(version, lowest) < 0) lowest = version;
  }
  installedVersions.set(name, lowest);
  return lowest;
}

/** Reads the peer range this package declares for a dependency. */
function readPeerRange(name: string): string | undefined {
  const range = getJsonValue(PEER_RANGES, 'peerDependencies', name);
  return typeof range === 'string' ? range : undefined;
}

/**
 * Reports whether the root eslint config extends this package, by package specifier or by a path
 * into a workspace providing it. The second route is how the repo developing this package reaches
 * it, since importing the specifier there would resolve to a build artifact.
 */
function rootEslintConfigExtendsThisPackage(): boolean | CheckOutcome {
  const basename = findRootEslintConfig();
  if (basename === undefined) return false;

  const content = readFile(basename);
  if (content === undefined) return false;
  if (content.includes(PACKAGE_NAME)) return true;

  const providerDir = listProviderWorkspaceDirs().find((dir) => importsFromDir(content, dir));
  return providerDir === undefined ? false : { ok: true, detail: `reached by source path into ${providerDir}` };
}

/**
 * Skips the enumeration check where no tsconfig owning an eslint config enumerates a sibling
 * TypeScript file, whether it declares no inputs at all or its declared inputs name none. A root
 * declaring `files: []` alongside `references`, or a project reached through `allowDefaultProject`,
 * covers the config by a route its own inputs do not show.
 */
function skipUnlessEnumerated(): false | string {
  const judged = listInputJudgements();
  if (judged.some((judgement) => judgement.coverage.kind !== 'not-enumerated')) return false;
  return 'No tsconfig owning an eslint config enumerates a sibling TypeScript file by name';
}

/** Skips the shadowing check below eslint 10, where a JavaScript config is the only loadable one. */
function skipUnlessEslintLoadsTypeScript(): false | string {
  const installed = readInstalledVersion('eslint');
  if (installed === undefined) return 'eslint is not installed';
  return compareVersions(installed, ESLINT_TYPESCRIPT_FLOOR) >= 0
    ? false
    : 'eslint is below 10, which cannot load a TypeScript eslint config';
}

/**
 * Skips the next.rootDir checks where no eslint config reaches the Next plugin and none sets the
 * value. The trigger is the union of the two, so a config reaching the plugin through a local
 * re-export is still judged on the value it writes.
 */
function skipUnlessNextRootDirApplies(): false | string {
  if (listEslintConfigsMatching(enablesNextPlugin).length > 0) return false;
  if (listEslintConfigsMatching(setsNextRootDir).length > 0) return false;
  return 'No eslint config reaches the Next plugin or sets settings.next.rootDir';
}

/** Skips a peer floor check when either side of the comparison is unavailable. */
function skipUnlessPeerComparable(name: string): false | string {
  const comparison = comparePeer(name);
  return comparison.kind === 'comparable' ? false : comparison.reason;
}

/** Skips the extension-import check where no eslint config imports a file by TypeScript extension. */
function skipUnlessTsExtensionImports(): false | string {
  return listTsExtensionImporters().length > 0 ? false : 'No eslint config imports a file by TypeScript extension';
}

/** Passes when any eslint config anchors the project service with tsconfigRootDir. */
function tsconfigRootDirAnchored(): boolean | CheckOutcome {
  if (listEslintConfigsMatching(setsTsconfigRootDir).length > 0) return true;
  return { ok: false, detail: 'no eslint config sets parserOptions.tsconfigRootDir' };
}

/** Fails when a tsconfig owning an eslint config permits none of the TypeScript extensions it imports. */
function tsExtensionImportsPermitted(): boolean | CheckOutcome {
  const offenders: string[] = [];
  for (const { configPath, specifiers } of listTsExtensionImporters()) {
    const tsconfigPath = findOwningTsconfig(configPath);
    if (tsconfigPath === undefined) continue;
    const chain = readChain(tsconfigPath);
    if (chain === undefined || permitsTsExtensionImports(chain.entries)) continue;
    offenders.push(`${configPath} imports ${specifiers.join(', ')} under ${tsconfigPath}`);
  }
  if (offenders.length === 0) return true;
  return { ok: false, detail: `no compiler option permits the import: ${offenders.join('; ')}` };
}

// endregion | Helpers
