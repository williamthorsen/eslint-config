import type { Config } from 'eslint/config';

import { createConfig } from '../createConfig.ts';

export const factoryCases: { name: string; load: () => Promise<Config[]>; fixture: string }[] = [
  { name: 'jsxA11y', load: createConfig.jsxA11y, fixture: 'component.tsx' },
  { name: 'next', load: createConfig.next, fixture: 'component.tsx' },
  { name: 'react', load: createConfig.react, fixture: 'component.tsx' },
  { name: 'reactTestingLibrary', load: createConfig.reactTestingLibrary, fixture: 'Component.test.tsx' },
  { name: 'vitest', load: createConfig.vitest, fixture: 'example.test.ts' },
];
