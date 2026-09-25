import { describe, expect, it } from 'vitest';

import skyPilot from '../eslint-plugin-sky-pilot.ts';
import skyPilotReact from '../eslint-plugin-sky-pilot-react.ts';

interface Preset {
  plugins?: Record<string, { rules?: Record<string, unknown> | undefined }>;
  rules?: Record<string, unknown>;
}

// `optInRules` names the rules that a plugin registers but no preset enables; a project turns them on for itself.
const pluginModules: { name: string; configs: Record<string, Preset>; optInRules: string[] }[] = [
  { name: 'sky-pilot', configs: skyPilot.configs, optInRules: ['no-type-cycle'] },
  { name: 'sky-pilot-react', configs: skyPilotReact.configs, optInRules: [] },
];

const presetCases = pluginModules.flatMap(({ name, configs, optInRules }) =>
  Object.entries(configs).map(([presetName, preset]) => ({ pluginName: name, presetName, preset, optInRules })),
);

describe('custom plugin preset integrity', () => {
  // A rule id is `<pluginPrefix>/<ruleName>`, and ESLint cannot resolve it unless the prefix is a key of the preset's
  // `plugins`.
  it.each(presetCases)(`$pluginName "$presetName" registers every rule's plugin prefix`, ({ preset }) => {
    const registeredPrefixes = Object.keys(preset.plugins ?? {});
    const rulePrefixes = Object.keys(preset.rules ?? {}).map((ruleId) => ruleId.slice(0, ruleId.indexOf('/')));

    expect(rulePrefixes.length).toBeGreaterThan(0);
    for (const prefix of rulePrefixes) {
      expect(registeredPrefixes).toContain(prefix);
    }
  });

  // A rule that the plugin registers but a preset leaves out ships disabled under that preset, and no other check
  // reports it.
  it.each(presetCases)(
    `$pluginName "$presetName" enables every rule the plugin registers but the opt-in ones`,
    ({ optInRules, pluginName, preset }) => {
      const registeredRules = Object.keys(preset.plugins?.[pluginName]?.rules ?? {});
      const expectedRules = registeredRules.filter((ruleName) => !optInRules.includes(ruleName));
      const enabledRules = Object.keys(preset.rules ?? {}).map((ruleId) => ruleId.slice(ruleId.indexOf('/') + 1));

      expect(expectedRules.length).toBeGreaterThan(0);
      expect(enabledRules.toSorted()).toStrictEqual(expectedRules.toSorted());
    },
  );

  it.each(presetCases)(
    `$pluginName "$presetName" lists no opt-in rule at any severity`,
    ({ optInRules, pluginName, preset }) => {
      const registeredRules = Object.keys(preset.plugins?.[pluginName]?.rules ?? {});
      const enabledRules = Object.keys(preset.rules ?? {}).map((ruleId) => ruleId.slice(ruleId.indexOf('/') + 1));

      for (const ruleName of optInRules) {
        // A project that opts in needs the rule registered.
        expect(registeredRules).toContain(ruleName);
        // An `'off'` entry would override a project that enabled the rule in an earlier config object.
        expect(enabledRules).not.toContain(ruleName);
      }
    },
  );
});
