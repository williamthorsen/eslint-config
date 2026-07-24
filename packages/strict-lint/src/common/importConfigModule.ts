import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TS_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);

/**
 * Loads a config module by path via Node's native loader. TypeScript configs rely on native type stripping (Node >=24)
 * and are loaded erasable-syntax-only; the two native-TS failure modes are mapped to actionable errors.
 * Every other error propagates unchanged.
 */
export async function importConfigModule(filePath: string): Promise<unknown> {
  const isTypeScript = TS_EXTENSIONS.has(path.extname(filePath));

  if (isTypeScript && !process.features.typescript) {
    throw new Error(unsupportedRuntimeMessage(filePath));
  }

  try {
    return await import(pathToFileURL(filePath).href);
  } catch (error: unknown) {
    if (isTypeScript) {
      const actionable = wrapNativeTsError(error, filePath);
      if (actionable) throw actionable;
    }
    throw error;
  }
}

/**
 * Maps Node's two native-TypeScript failure modes — syntax type stripping cannot erase, and a TypeScript extension on
 * a runtime where stripping is disabled — to actionable errors, or returns undefined when the error is unrelated and
 * should propagate as-is. Callers that reach Node's loader without the runtime pre-check above rely on the second
 * mapping.
 * Exported for unit testing, since Vitest transforms TypeScript itself and cannot reproduce native failure in-process.
 * @internal - Exported to allow testing
 */
export function wrapNativeTsError(error: unknown, filePath: string): Error | undefined {
  if (hasErrorCode(error, 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX')) {
    return new Error(unsupportedSyntaxMessage(filePath), { cause: error });
  }
  if (hasErrorCode(error, 'ERR_UNKNOWN_FILE_EXTENSION') && !process.features.typescript) {
    return new Error(unsupportedRuntimeMessage(filePath), { cause: error });
  }
  return undefined;
}

// region | Helpers

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

/** Message for a TypeScript config on a runtime without native type stripping. */
function unsupportedRuntimeMessage(filePath: string): string {
  return `Cannot load the TypeScript config "${filePath}": this Node runtime has no native TypeScript support. Upgrade to Node >=24.`;
}

/** Message for a TypeScript config using syntax that native type stripping cannot erase. */
function unsupportedSyntaxMessage(filePath: string): string {
  return `Cannot load the TypeScript config "${filePath}": it uses syntax Node's native type stripping cannot handle (for example an enum, or a namespace with runtime values). Use erasable TypeScript syntax only.`;
}

// endregion | Helpers
