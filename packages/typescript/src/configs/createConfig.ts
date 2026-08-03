import type { Config } from 'eslint/config';

// Every factory reaches its plugin through a dynamic `import()`, which keeps the opt-in plugins out of the
// package's static import graph and off a consumer's install unless the consumer asks for the config.
export const createConfig = {
  jsxA11y: async (): Promise<Config[]> => (await import('./jsx-a11y.ts')).default(),
  next: async (): Promise<Config[]> => (await import('./next.ts')).default(),
  react: async (): Promise<Config[]> => (await import('./react.ts')).default(),
  reactTestingLibrary: async (): Promise<Config[]> => (await import('./testing-library.ts')).default.react(),
  vitest: async (): Promise<Config[]> => (await import('./vitest.ts')).default(),
};
