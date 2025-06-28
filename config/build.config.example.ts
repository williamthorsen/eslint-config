/**
 * Build configuration for this workspace.
 *
 * This file specifies which TypeScript files should be compiled by the `configs/build.ts` script.
 * You can use glob patterns to include files and directories.
 */

export const include = [
  'index.ts', //
  'subdir1/**/*.ts',
  'subdir2/**/*.ts',
  'subdir3/file.ts',
];
