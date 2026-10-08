import { defineRdyConfig } from 'readyup';

export default defineRdyConfig({
  internal: {
    infix: 'internal',
  },
  // Sources whose kits `rdy run --sources` runs against this repo.
  sources: [
    'github:williamthorsen/.github',
    'npm:@williamthorsen/eslint-config-typescript',
    'npm:@williamthorsen/nmr',
    'npm:@williamthorsen/release-kit',
    'npm:@williamthorsen/toolbelt.vitest',
    'npm:@williamthorsen/tsconfig',
    'npm:codeassembly',
    'npm:readyup',
    'npm:v11y-check',
  ],
});
