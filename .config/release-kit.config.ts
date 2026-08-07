import { defineConfig } from '@williamthorsen/release-kit/config';

const config = defineConfig({
  scopeAliases: {
    ts: 'typescript',
  },

  releaseNotes: {
    shouldInjectIntoReadme: true,
  },

  repoLabels: {
    extends: ['common'],
    labels: {
      'scope:root': { color: '00ff96' },
      'scope:basic': { color: '00ff96' },
      'scope:strict-lint': { color: '00ff96' },
      'scope:tsconfig': { color: '00ff96' },
      'scope:typescript': { color: '00ff96' },
    },
  },

  retiredPackages: [
    {
      name: '@williamthorsen/eslint-config-basic',
      tagPrefix: 'basic-v',
    },
    {
      name: '@williamthorsen/eslint-config-basic',
      tagPrefix: 'eslint-config-basic-v',
    },
  ],

  workspaces: [
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
});

export default config;
