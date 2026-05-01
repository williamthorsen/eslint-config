import type { ReleaseKitConfig } from '@williamthorsen/release-kit';

const config: ReleaseKitConfig = {
  releaseNotes: {
    shouldInjectIntoReadme: true,
  },

  // Uncomment to exclude workspaces from release processing:
  workspaces: [
    {
      dir: 'basic',
      legacyIdentities: [
        {
          name: '@williamthorsen/eslint-config-basic',
          tagPrefix: 'basic-v',
        },
      ],
    },
    {
      dir: 'typescript',
      legacyIdentities: [
        {
          name: '@williamthorsen/eslint-config-typescript',
          tagPrefix: 'typescript-v',
        },
      ],
    },
  ],

  // Formatting: prettier is auto-detected. Set formatCommand to override.

  // Uncomment to override the default version patterns:
  // versionPatterns: { major: ['!'], minor: ['feat', 'feature'] },

  // Uncomment to add custom work types (merged with defaults):
  // workTypes: { perf: { header: 'Performance' } },
};

export default config;
