import { defineConfig } from '@williamthorsen/release-kit/config';

const config = defineConfig({
  // Resolves the `ts` scope of the commits made before the scope was renamed to `typescript`.
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
});

export default config;
