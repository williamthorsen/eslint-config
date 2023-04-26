function readPackage(pkg) {
  if (pkg.name === 'yaml-eslint-parser' && pkg.version === '2.1.3') {
    pkg.dependencies = {
      ...pkg.dependencies,
      yaml: '^2.2.2',
    };
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
