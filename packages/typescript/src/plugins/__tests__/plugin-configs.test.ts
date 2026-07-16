import { describe, expect, it } from 'vitest';

import skyPilot from '../eslint-plugin-sky-pilot.ts';
import skyPilotReact from '../eslint-plugin-sky-pilot-react.ts';

// Each rule id in a preset is `<pluginPrefix>/<ruleName>`. The prefix must match a key
// registered in that preset's `plugins`, or ESLint cannot resolve the rule at load time.
// This guards the class of bug where a preset references a plugin under the wrong key.
interface Preset {
  plugins?: Record<string, unknown>;
  rules?: Record<string, unknown>;
}

const pluginModules: { name: string; configs: Record<string, Preset> }[] = [
  { name: 'sky-pilot', configs: skyPilot.configs },
  { name: 'sky-pilot-react', configs: skyPilotReact.configs },
];

describe('custom plugin preset integrity', () => {
  for (const { name, configs } of pluginModules) {
    for (const [presetName, preset] of Object.entries(configs)) {
      it(`${name} "${presetName}" registers every rule's plugin prefix`, () => {
        const registeredPrefixes = Object.keys(preset.plugins ?? {});
        const rulePrefixes = Object.keys(preset.rules ?? {}).map((ruleId) => ruleId.slice(0, ruleId.indexOf('/')));

        expect(rulePrefixes.length).toBeGreaterThan(0);
        for (const prefix of rulePrefixes) {
          expect(registeredPrefixes).toContain(prefix);
        }
      });
    }
  }
});
