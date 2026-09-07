/**
 * The config `strict-lint init` scaffolds. Its syntax has to be erasable: the cascade loads a strict-lint config
 * through Node's native type stripping, which rejects any construct that would emit runtime code.
 */
export const CONFIG_TEMPLATE = `import { defineConfig } from '@williamthorsen/strict-lint/config';

export default defineConfig({
  maxSeverity: {
    // Cap a rule below \`error\` to keep it a warning under strict-lint:
    // 'unicorn/no-array-reduce': 'warn',
    //
    // Where the ESLint config extends @williamthorsen/eslint-config-typescript, its \`advisoryRuleSeverities\`
    // export is a ready-made set of ceilings: maxSeverity: { ...advisoryRuleSeverities }
  },

  // Import the configs that the ESLint config extends and name them here, as values, to be told
  // which of its own rules merely repeat what they already apply:
  // sharedConfigs: [baseConfig, await createConfig.vitest()],
});
`;
