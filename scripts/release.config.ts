import type { MonorepoReleaseConfig } from '@williamthorsen/release-kit';
import { DEFAULT_WORK_TYPES } from '@williamthorsen/release-kit';

function component(dir: string) {
  return {
    tagPrefix: `${dir}-v`,
    packageFiles: [`packages/${dir}/package.json`],
    changelogPaths: [`packages/${dir}`],
    paths: [`packages/${dir}/**`],
  };
}

export const config: MonorepoReleaseConfig = {
  components: [component('eslint-config-basic'), component('eslint-config-typescript'), component('strict-lint')],
  workTypes: [...DEFAULT_WORK_TYPES],
  formatCommand: 'pnpm run fmt',
};
