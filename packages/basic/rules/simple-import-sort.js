export default {
  'simple-import-sort/exports': 'warn',
  'simple-import-sort/imports': [
    'warn',
    {
      groups: [
        ['^node:'], // built-ins
        [String.raw`^@?\w`], // packages
        [String.raw`^\u0000"`], // side-effect imports
        // absolute internal imports
        // TODO: Inject package aliases via `config.settings`
        // [`^(${packageAliases.join('|')})(/.*|$)`],
        // relative internal imports
        [String.raw`^\.`],
        [String.raw`^\u0020*(?:\u0020*import|\u0020*export)`],
        ['^[^.]'], // scss imports
      ],
    },
  ],
};
