// The bundled resolver defaults `extensions` to `['.mjs', '.cjs', '.js', '.json', '.node']` and carries no
// `extensionAlias`, so a specifier ending in `.js` that names a `.ts` file resolves to nothing: the module
// graph loses the edge, and `import-x/extensions` reads the written extension instead of the resolved file's.
// Each alias list ends with the JavaScript extension itself, which is what keeps a genuine JavaScript sibling
// resolvable; the alias replaces the search extension rather than adding to it.
export const importResolverOptions = {
  extensionAlias: {
    '.cjs': ['.cts', '.cjs'],
    '.js': ['.ts', '.tsx', '.js'],
    '.jsx': ['.tsx', '.jsx'],
    '.mjs': ['.mts', '.mjs'],
  },
  extensions: ['.cjs', '.cts', '.js', '.json', '.jsx', '.mjs', '.mts', '.node', '.ts', '.tsx'],
};
