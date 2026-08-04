/**
 * Maps Node's two native-TypeScript failure modes — syntax type stripping cannot erase, and a TypeScript extension on
 * a runtime where stripping is disabled — to actionable errors, or returns undefined when the error is unrelated and
 * should propagate as-is. The config cascade reaches Node's loader with no runtime pre-check of its own, so an
 * unsupported runtime surfaces here as an unknown extension rather than as a dedicated diagnostic.
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
