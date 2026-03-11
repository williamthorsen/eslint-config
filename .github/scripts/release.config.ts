import type { MonorepoReleaseConfig } from '@williamthorsen/release-kit';
import { DEFAULT_WORK_TYPES } from '@williamthorsen/release-kit';

function component(tagName: string, dir: string) {
  return {
    tagPrefix: `${tagName}-v`,
    packageFiles: [`packages/${dir}/package.json`],
    changelogPaths: [`packages/${dir}`],
    paths: [`packages/${dir}/**`],
  };
}

export const config: MonorepoReleaseConfig = {
  components: [
    component('eslint-config-basic', 'basic'),
    component('eslint-config-typescript', 'typescript'),
    component('strict-lint', 'strict-lint'),
  ],
  workTypes: [...DEFAULT_WORK_TYPES],
  formatCommand: 'pnpm run fmt',
};
