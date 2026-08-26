// Anchors the default project. TypeScript rejects a `tsconfig.json` matching no input, and the rule tester names this
// one as its `defaultProject`, so the config needs a file to include even though no test reads this one.
export {};
