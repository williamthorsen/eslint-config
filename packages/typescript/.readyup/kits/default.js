/** @noformat -- @generated. Do not edit. Compiled by rdy. */
/* eslint-disable */
export const __readyupVersion = "0.35.0";


// .readyup/kits/default.ts
import { defineRdyKit } from "readyup";
import {
  compareVersions,
  discoverWorkspaces,
  fileExists,
  getJsonValue,
  readFile,
  readJsonFile,
  readTsconfigChain
} from "readyup/check-utils";

// src/readiness/eslint-config-contents.ts
import { isAbsolute } from "node:path";
function declaresParserProject(content) {
  for (const match of content.matchAll(/parserOptions\s*:\s*\{/g)) {
    if (/\bproject\s*:/.test(extractBraceBlock(content, match.index + match[0].length - 1))) return true;
  }
  return false;
}
function enablesNextPlugin(content) {
  return /createConfig\s*\.\s*next\s*\(/.test(content) || content.includes("@next/eslint-plugin-next");
}
function importsFromDir(content, dir) {
  for (const match of content.matchAll(/\b(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[1]?.replace(/^\.\//, "");
    if (specifier === void 0 || specifier.startsWith("..")) continue;
    if (specifier === dir || specifier.startsWith(`${dir}/`)) return true;
  }
  return false;
}
function listRelativeNextRootDirs(content) {
  return listNextSettingsBlocks(content).flatMap((block) => listRootDirLiterals(block)).filter((value) => !isAbsolute(value));
}
function listTsExtensionImports(content) {
  const specifiers = [];
  for (const match of content.matchAll(
    /\b(?:import|export)\b(?<clause>[^'"]*?)\bfrom\s*['"](?<specifier>[^'"]+)['"]/g
  )) {
    const { clause = "", specifier } = match.groups ?? {};
    if (specifier !== void 0 && !/^\s*type\b/.test(readClauseTail(clause))) specifiers.push(specifier);
  }
  for (const match of content.matchAll(/\b(?:import|require)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (specifier !== void 0) specifiers.push(specifier);
  }
  return [...new Set(specifiers.filter((specifier) => /\.[cm]?ts$/.test(specifier)))];
}
function setsNextRootDir(content) {
  return listNextSettingsBlocks(content).some((block) => /\brootDir\s*:/.test(block));
}
function setsTsconfigRootDir(content) {
  return /tsconfigRootDir\s*:/.test(content);
}
function extractBraceBlock(content, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < content.length; i += 1) {
    if (content[i] === "{") depth += 1;
    else if (content[i] === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(openIndex + 1, i);
    }
  }
  return "";
}
function listNextSettingsBlocks(content) {
  const blocks = [];
  for (const settingsMatch of content.matchAll(/settings\s*:\s*\{/g)) {
    const settings = extractBraceBlock(content, settingsMatch.index + settingsMatch[0].length - 1);
    for (const nextMatch of settings.matchAll(/\bnext\s*:\s*\{/g)) {
      blocks.push(extractBraceBlock(settings, nextMatch.index + nextMatch[0].length - 1));
    }
  }
  return blocks;
}
function listRootDirLiterals(block) {
  const literals = [];
  for (const value of listRootDirValues(block)) {
    const literal = readStringLiteral(value);
    if (literal !== void 0) literals.push(literal);
  }
  return literals;
}
function listRootDirValues(block) {
  const array = /\brootDir\s*:\s*\[([^\]]*)\]/.exec(block);
  if (array !== null) return (array[1] ?? "").split(",");
  const bare = /\brootDir\s*:\s*([^,}]*)/.exec(block);
  return bare?.[1] === void 0 ? [] : [bare[1]];
}
function readClauseTail(clause) {
  const keyword = clause.matchAll(/\b(?:import|export)\b/g).toArray().at(-1);
  return keyword === void 0 ? clause : clause.slice(keyword.index + keyword[0].length);
}
function readStringLiteral(value) {
  const [, quote, literal] = /^\s*(['"`])([^'"`]*)\1\s*$/.exec(value) ?? [];
  if (literal === void 0) return void 0;
  return quote === "`" && literal.includes("${") ? void 0 : literal;
}

// src/readiness/eslint-config-paths.ts
var ESLINT_CONFIG_BASENAMES = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "eslint.config.mts",
  "eslint.config.cts"
];
function isTypeScriptEslintConfig(configPath) {
  return /\.[cm]?ts$/.test(configPath);
}
function listAncestorDirs(dir) {
  const dirs = [];
  let current = dir;
  while (current !== ".") {
    dirs.push(current);
    const slash = current.lastIndexOf("/");
    current = slash === -1 ? "." : current.slice(0, slash);
  }
  dirs.push(".");
  return dirs;
}
function listEslintConfigCandidates(dirs) {
  return dirs.flatMap((dir) => ESLINT_CONFIG_BASENAMES.map((basename) => resolveDirPath(dir, basename)));
}
function listShadowedEslintConfigDirs(eslintConfigPaths) {
  const seen = /* @__PURE__ */ new Map();
  for (const configPath of eslintConfigPaths) {
    const slash = configPath.lastIndexOf("/");
    const dir = slash === -1 ? "." : configPath.slice(0, slash);
    const found = seen.get(dir) ?? { js: false, ts: false };
    if (isTypeScriptEslintConfig(configPath)) found.ts = true;
    else found.js = true;
    seen.set(dir, found);
  }
  return [...seen].filter(([, found]) => found.js && found.ts).map(([dir]) => dir);
}
function resolveDirPath(dir, basename) {
  return dir === "." ? basename : `${dir}/${basename}`;
}

// src/readiness/listSearchDirs.ts
function listSearchDirs(workspaceDirs) {
  return [.../* @__PURE__ */ new Set([".", ...workspaceDirs])];
}

// src/readiness/permitsTsExtensionImports.ts
var PERMITTING_OPTIONS = ["allowImportingTsExtensions", "rewriteRelativeImportExtensions"];
function permitsTsExtensionImports(entries) {
  return PERMITTING_OPTIONS.some((option) => readNearestOption(entries, option) === true);
}
function readNearestOption(entries, option) {
  for (const entry of entries) {
    if (Object.hasOwn(entry.compilerOptions, option)) return entry.compilerOptions[option];
  }
  return void 0;
}

// src/readiness/readVersionFloor.ts
var SINGLE_COMPARATOR = /^(?:>=|\^|~)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;
function readVersionFloor(range) {
  const match = SINGLE_COMPARATOR.exec(range.trim());
  if (match === null) return void 0;
  const [, major, minor, patch] = match;
  return `${major}.${minor ?? "0"}.${patch ?? "0"}`;
}

// src/readiness/tsconfig-inputs.ts
import { dirname, join, relative } from "node:path/posix";
var CONFIG_DIR_TEMPLATE = "${configDir}";
var RECURSIVE_SEGMENT = "\0";
var ROOTED_PATH = /^(?:\/|[A-Za-z]:)/;
var TYPESCRIPT_FILE = /\.[cm]?ts$/;
function judgeInputCoverage(entries, filePath) {
  const judged = entries[0];
  if (judged === void 0) return { kind: "not-enumerated" };
  const judgedDir = dirname(judged.path);
  const target = relative(judgedDir, filePath);
  const targetDir = dirname(target);
  const files = listDeclaredPaths(entries, "files", judgedDir);
  const include = listDeclaredPaths(entries, "include", judgedDir);
  const exclude = listDeclaredPaths(entries, "exclude", judgedDir);
  const excluded = exclude?.paths.some((pattern) => matchesPattern(pattern, target)) === true;
  const covered = files?.paths.includes(target) === true || !excluded && include?.paths.some((pattern) => matchesPattern(pattern, target)) === true;
  if (covered) return { kind: "covered" };
  const sites = [files, include].filter((declared) => declared !== void 0).filter((declared) => declared.paths.some((path) => isSiblingTypeScriptFile(path, targetDir))).map((declared) => ({ declaredIn: declared.declaredIn, field: declared.field }));
  return sites.length > 0 ? { kind: "enumerated-without", sites } : { kind: "not-enumerated" };
}
function escapeSegment(segment) {
  return segment.replaceAll(/[$()*+.?[\\\]^{|}]/g, (char) => {
    if (char === "*") return "[^/]*";
    if (char === "?") return "[^/]";
    return `\\${char}`;
  });
}
function findDeclaringEntry(entries, field) {
  return entries.find((entry) => Array.isArray(entry.config[field]));
}
function isSiblingTypeScriptFile(path, targetDir) {
  if (/[*?]/.test(path) || !TYPESCRIPT_FILE.test(path)) return false;
  return dirname(path) === targetDir;
}
function listDeclaredPaths(entries, field, judgedDir) {
  const declaring = findDeclaringEntry(entries, field);
  if (declaring === void 0) return void 0;
  const declared = declaring.config[field];
  if (!Array.isArray(declared)) return void 0;
  const declaredDir = dirname(declaring.path);
  const paths = declared.filter((value) => typeof value === "string").map((value) => resolveDeclaredPath(value, declaredDir, judgedDir));
  return { declaredIn: declaring.path, field, paths };
}
function matchesPattern(pattern, target) {
  if (pattern === "" || pattern === ".") return true;
  if (!/[*?]/.test(pattern)) return target === pattern || target.startsWith(`${pattern}/`);
  return toPatternRegExp(pattern).test(target);
}
function resolveDeclaredPath(value, declaredDir, judgedDir) {
  const normalized = value.split("\\").join("/");
  if (ROOTED_PATH.test(normalized)) return normalized;
  const resolved = startsWithConfigDir(normalized) ? join(judgedDir, normalized.slice(CONFIG_DIR_TEMPLATE.length)) : join(declaredDir, normalized);
  return relative(judgedDir, resolved);
}
function startsWithConfigDir(value) {
  return value.slice(0, CONFIG_DIR_TEMPLATE.length).toLowerCase() === CONFIG_DIR_TEMPLATE.toLowerCase();
}
function toPatternRegExp(pattern) {
  const source = pattern.split("/").map((segment) => segment === "**" ? RECURSIVE_SEGMENT : escapeSegment(segment)).join("/").replaceAll(`${RECURSIVE_SEGMENT}/`, "(?:[^/]+/)*").replaceAll(RECURSIVE_SEGMENT, ".*");
  return new RegExp(`^${source}$`);
}

// .readyup/kits/default.ts
var PACKAGE_NAME = "@williamthorsen/eslint-config-typescript";
var MIGRATION_URL = `https://github.com/williamthorsen/eslint-config/tree/main/packages/typescript#migrating-from-parseroptionsproject`;
var TS_ESLINT_CONFIG_MIGRATION_URL = `https://github.com/williamthorsen/eslint-config/tree/main/packages/typescript#migrating-eslint-configs-to-typescript`;
var PEER_RANGES = { "peerDependencies": { "@typescript-eslint/utils": "^8.59.1", "eslint": ">=10", "readyup": ">=0.33.0", "typescript": ">=5" } };
var ESLINT_TYPESCRIPT_FLOOR = "10.0.0";
var installedVersions = /* @__PURE__ */ new Map();
var tsconfigChains = /* @__PURE__ */ new Map();
var default_default = defineRdyKit({
  description: `Alignment checks for a project consuming ${PACKAGE_NAME}`,
  defaultSeverity: "warn",
  checklists: [
    {
      name: "peers",
      checks: [
        {
          name: "eslint satisfies the peer range this config declares",
          severity: "error",
          skip: () => skipUnlessPeerComparable("eslint"),
          check: () => checkPeerFloor("eslint"),
          fix: "Upgrade eslint to the version this config requires as a peer"
        },
        {
          name: "typescript satisfies the peer range this config declares",
          severity: "error",
          skip: () => skipUnlessPeerComparable("typescript"),
          check: () => checkPeerFloor("typescript"),
          fix: "Upgrade typescript to the version this config requires as a peer"
        }
      ]
    },
    {
      name: "config",
      checks: [
        {
          name: "A root eslint config exists",
          check: () => findRootEslintConfig() !== void 0,
          fix: `Add eslint.config.ts at the repo root, extending ${PACKAGE_NAME}`,
          checks: [
            {
              name: `The root eslint config extends ${PACKAGE_NAME}`,
              check: rootEslintConfigExtendsThisPackage,
              fix: `Import ${PACKAGE_NAME} in the root eslint config and spread it into the exported config`
            }
          ]
        },
        {
          name: "No JavaScript eslint config shadows a TypeScript one",
          severity: "error",
          skip: skipUnlessEslintLoadsTypeScript,
          check: noShadowedEslintConfig,
          fix: "Delete the JavaScript eslint config sharing a directory with a TypeScript one: the loader resolves the JavaScript basename first, so the TypeScript config never runs"
        },
        {
          name: "An eslint config anchors the project service with tsconfigRootDir",
          check: tsconfigRootDirAnchored,
          fix: "Set parserOptions.tsconfigRootDir (import.meta.dirname) in the root eslint config, so type-aware linting resolves from the repo root rather than the working directory"
        },
        {
          name: "An eslint config sets settings.next.rootDir",
          skip: skipUnlessNextRootDirApplies,
          check: nextRootDirSet,
          fix: "Set settings.next.rootDir (import.meta.dirname) in the eslint config reaching the Next plugin: unset, it falls back to the working directory, and no-html-link-for-pages stops running wherever that holds no pages directory",
          checks: [
            {
              name: "Every settings.next.rootDir is absolute",
              check: nextRootDirsAbsolute,
              fix: "Replace each relative settings.next.rootDir with an absolute path (import.meta.dirname): the plugin globs the value against the working directory, so a relative one anchors to wherever eslint was launched"
            }
          ]
        }
      ]
    },
    {
      name: "tsconfig",
      checks: [
        {
          name: "The tsconfig owning an eslint config permits its TypeScript-extension imports",
          skip: skipUnlessTsExtensionImports,
          check: tsExtensionImportsPermitted,
          fix: `Set allowImportingTsExtensions in the tsconfig owning the eslint config, alongside one of noEmit, emitDeclarationOnly, or rewriteRelativeImportExtensions, one of which TypeScript requires with it. Migration: ${TS_ESLINT_CONFIG_MIGRATION_URL}`
        },
        {
          name: "A tsconfig enumerating an eslint config's siblings names the config itself",
          skip: skipUnlessEnumerated,
          check: eslintConfigEnumerated,
          fix: `Replace the enumeration with a *.ts glob, which carries the next root-level config file to arrive as well; appending eslint.config.ts is the narrower fallback. Migration: ${TS_ESLINT_CONFIG_MIGRATION_URL}`
        }
      ]
    },
    {
      name: "projectservice",
      checks: [
        {
          name: "No eslint config sets parserOptions.project",
          severity: "error",
          check: noLegacyParserProject,
          fix: `Remove parserOptions.project: this config enables projectService, and typescript-eslint throws when both are set. Migration: ${MIGRATION_URL}`
        },
        {
          name: "No tsconfig.eslint.json files remain",
          severity: "recommend",
          check: noTsconfigEslintJson,
          fix: `Fold any lint-only include entries into tsconfig.json and delete tsconfig.eslint.json. Migration: ${MIGRATION_URL}`
        }
      ]
    }
  ]
});
function checkPeerFloor(name) {
  const comparison = comparePeer(name);
  if (comparison.kind === "unknown") return { ok: false, detail: comparison.reason };
  const { floor, installed, range } = comparison;
  return compareVersions(installed, floor) >= 0 ? { ok: true, detail: `${installed} satisfies the ${range} peer range` } : { ok: false, detail: `${installed} is below the ${range} peer range` };
}
function comparePeer(name) {
  const range = readPeerRange(name);
  if (range === void 0) return { kind: "unknown", reason: `${PACKAGE_NAME} declares no ${name} peer` };
  const floor = readVersionFloor(range);
  if (floor === void 0) return { kind: "unknown", reason: `peer range "${range}" names no single floor` };
  const installed = readInstalledVersion(name);
  if (installed === void 0) return { kind: "unknown", reason: `${name} is not installed` };
  return { floor, installed, kind: "comparable", range };
}
function eslintConfigEnumerated() {
  const offenders = [];
  for (const { configPath, coverage } of listInputJudgements()) {
    if (coverage.kind !== "enumerated-without") continue;
    const sites = coverage.sites.map((site) => `${site.field} in ${site.declaredIn}`).join(", ");
    offenders.push(`${configPath} (${sites})`);
  }
  if (offenders.length === 0) return true;
  return { ok: false, detail: `an enumeration omits the eslint config: ${offenders.join("; ")}` };
}
function findEslintConfigs() {
  return listEslintConfigCandidates(listEslintConfigSearchDirs()).filter((configPath) => fileExists(configPath));
}
function findOwningTsconfig(filePath) {
  const slash = filePath.lastIndexOf("/");
  const dir = slash === -1 ? "." : filePath.slice(0, slash);
  return listAncestorDirs(dir).map((ancestor) => resolveDirPath(ancestor, "tsconfig.json")).find((candidate) => fileExists(candidate));
}
function findRootEslintConfig() {
  return ESLINT_CONFIG_BASENAMES.find((basename) => fileExists(basename));
}
function listEslintConfigSearchDirs() {
  return listSearchDirs(discoverWorkspaces().map((workspace) => workspace.dir));
}
function listEslintConfigsMatching(matches) {
  return findEslintConfigs().filter((configPath) => {
    const content = readFile(configPath);
    return content !== void 0 && matches(content);
  });
}
function listInputJudgements() {
  return findEslintConfigs().flatMap((configPath) => {
    const tsconfigPath = findOwningTsconfig(configPath);
    if (tsconfigPath === void 0) return [];
    const chain = readChain(tsconfigPath);
    if (chain === void 0) return [];
    return [{ configPath, coverage: judgeInputCoverage(chain.entries, configPath) }];
  });
}
function listProviderWorkspaceDirs() {
  return discoverWorkspaces().filter((workspace) => workspace.name === PACKAGE_NAME).map((workspace) => workspace.dir);
}
function listTsExtensionImporters() {
  return findEslintConfigs().flatMap((configPath) => {
    const content = readFile(configPath);
    if (content === void 0) return [];
    const specifiers = listTsExtensionImports(content);
    return specifiers.length === 0 ? [] : [{ configPath, specifiers }];
  });
}
function nextRootDirsAbsolute() {
  const offenders = findEslintConfigs().flatMap((configPath) => {
    const content = readFile(configPath);
    if (content === void 0) return [];
    const relative2 = listRelativeNextRootDirs(content);
    return relative2.length === 0 ? [] : [`${configPath} (${relative2.join(", ")})`];
  });
  if (offenders.length === 0) return true;
  return { ok: false, detail: `settings.next.rootDir is relative in ${offenders.join(", ")}` };
}
function nextRootDirSet() {
  const setting = listEslintConfigsMatching(setsNextRootDir);
  if (setting.length > 0) return { ok: true, detail: `settings.next.rootDir is set in ${setting.join(", ")}` };
  const reaching = listEslintConfigsMatching(enablesNextPlugin);
  return {
    ok: false,
    detail: `The Next plugin is reached in ${reaching.join(", ")} and no eslint config sets settings.next.rootDir`
  };
}
function noLegacyParserProject() {
  const offenders = listEslintConfigsMatching(declaresParserProject);
  if (offenders.length === 0) return true;
  return { ok: false, detail: `parserOptions.project found in: ${offenders.join(", ")}` };
}
function noShadowedEslintConfig() {
  const dirs = listShadowedEslintConfigDirs(findEslintConfigs());
  if (dirs.length === 0) return true;
  return { ok: false, detail: `a JavaScript config shadows a TypeScript one in: ${dirs.join(", ")}` };
}
function noTsconfigEslintJson() {
  const offenders = listEslintConfigSearchDirs().map((dir) => resolveDirPath(dir, "tsconfig.eslint.json")).filter((configPath) => fileExists(configPath));
  if (offenders.length === 0) return true;
  return { ok: false, detail: `tsconfig.eslint.json found: ${offenders.join(", ")}` };
}
function readChain(tsconfigPath) {
  if (!tsconfigChains.has(tsconfigPath)) tsconfigChains.set(tsconfigPath, readTsconfigChain(tsconfigPath));
  return tsconfigChains.get(tsconfigPath);
}
function readInstalledVersion(name) {
  const cached = installedVersions.get(name);
  if (cached !== void 0 || installedVersions.has(name)) return cached;
  let lowest;
  for (const dir of listEslintConfigSearchDirs()) {
    const manifest = readJsonFile(resolveDirPath(dir, `node_modules/${name}/package.json`));
    if (manifest === void 0) continue;
    const version = getJsonValue(manifest, "version");
    if (typeof version !== "string") continue;
    if (lowest === void 0 || compareVersions(version, lowest) < 0) lowest = version;
  }
  installedVersions.set(name, lowest);
  return lowest;
}
function readPeerRange(name) {
  const range = getJsonValue(PEER_RANGES, "peerDependencies", name);
  return typeof range === "string" ? range : void 0;
}
function rootEslintConfigExtendsThisPackage() {
  const basename = findRootEslintConfig();
  if (basename === void 0) return false;
  const content = readFile(basename);
  if (content === void 0) return false;
  if (content.includes(PACKAGE_NAME)) return true;
  const providerDir = listProviderWorkspaceDirs().find((dir) => importsFromDir(content, dir));
  return providerDir === void 0 ? false : { ok: true, detail: `reached by source path into ${providerDir}` };
}
function skipUnlessEnumerated() {
  const judged = listInputJudgements();
  if (judged.some((judgement) => judgement.coverage.kind !== "not-enumerated")) return false;
  return "No tsconfig owning an eslint config enumerates a sibling TypeScript file by name";
}
function skipUnlessEslintLoadsTypeScript() {
  const installed = readInstalledVersion("eslint");
  if (installed === void 0) return "eslint is not installed";
  return compareVersions(installed, ESLINT_TYPESCRIPT_FLOOR) >= 0 ? false : "eslint is below 10, which cannot load a TypeScript eslint config";
}
function skipUnlessNextRootDirApplies() {
  if (listEslintConfigsMatching(enablesNextPlugin).length > 0) return false;
  if (listEslintConfigsMatching(setsNextRootDir).length > 0) return false;
  return "No eslint config reaches the Next plugin or sets settings.next.rootDir";
}
function skipUnlessPeerComparable(name) {
  const comparison = comparePeer(name);
  return comparison.kind === "comparable" ? false : comparison.reason;
}
function skipUnlessTsExtensionImports() {
  return listTsExtensionImporters().length > 0 ? false : "No eslint config imports a file by TypeScript extension";
}
function tsconfigRootDirAnchored() {
  if (listEslintConfigsMatching(setsTsconfigRootDir).length > 0) return true;
  return { ok: false, detail: "no eslint config sets parserOptions.tsconfigRootDir" };
}
function tsExtensionImportsPermitted() {
  const offenders = [];
  for (const { configPath, specifiers } of listTsExtensionImporters()) {
    const tsconfigPath = findOwningTsconfig(configPath);
    if (tsconfigPath === void 0) continue;
    const chain = readChain(tsconfigPath);
    if (chain === void 0 || permitsTsExtensionImports(chain.entries)) continue;
    offenders.push(`${configPath} imports ${specifiers.join(", ")} under ${tsconfigPath}`);
  }
  if (offenders.length === 0) return true;
  return { ok: false, detail: `no compiler option permits the import: ${offenders.join("; ")}` };
}
export {
  default_default as default
};
