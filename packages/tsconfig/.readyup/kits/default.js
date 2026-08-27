/** @noformat — @generated. Do not edit. Compiled by rdy. */
/* eslint-disable */
export const __readyupVersion = "0.33.0";


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
function hasExternalBase(entries) {
  return entries.some((entry) => isExternalBase(entry));
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

// src/readiness/classifyChain.ts
function classifyChain(chain) {
  if (chain.unresolvedExtends.some((unresolved) => isBaseSpecifier(unresolved.specifier))) {
    return { kind: "uninstalled" };
  }
  const baseIndex = findBaseIndex(chain.entries);
  if (baseIndex !== void 0) return { baseIndex, kind: "adopted" };
  return hasExternalBase(chain.entries) ? { kind: "external-base" } : { kind: "unadopted" };
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
  const exempt = collectDependencyDeclaredKeys(entries, baseIndex);
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
function collectDependencyDeclaredKeys(entries, baseIndex) {
  const keys = /* @__PURE__ */ new Set();
  for (const [index, entry] of entries.entries()) {
    if (index === baseIndex || isConsumerOwnedConfig(entry.path)) continue;
    for (const key of Object.keys(entry.compilerOptions)) keys.add(key);
  }
  return keys;
}

// src/readiness/listSearchDirs.ts
function listSearchDirs(workspaceDirs) {
  return [.../* @__PURE__ */ new Set([".", ...workspaceDirs])];
}

// src/readiness/node-floor.ts
var NODE_MAJOR = /^v?(\d+)(?:[.\s]|$)/;
var NODE_MAJOR_CEILING = 99;
function classifyNodeEsYear(major, esYearForMajor) {
  const esYear = esYearForMajor(major);
  if (esYear !== void 0) return { esYear, kind: "exact" };
  const lowestKnown = findLowestKnownMajor(esYearForMajor);
  if (lowestKnown === void 0 || major > lowestKnown) return { kind: "unknown" };
  const lowestEsYear = esYearForMajor(lowestKnown);
  return lowestEsYear === void 0 ? { kind: "unknown" } : { esYear: lowestEsYear, kind: "under" };
}
function findLowestNodeMajor(floors) {
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
function findLowestKnownMajor(esYearForMajor) {
  for (let candidate = 1; candidate <= NODE_MAJOR_CEILING; candidate += 1) {
    if (esYearForMajor(candidate) !== void 0) return candidate;
  }
  return void 0;
}

// .readyup/kits/default.ts
var PACKAGE_NAME = "@williamthorsen/tsconfig";
var BASE_SPECIFIER = `${PACKAGE_NAME}/tsconfig.base.json`;
var ADOPTION_URL = "https://github.com/williamthorsen/eslint-config/tree/main/packages/tsconfig#adopting-the-base";
var NO_BASE_ES_YEAR = `no tsconfig reaches a ${PACKAGE_NAME} base declaring an ES year`;
var NO_NODE_ES_YEAR = "no ES year is known for the declared Node floor";
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
          fix: `Extend ${BASE_SPECIFIER} from each tsconfig named above, and declare ${PACKAGE_NAME} as a devDependency of each package that names it but cannot resolve it. Adoption: ${ADOPTION_URL}`
        },
        {
          name: "No tsconfig re-declares an option the base already supplies",
          severity: "recommend",
          check: noRedundantOptions,
          fix: "Delete each option named above: the base already supplies it with the same value"
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
          skip: skipUnlessNodeFloorComparable,
          check: nodeFloorSupportsBaseEsYear,
          fix: "Raise engines.node to a major implementing the base's ES year: below it, code that typechecks fails at runtime"
        }
      ]
    }
  ]
});
function classifyAdoptions() {
  cache.adoptions ??= findTsconfigs().map((path) => classifyTsconfig(path));
  return cache.adoptions;
}
function classifyTsconfig(path) {
  const chain = readChain(path);
  if (chain === void 0) return { kind: "unadopted", path };
  const classification = classifyChain(chain);
  return classification.kind === "adopted" ? { baseIndex: classification.baseIndex, chain, kind: "adopted", path } : { kind: classification.kind, path };
}
function dedupe(values) {
  return [...new Set(values)];
}
function everyEsYearMatchesTheBase() {
  const baseEsYear = readBaseEsYear();
  if (baseEsYear === void 0) return true;
  const offenders = [];
  for (const adoption of listAdoptedTsconfigs()) {
    for (const entry of adoption.chain.entries.slice(0, adoption.baseIndex)) {
      if (!isConsumerOwnedConfig(entry.path)) continue;
      const declared = readDeclaredEsYear(entry.compilerOptions);
      if (declared !== void 0 && declared !== baseEsYear) offenders.push(`${entry.path} (${declared})`);
    }
  }
  if (offenders.length === 0) return { ok: true, detail: `every tsconfig extending the base is at ${baseEsYear}` };
  return {
    ok: false,
    detail: `the base sets ${baseEsYear}; declared otherwise in: ${dedupe(offenders).join(", ")}`
  };
}
function everyTsconfigAdoptsTheBase() {
  const accountable = classifyAdoptions().filter((adoption) => adoption.kind !== "external-base");
  const adopted = accountable.filter((adoption) => adoption.kind === "adopted");
  const progress = { type: "fraction", passedCount: adopted.length, count: accountable.length };
  const uninstalled = listPathsOfKind(accountable, "uninstalled");
  const unadopted = listPathsOfKind(accountable, "unadopted");
  if (uninstalled.length === 0 && unadopted.length === 0) return { ok: true, progress };
  const details = [
    uninstalled.length > 0 ? `${PACKAGE_NAME} is named but not installed in: ${uninstalled.join(", ")}` : void 0,
    unadopted.length > 0 ? `no extends chain reaches the base from: ${unadopted.join(", ")}` : void 0
  ].filter((detail) => detail !== void 0);
  return { ok: false, detail: details.join("; "), progress };
}
function findTsconfigs() {
  return listTsconfigSearchDirs().map((dir) => resolveDirPath(dir, "tsconfig.json")).filter((path) => fileExists(path));
}
function judgeNodeFloor() {
  const baseEsYear = readBaseEsYear();
  if (baseEsYear === void 0) return { kind: "skip", reason: NO_BASE_ES_YEAR };
  const nodeEsYear = readNodeEsYear();
  if (nodeEsYear === void 0) return { kind: "skip", reason: "no declared Node floor names a major" };
  if (nodeEsYear.kind === "unknown") return { kind: "skip", reason: NO_NODE_ES_YEAR };
  if (nodeEsYear.kind === "under") {
    return isEsYearAtLeast(baseEsYear, nodeEsYear.esYear) ? {
      detail: `the declared Node floor implements less than ${nodeEsYear.esYear}, below the base's ${baseEsYear}`,
      kind: "fail"
    } : { kind: "skip", reason: NO_NODE_ES_YEAR };
  }
  return isEsYearAtLeast(nodeEsYear.esYear, baseEsYear) ? { detail: `the declared Node floor implements ${nodeEsYear.esYear}`, kind: "pass" } : {
    detail: `the declared Node floor implements only ${nodeEsYear.esYear}, below the base's ${baseEsYear}`,
    kind: "fail"
  };
}
function listAdoptedTsconfigs() {
  return classifyAdoptions().filter((adoption) => adoption.kind === "adopted");
}
function listDeclaredNodeFloors() {
  const engineFloors = listTsconfigSearchDirs().flatMap((dir) => {
    const manifest = readJsonFile(resolveDirPath(dir, "package.json"));
    if (manifest === void 0) return [];
    const floor = readEnginesNodeFloor(manifest);
    return floor.kind === "found" ? [floor.floor] : [];
  });
  if (engineFloors.length > 0) return engineFloors;
  const toolVersionsFloor = readToolVersionsNode();
  return toolVersionsFloor === void 0 ? [] : [toolVersionsFloor];
}
function listPathsOfKind(classified, kind) {
  return classified.filter((adoption) => adoption.kind === kind).map((adoption) => adoption.path);
}
function listTsconfigSearchDirs() {
  return listSearchDirs(discoverWorkspaces().map((workspace) => workspace.dir));
}
function nodeFloorSupportsBaseEsYear() {
  const verdict = judgeNodeFloor();
  return verdict.kind === "skip" ? true : { ok: verdict.kind === "pass", detail: verdict.detail };
}
function noRedundantOptions() {
  const offenders = listAdoptedTsconfigs().flatMap(
    (adoption) => findRedundantOptions(adoption.chain.entries, adoption.baseIndex).map(
      (redundant) => `${redundant.path} (${redundant.key})`
    )
  );
  if (offenders.length === 0) return true;
  return { ok: false, detail: `the base already supplies: ${dedupe(offenders).join(", ")}` };
}
function readBaseEsYear() {
  for (const adoption of listAdoptedTsconfigs()) {
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
  const major = findLowestNodeMajor(listDeclaredNodeFloors());
  return major === void 0 ? void 0 : classifyNodeEsYear(major, esYearForNodeMajor);
}
function resolveDirPath(dir, basename) {
  return dir === "." ? basename : `${dir}/${basename}`;
}
function skipUnlessBaseEsYearKnown() {
  return readBaseEsYear() === void 0 ? NO_BASE_ES_YEAR : false;
}
function skipUnlessNodeFloorComparable() {
  const verdict = judgeNodeFloor();
  return verdict.kind === "skip" ? verdict.reason : false;
}
function skipUnlessSomeTsconfigIsAccountable() {
  const classified = classifyAdoptions();
  if (classified.length === 0) return "no workspace tsconfig was found";
  return classified.some((adoption) => adoption.kind !== "external-base") ? false : "every workspace tsconfig extends a base belonging to another package";
}
export {
  default_default as default
};
