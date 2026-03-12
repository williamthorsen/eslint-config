import type { ReleaseKitConfig } from '@williamthorsen/release-kit';

const config: ReleaseKitConfig = {
  formatCommand: 'pnpm run fmt',

  // Uncomment to set custom release tags or exclude components from release processing:
  // components: [
  //   { dir: 'my-package', shouldExclude: true },
  // ],

  // Uncomment to override the default version patterns:
  // versionPatterns: { major: ['!'], minor: ['feat', 'feature'] },

  // Uncomment to add custom work types (merged with defaults):
  // workTypes: { perf: { header: 'Performance' } },
};

export default config;
