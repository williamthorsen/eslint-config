/** @noformat — @generated. Do not edit. Compiled by rdy. */
/* eslint-disable */
export const __readyupVersion = "0.25.0";


// .readyup/kits/default.ts
import { defineRdyKit } from "readyup";
import {
  discoverWorkspaces,
  esYearForNodeMajor,
  fileExists,
  readEnginesNodeFloor,
  readJsonFile,
  readToolVersionsNode,
  readTsconfigChain
} from "readyup/check-utils";

// src/readiness/base-chain.ts
var BASE_PACKAGE = "@williamthorsen/tsconfig";
var PATH_SPECIFIER = /^(?:\.{1,2}(?:[/\\]|$)|[/\\]|[A-Za-z]:)/;
function findBaseIndex(entries) {
  const index = entries.findIndex((entry) => entry.specifier !== void 0 && isBaseSpecifier(entry.specifier));
  return index === -1 ? void 0 : index;
}
function findExternalBaseIndexes(entries) {
  return entries.flatMap((entry, index) => isExternalBase(entry) ? [index] : []);
}
function isBaseSpecifier(specifier) {
  return specifier === BASE_PACKAGE || specifier.startsWith(`${BASE_PACKAGE}/`);
}
function isConsumerOwnedConfig(path) {
  return !path.startsWith("../") && !path.split("/").includes("node_modules");
}
function isExternalBase(entry) {
  const { specifier } = entry;
  if (specifier === void 0) return false;
  return !PATH_SPECIFIER.test(specifier) && !isBaseSpecifier(specifier);
}

// src/readiness/es-year.ts
var ES_YEAR = /^es\d{4}$/;
function isEsYearAtLeast(candidate, floor) {
  return candidate >= floor;
}
function parseEsYear(value) {
  const normalized = value.trim().toLowerCase();
  return ES_YEAR.test(normalized) ? normalized : void 0;
}
function readDeclaredEsYear(compilerOptions) {
  const target = compilerOptions["target"];
  const targetYear = typeof target === "string" ? parseEsYear(target) : void 0;
  if (targetYear !== void 0) return targetYear;
  const libYears = toStringArray(compilerOptions["lib"]).flatMap((entry) => {
    const year = parseEsYear(entry);
    return year === void 0 ? [] : [year];
  });
  return libYears.toSorted().at(-1);
}
function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === "string");
}

// src/readiness/findRedundantOptions.ts
import { isDeepStrictEqual } from "node:util";
function findRedundantOptions(entries, baseIndex) {
  const baseOptions = entries[baseIndex]?.compilerOptions;
  if (baseOptions === void 0) return [];
  const exempt = dependencyDeclaredKeys(entries, baseIndex);
  const redundant = [];
  for (const entry of entries.slice(0, baseIndex)) {
    if (!isConsumerOwnedConfig(entry.path)) continue;
    for (const [key, value] of Object.entries(entry.compilerOptions)) {
      if (exempt.has(key) || !Object.hasOwn(baseOptions, key)) continue;
      if (isDeepStrictEqual(value, baseOptions[key])) redundant.push({ key, path: entry.path });
    }
  }
  return redundant;
}
function dependencyDeclaredKeys(entries, baseIndex) {
  const keys = /* @__PURE__ */ new Set();
  for (const [index, entry] of entries.entries()) {
    if (index === baseIndex || isConsumerOwnedConfig(entry.path)) continue;
    for (const key of Object.keys(entry.compilerOptions)) keys.add(key);
  }
  return keys;
}

// src/readiness/node-floor.ts
var NODE_MAJOR = /^v?(\d+)(?:[.\s]|$)/;
function lowestNodeMajor(floors) {
  const majors = floors.flatMap((floor) => {
    const major = readNodeMajor(floor);
    return major === void 0 ? [] : [major];
  });
  return majors.length === 0 ? void 0 : Math.min(...majors);
}
function readNodeMajor(floor) {
  const major = NODE_MAJOR.exec(floor.trim())?.[1];
  return major === void 0 ? void 0 : Number(major);
}

