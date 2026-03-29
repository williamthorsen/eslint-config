import type { SyncLabelsConfig } from '@williamthorsen/release-kit';

const config: SyncLabelsConfig = {
  presets: ['common'],
  labels: [
    { name: 'scope:root', color: '00ff96', description: 'Monorepo root configuration' },
    { name: 'scope:basic', color: '00ff96', description: 'basic package' },
    { name: 'scope:strict-lint', color: '00ff96', description: 'strict-lint package' },
    { name: 'scope:typescript', color: '00ff96', description: 'typescript package' },
  ],
};

export default config;
