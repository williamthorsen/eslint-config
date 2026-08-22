/** @noformat — @generated. Do not edit. Compiled by rdy. */
/* eslint-disable */
export const __readyupVersion = "0.31.0";


// .readyup/kits/default.ts
import { defineRdyKit } from "readyup";
import {
  compareVersions,
  discoverWorkspaces,
  fileExists,
  getJsonValue,
  readFile,
  readJsonFile
} from "readyup/check-utils";

// src/readiness/eslint-config-contents.ts
function declaresParserProject(content) {
  for (const match of content.matchAll(/parserOptions\s*:\s*\{/g)) {
    if (/\bproject\s*:/.test(braceBlock(content, match.index + match[0].length - 1))) return true;
  }
  return false;
}
function importsFromDir(content, dir) {
  for (const match of content.matchAll(/\b(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g)) {
    const specifier = match[1]?.replace(/^\.\//, "");
    if (specifier === void 0 || specifier.startsWith("..")) continue;
    if (specifier === dir || specifier.startsWith(`${dir}/`)) return true;
  }
  return false;
}
function setsTsconfigRootDir(content) {
  return /tsconfigRootDir\s*:/.test(content);
}
function braceBlock(content, openIndex) {
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

// src/readiness/eslint-config-paths.ts
function dirPath(dir, basename) {
  return dir === "." ? basename : `${dir}/${basename}`;
}
var ESLINT_CONFIG_BASENAMES = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "eslint.config.mts",
  "eslint.config.cts"
];
function eslintConfigCandidates(dirs) {
  return dirs.flatMap((dir) => ESLINT_CONFIG_BASENAMES.map((basename) => dirPath(dir, basename)));
}
function isTypeScriptEslintConfig(configPath) {
  return /\.[cm]?ts$/.test(configPath);
}
function shadowedEslintConfigDirs(eslintConfigPaths) {
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

// src/readiness/readVersionFloor.ts
var SINGLE_COMPARATOR = /^(?:>=|\^|~)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;
function readVersionFloor(range) {
  const match = SINGLE_COMPARATOR.exec(range.trim());
  if (match === null) return void 0;
  const [, major, minor, patch] = match;
  return `${major}.${minor ?? "0"}.${patch ?? "0"}`;
}

// .readyup/kits/default.ts
var PACKAGE_NAME = "@williamthorsen/eslint-config-typescript";
var MIGRATION_URL = `https://github.com/williamthorsen/eslint-config/tree/main/packages/typescript#migrating-from-parseroptionsproject`;
var PEER_RANGES = { "peerDependencies": { "@typescript-eslint/utils": "^8.59.1", "eslint": ">=10", "typescript": ">=5" } };
var ESLINT_TYPESCRIPT_FLOOR = "10.0.0";
var installedVersions = /* @__PURE__ */ new Map();
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
function eslintConfigSearchDirs() {
  return [.../* @__PURE__ */ new Set([".", ...discoverWorkspaces().map((workspace) => workspace.dir)])];
}
function findEslintConfigs() {
  return eslintConfigCandidates(eslintConfigSearchDirs()).filter((configPath) => fileExists(configPath));
}
function findRootEslintConfig() {
  return ESLINT_CONFIG_BASENAMES.find((basename) => fileExists(basename));
}
function noLegacyParserProject() {
  const offenders = findEslintConfigs().filter((configPath) => {
    const content = readFile(configPath);
    return content !== void 0 && declaresParserProject(content);
  });
  if (offenders.length === 0) return true;
  return { ok: false, detail: `parserOptions.project found in: ${offenders.join(", ")}` };
}
function noShadowedEslintConfig() {
  const dirs = shadowedEslintConfigDirs(findEslintConfigs());
  if (dirs.length === 0) return true;
  return { ok: false, detail: `a JavaScript config shadows a TypeScript one in: ${dirs.join(", ")}` };
}
function noTsconfigEslintJson() {
  const offenders = eslintConfigSearchDirs().map((dir) => dirPath(dir, "tsconfig.eslint.json")).filter((configPath) => fileExists(configPath));
  if (offenders.length === 0) return true;
  return { ok: false, detail: `tsconfig.eslint.json found: ${offenders.join(", ")}` };
}
function providerWorkspaceDirs() {
  return discoverWorkspaces().filter((workspace) => workspace.name === PACKAGE_NAME).map((workspace) => workspace.dir);
}
function readInstalledVersion(name) {
  const cached = installedVersions.get(name);
  if (cached !== void 0 || installedVersions.has(name)) return cached;
  let lowest;
  for (const dir of eslintConfigSearchDirs()) {
    const manifest = readJsonFile(dirPath(dir, `node_modules/${name}/package.json`));
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
  const providerDir = providerWorkspaceDirs().find((dir) => importsFromDir(content, dir));
  return providerDir === void 0 ? false : { ok: true, detail: `reached by source path into ${providerDir}` };
}
function skipUnlessEslintLoadsTypeScript() {
  const installed = readInstalledVersion("eslint");
  if (installed === void 0) return "eslint is not installed";
  return compareVersions(installed, ESLINT_TYPESCRIPT_FLOOR) >= 0 ? false : "eslint is below 10, which cannot load a TypeScript eslint config";
}
function skipUnlessPeerComparable(name) {
  const comparison = comparePeer(name);
  return comparison.kind === "comparable" ? false : comparison.reason;
}
function tsconfigRootDirAnchored() {
  const anchored = findEslintConfigs().some((configPath) => {
    const content = readFile(configPath);
    return content !== void 0 && setsTsconfigRootDir(content);
  });
  if (anchored) return true;
  return { ok: false, detail: "no eslint config sets parserOptions.tsconfigRootDir" };
}
export {
  default_default as default
};
