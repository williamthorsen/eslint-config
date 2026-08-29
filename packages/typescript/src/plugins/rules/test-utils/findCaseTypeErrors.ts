import path from 'node:path';

import ts from 'typescript';

const fixtureDir = path.join(import.meta.dirname, '../../../../__fixtures__/rules');
const fixtureConfigPath = path.join(fixtureDir, 'tsconfig.json');

// A case is a script, so a program holding several of them merges their top-level declarations and reports collisions
// no case has on its own. The appended export makes each case a module with a scope of its own.
const MODULE_SUFFIX = '\nexport {};';

// Parsing the fixture's libs costs an order of magnitude more than checking the cases, and every program a worker
// builds reads the same ones under the same options.
const parsedLibraryFiles = new Map<string, ts.SourceFile | undefined>();

export interface RuleTestCase {
  code: string;
  label: string;
}

export interface CaseTypeError {
  code: string;
  label: string;
  messages: string[];
}

// Compiles each case under the rule fixture's `compilerOptions` and reports the ones that do not typecheck.
export function findCaseTypeErrors(cases: readonly RuleTestCase[]): CaseTypeError[] {
  if (cases.length === 0) {
    return [];
  }

  const options = { ...readFixtureCompilerOptions(), noEmit: true };
  const sources = new Map<string, RuleTestCase>();
  for (const [index, testCase] of cases.entries()) {
    sources.set(path.join(fixtureDir, `case-${index}.ts`), testCase);
  }

  const program = ts.createProgram(sources.keys().toArray(), options, createCompilerHost(options, sources));

  const setup = [...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics()];
  if (setup.length > 0) {
    throw new Error(
      `Typechecking the rule-tester cases reported errors of its own:\n${setup.map(toMessage).join('\n')}`,
    );
  }

  const errors: CaseTypeError[] = [];
  for (const [fileName, testCase] of sources) {
    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile === undefined) {
      throw new Error(`Typechecking the rule-tester cases did not reach ${testCase.label}.`);
    }

    // Asking per file rather than for the whole program keeps the fixture's libs out of the check, which dominates it.
    const diagnostics = [...program.getSyntacticDiagnostics(sourceFile), ...program.getSemanticDiagnostics(sourceFile)];
    if (diagnostics.length > 0) {
      errors.push({ code: testCase.code, label: testCase.label, messages: diagnostics.map(toMessage) });
    }
  }

  return errors;
}

// region | Helpers

// Builds a host serving the cases from memory and everything else, the fixture's libs included, from disk.
function createCompilerHost(options: ts.CompilerOptions, sources: ReadonlyMap<string, RuleTestCase>): ts.CompilerHost {
  const host = ts.createCompilerHost(options);
  const fileExists = host.fileExists.bind(host);
  const getSourceFile = host.getSourceFile.bind(host);
  const readFile = host.readFile.bind(host);

  host.fileExists = (fileName) => sources.has(fileName) || fileExists(fileName);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const testCase = sources.get(fileName);
    if (testCase !== undefined) {
      return ts.createSourceFile(fileName, testCase.code + MODULE_SUFFIX, languageVersion, false, ts.ScriptKind.TS);
    }
    if (!parsedLibraryFiles.has(fileName)) {
      parsedLibraryFiles.set(fileName, getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile));
    }
    return parsedLibraryFiles.get(fileName);
  };
  host.readFile = (fileName) => {
    const testCase = sources.get(fileName);
    return testCase === undefined ? readFile(fileName) : testCase.code + MODULE_SUFFIX;
  };

  return host;
}

// Reads the options the rule tester's default project runs under, so a change to the fixture reaches the cases.
function readFixtureCompilerOptions(): ts.CompilerOptions {
  const configFile = ts.readConfigFile(fixtureConfigPath, (fileName) => ts.sys.readFile(fileName));
  if (configFile.error) {
    throw new Error(
      `Could not read ${fixtureConfigPath}: ${ts.flattenDiagnosticMessageText(configFile.error.messageText, ' ')}`,
    );
  }

  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, fixtureDir);
  if (parsed.errors.length > 0) {
    const messages = parsed.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, ' '));
    throw new Error(`Could not parse ${fixtureConfigPath}:\n${messages.join('\n')}`);
  }

  return parsed.options;
}

// Renders a diagnostic as a single line led by its TypeScript error code.
function toMessage(diagnostic: ts.Diagnostic): string {
  return `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`;
}

// endregion | Helpers
