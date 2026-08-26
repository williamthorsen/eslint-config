import { describe, expect, it } from 'vitest';

import skyPilot from '../eslint-plugin-sky-pilot.ts';
import skyPilotReact from '../eslint-plugin-sky-pilot-react.ts';

// Each rule id in a preset is `<pluginPrefix>/<ruleName>`. The prefix must match a key
// registered in that preset's `plugins`, or ESLint cannot resolve the rule at load time.
// This guards the class of bug where a preset references a plugin under the wrong key.
interface Preset {
  plugins?: Record<string, { rules?: Record<string, unknown> | undefined }>;
  rules?: Record<string, unknown>;
}

const pluginModules: { name: string; configs: Record<string, Preset> }[] = [
  { name: 'sky-pilot', configs: skyPilot.configs },
  { name: 'sky-pilot-react', configs: skyPilotReact.configs },
];

const presetCases = pluginModules.flatMap(({ name, configs }) =>
  Object.entries(configs).map(([presetName, preset]) => ({ pluginName: name, presetName, preset })),
);

describe('custom plugin preset integrity', () => {
  it.each(presetCases)(`$pluginName "$presetName" registers every rule's plugin prefix`, ({ preset }) => {
    const registeredPrefixes = Object.keys(preset.plugins ?? {});
    const rulePrefixes = Object.keys(preset.rules ?? {}).map((ruleId) => ruleId.slice(0, ruleId.indexOf('/')));

    expect(rulePrefixes.length).toBeGreaterThan(0);
    for (const prefix of rulePrefixes) {
      expect(registeredPrefixes).toContain(prefix);
    }
  });

  // Adding a rule means editing the plugin's `rules` map and each preset separately. One left out of a preset ships
  // disabled under it, which no other check would report.
  it.each(presetCases)(
    `$pluginName "$presetName" enables every rule the plugin registers`,
    ({ pluginName, preset }) => {
      const registeredRules = Object.keys(preset.plugins?.[pluginName]?.rules ?? {});
      const enabledRules = Object.keys(preset.rules ?? {}).map((ruleId) => ruleId.slice(ruleId.indexOf('/') + 1));

      expect(registeredRules.length).toBeGreaterThan(0);
      expect(enabledRules.toSorted()).toStrictEqual(registeredRules.toSorted());
    },
  );
});