// .readyup/kits/default.ts
var PACKAGE_NAME = "@williamthorsen/tsconfig";
var BASE_SPECIFIER = `${PACKAGE_NAME}/tsconfig.base.json`;
var ADOPTION_URL = "https://github.com/williamthorsen/eslint-config/tree/main/packages/tsconfig#adopting-the-base";
var cache = {
  chains: /* @__PURE__ */ new Map()
};
var default_default = defineRdyKit({
  description: `Adoption and alignment checks for a project consuming ${PACKAGE_NAME}`,
  defaultSeverity: "warn",
  checklists: [
    {
      name: "adoption",
      checks: [
        {
          name: `Every workspace tsconfig extends ${PACKAGE_NAME}`,
          skip: skipUnlessSomeTsconfigIsAccountable,
          check: everyTsconfigAdoptsTheBase,
          fix: `Extend ${BASE_SPECIFIER} from each tsconfig named above. Adoption: ${ADOPTION_URL}`,
          checks: [
            {
              name: "No tsconfig re-declares an option the base already supplies",
              severity: "recommend",
              check: noRedundantOptions,
              fix: "Delete each option named above: the base already supplies it with the same value"
            }
          ]
        }
      ]
    },
    {
      name: "alignment",
      checks: [
        {
          name: `No tsconfig declares an ES year other than the one ${PACKAGE_NAME} sets`,
          skip: skipUnlessBaseEsYearKnown,
          check: everyEsYearMatchesTheBase,
          fix: "Delete the target or lib declaration named above, so the ES year the base sets applies"
        },
        {
          name: "The declared Node floor supports the base's ES year",
          severity: "error",
          skip: skipUnlessNodeEsYearKnown,
          check: nodeFloorSupportsBaseEsYear,
          fix: "Raise engines.node to a major implementing the base's ES year: below it, code that typechecks fails at runtime"
        }
      ]
    }
  ]
});
function adoptedTsconfigs() {
  return classifyAdoptions().filter((adoption) => adoption.kind === "adopted");
}
function classifyAdoptions() {
  cache.adoptions ??= findTsconfigs().map((path) => classifyTsconfig(path));
  return cache.adoptions;
}
function classifyTsconfig(path) {
  const chain = readChain(path);
  if (chain === void 0) return { kind: "unadopted", path };
  if (chain.unresolvedExtends.some((unresolved) => isBaseSpecifier(unresolved.specifier))) {
    return { kind: "uninstalled", path };
  }
  const baseIndex = findBaseIndex(chain.entries);
  if (baseIndex !== void 0) return { baseIndex, chain, kind: "adopted", path };
  return findExternalBaseIndexes(chain.entries).length > 0 ? { kind: "external-base", path } : { kind: "unadopted", path };
}
function declaredNodeFloors() {
  const engineFloors = tsconfigSearchDirs().flatMap((dir) => {
    const manifest = readJsonFile(dirPath(dir, "package.json"));
    if (manifest === void 0) return [];
    const floor = readEnginesNodeFloor(manifest);
    return floor.kind === "found" ? [floor.floor] : [];
  });
  if (engineFloors.length > 0) return engineFloors;
  const toolVersionsFloor = readToolVersionsNode();
  return toolVersionsFloor === void 0 ? [] : [toolVersionsFloor];
}
function dedupe(values) {
  return [...new Set(values)];
}
function dirPath(dir, basename) {
  return dir === "." ? basename : `${dir}/${basename}`;
}
function everyEsYearMatchesTheBase() {
  const baseEsYear = readBaseEsYear();
  if (baseEsYear === void 0) return true;
  const offenders = [];
  for (const adoption of adoptedTsconfigs()) {
    for (const entry of adoption.chain.entries.slice(0, adoption.baseIndex)) {
      if (!isConsumerOwnedConfig(entry.path)) continue;
      const declared = readDeclaredEsYear(entry.compilerOptions);
      if (declared !== void 0 && declared !== baseEsYear) offenders.push(`${entry.path} (${declared})`);
    }
  }
  if (offenders.length === 0) return { ok: true, detail: `every tsconfig is at ${baseEsYear}` };
  return {
    ok: false,
    detail: `the base sets ${baseEsYear}; declared otherwise in: ${dedupe(offenders).join(", ")}`
  };
}
function everyTsconfigAdoptsTheBase() {
  const accountable = classifyAdoptions().filter((adoption) => adoption.kind !== "external-base");
  const adopted = accountable.filter((adoption) => adoption.kind === "adopted");
  const progress = { type: "fraction", passedCount: adopted.length, count: accountable.length };
  const uninstalled = pathsOfKind(accountable, "uninstalled");
  const unadopted = pathsOfKind(accountable, "unadopted");
  if (uninstalled.length === 0 && unadopted.length === 0) return { ok: true, progress };
  const details = [
    uninstalled.length > 0 ? `${PACKAGE_NAME} is named but not installed in: ${uninstalled.join(", ")}` : void 0,
    unadopted.length > 0 ? `no extends chain reaches the base from: ${unadopted.join(", ")}` : void 0
  ].filter((detail) => detail !== void 0);
  return { ok: false, detail: details.join("; "), progress };
}
function findTsconfigs() {
  return tsconfigSearchDirs().map((dir) => dirPath(dir, "tsconfig.json")).filter((path) => fileExists(path));
}
function nodeFloorSupportsBaseEsYear() {
  const baseEsYear = readBaseEsYear();
  const nodeEsYear = readNodeEsYear();
  if (baseEsYear === void 0 || nodeEsYear === void 0) return true;
  return isEsYearAtLeast(nodeEsYear, baseEsYear) ? { ok: true, detail: `the declared Node floor implements ${nodeEsYear}` } : { ok: false, detail: `the declared Node floor implements only ${nodeEsYear}, below the base's ${baseEsYear}` };
}
function noRedundantOptions() {
  const offenders = adoptedTsconfigs().flatMap(
    (adoption) => findRedundantOptions(adoption.chain.entries, adoption.baseIndex).map(
      (redundant) => `${redundant.path} (${redundant.key})`
    )
  );
  if (offenders.length === 0) return true;
  return { ok: false, detail: `the base already supplies: ${dedupe(offenders).join(", ")}` };
}
function pathsOfKind(classified, kind) {
  return classified.filter((adoption) => adoption.kind === kind).map((adoption) => adoption.path);
}
function readBaseEsYear() {
  for (const adoption of adoptedTsconfigs()) {
    const baseOptions = adoption.chain.entries[adoption.baseIndex]?.compilerOptions;
    const esYear = baseOptions === void 0 ? void 0 : readDeclaredEsYear(baseOptions);
    if (esYear !== void 0) return esYear;
  }
  return void 0;
}
function readChain(path) {
  if (!cache.chains.has(path)) cache.chains.set(path, readTsconfigChain(path));
  return cache.chains.get(path);
}
function readNodeEsYear() {
  const major = lowestNodeMajor(declaredNodeFloors());
  return major === void 0 ? void 0 : esYearForNodeMajor(major);
}
function skipUnlessBaseEsYearKnown() {
  return readBaseEsYear() === void 0 ? `no tsconfig reaches a ${PACKAGE_NAME} base declaring an ES year` : false;
}
function skipUnlessNodeEsYearKnown() {
  const baseSkip = skipUnlessBaseEsYearKnown();
  if (baseSkip !== false) return baseSkip;
  return readNodeEsYear() === void 0 ? "no declared Node floor names a major with a known ES year" : false;
}
function skipUnlessSomeTsconfigIsAccountable() {
  const classified = classifyAdoptions();
  if (classified.length === 0) return "no workspace tsconfig was found";
  return classified.some((adoption) => adoption.kind !== "external-base") ? false : "every workspace tsconfig extends a base belonging to another package";
}
function tsconfigSearchDirs() {
  cache.searchDirs ??= [.../* @__PURE__ */ new Set([".", ...discoverWorkspaces().map((workspace) => workspace.dir)])];
  return cache.searchDirs;
}
export {
  default_default as default
};
