export const javaScriptExtensions = ['{js,cjs,mjs,jsx}'];
export const typeScriptExtensions = ['{ts,cts,mts,tsx}'];
export const codeExtensions = [...javaScriptExtensions, ...typeScriptExtensions];

export const javaScriptFiles = javaScriptExtensions.map((ext) => `**/*.${ext}`);
export const typeScriptFiles = typeScriptExtensions.map((ext) => `**/*.${ext}`);
export const codeFiles = codeExtensions.map((ext) => `**/*.${ext}`);
export const testFiles = codeExtensions.map((ext) => `**/*.{spec,test}.${ext}`);

export const patterns = {
  codeExtensions,
  codeFiles,
  javaScriptExtensions,
  javaScriptFiles,
  testFiles,
  typeScriptExtensions,
  typeScriptFiles,
};
