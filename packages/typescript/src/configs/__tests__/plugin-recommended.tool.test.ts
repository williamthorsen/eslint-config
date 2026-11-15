import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { jsonConfig } from '../json.ts';
import { json5Config } from '../json5.ts';
import { yamlConfig } from '../yaml.ts';

// Each source breaks one rule that only the plugin's recommended config enables, so a report shows that the
// recommended config reached files of that type.
const cases = [
  { fileName: 'subject.json', source: '{ "key": 1, "key": 2 }\n', ruleId: 'jsonc/no-dupe-keys' },
  { fileName: 'subject.json5', source: '{ key: 1, key: 2 }\n', ruleId: 'jsonc/no-dupe-keys' },
  { fileName: 'subject.yaml', source: 'list:\n  -\n  - item\n', ruleId: 'yml/no-empty-sequence-entry' },
];

describe('the data-file configs', () => {
  it.each(cases)("apply the plugin's recommended rules to $fileName", async ({ fileName, source, ruleId }) => {
    const eslint = new ESLint({
      cwd: import.meta.dirname,
      overrideConfigFile: true,
      overrideConfig: [...jsonConfig, ...json5Config, ...yamlConfig],
    });

    const results = await eslint.lintText(source, { filePath: `${import.meta.dirname}/${fileName}` });

    expect(results[0]?.messages.map((message) => message.ruleId)).toContain(ruleId);
  });

  it('accept the number and string syntax that JSON5 permits', async () => {
    const eslint = new ESLint({
      cwd: import.meta.dirname,
      overrideConfigFile: true,
      overrideConfig: [...jsonConfig, ...json5Config, ...yamlConfig],
    });
    const source = "{ plus: +1, hex: 0xff, decimal: .5, infinite: Infinity, nan: NaN, text: 'a\\\n b' }\n";

    const results = await eslint.lintText(source, { filePath: `${import.meta.dirname}/subject.json5` });

    expect(results[0]?.messages).toStrictEqual([]);
  });
});
