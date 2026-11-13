import rule from '../helpers-last.ts';
import { RuleTester } from '../test-utils/ruleTester.ts';

const ruleTester = new RuleTester();

ruleTester.run('helpers-last', rule, {
  valid: [
    // Non-firing: a file without helpers
    'export function a() {}\nexport const b = 1;',
    // Non-firing: one trailing `Helpers` region
    [
      'export function main() { return alpha() + beta(); }',
      '// region | Helpers',
      'function alpha() { return 1; }',
      'function beta() { return 2; }',
      '// endregion | Helpers',
    ].join('\n'),
    // Non-firing: several named trailing regions, each sorted, with a nested region
    [
      'export function main() {}',
      '// region | Emit',
      'function assertEmitted() {}',
      'function emit() {}',
      '// endregion | Emit',
      '// region | Cache',
      'function read() {}',
      '// region | Keys',
      'function hashKey() {}',
      '// endregion | Keys',
      'function write() {}',
      '// endregion | Cache',
    ].join('\n'),
    // Non-firing: a region that contains no helper may precede the exports
    [
      '// region | Types',
      'interface Options { verbose: boolean }',
      '// endregion | Types',
      'export function main(options: Options) { return helper(options); }',
      '// region | Helpers',
      'function helper(options: Options) { return options.verbose; }',
      '// endregion | Helpers',
    ].join('\n'),
    // Non-firing: a test file with helpers below its `describe` blocks
    [
      "describe('main', () => { it('works', () => { setUp(); }); });",
      "describe.each([1])('each %i', () => {});",
      '// region | Helpers',
      'function setUp() {}',
      '// endregion | Helpers',
    ].join('\n'),
    // Non-firing: overload signatures and their implementation count as one helper
    [
      'export const x = parse(1);',
      '// region | Helpers',
      'function parse(value: number): number;',
      'function parse(value: string): string;',
      'function parse(value: unknown) { return value; }',
      'function render() {}',
      '// endregion | Helpers',
    ].join('\n'),
    // Non-firing: an ambient declaration is not a helper
    'declare function ambient(): void;\nexport const y = 1;',
    // Non-firing: names that differ only in case tie
    [
      '// region | Helpers',
      'function Parse() {}',
      'function parse2() {}',
      'function PARSE2() {}',
      '// endregion | Helpers',
    ].join('\n'),
    // Non-firing: a function exported by reference is not a helper
    'function build() {}\nfunction parse() {}\nexport { build, parse as read };',
    'function main() {}\nexport default main;',
    'function main() {}\nexport = main;',
    // Non-firing: a marker inside a function body does not open a region
    'export function main() {\n  // region | Helpers\n}\nexport const z = 1;',
  ],
  invalid: [
    {
      // Firing: a helper outside any region
      code: 'export function main() { return helper(); }\nfunction helper() { return 1; }',
      errors: [{ messageId: 'outsideRegion', data: { name: 'helper' } }],
    },
    {
      // Firing: a block comment is not a marker
      code: '/* region | Helpers */\nfunction helper() {}',
      errors: [{ messageId: 'outsideRegion', data: { name: 'helper' } }],
    },
    {
      // Firing: an export after the helper region closes
      code: [
        '// region | Helpers',
        'function helper() {}',
        '// endregion | Helpers',
        'export const x = helper();',
      ].join('\n'),
      errors: [{ messageId: 'exportAfterHelpers', data: { helper: 'helper', region: 'Helpers' } }],
    },
    {
      // Firing: an exported declaration inside an unclosed helper region
      code: ['// region | Cache', 'function read() {}', 'export function write() {}'].join('\n'),
      errors: [{ messageId: 'exportAfterHelpers', data: { helper: 'read', region: 'Cache' } }],
    },
    {
      // Firing: a re-export after a helper region, which a nested region does not hide
      code: [
        '// region | Outer',
        '// region | Inner',
        'function helper() {}',
        '// endregion | Inner',
        "export * from './other.ts';",
        '// endregion | Outer',
      ].join('\n'),
      errors: [{ messageId: 'exportAfterHelpers', data: { helper: 'helper', region: 'Outer' } }],
    },
    {
      // Firing: a test call after the helper region
      code: ['// region | Helpers', 'function setUp() {}', '// endregion | Helpers', "it('works', setUp);"].join('\n'),
      errors: [{ messageId: 'testAfterHelpers', data: { helper: 'setUp', region: 'Helpers' } }],
    },
    {
      // Firing: a curried `describe.each(...)(...)` after the helper region
      code: [
        '// region | Helpers',
        'function setUp() {}',
        '// endregion | Helpers',
        "describe.each([1, 2])('case %i', () => { setUp(); });",
      ].join('\n'),
      errors: [{ messageId: 'testAfterHelpers' }],
    },
    {
      // Firing: a tagged-template `describe.each` after the helper region
      code: [
        '// region | Helpers',
        'function setUp() {}',
        '// endregion | Helpers',
        "describe.each`a\n${1}`('case $a', () => { setUp(); });",
      ].join('\n'),
      errors: [{ messageId: 'testAfterHelpers' }],
    },
    {
      // Firing: unsorted helpers, reported once per region at the first one out of order
      code: [
        '// region | Emit',
        'function emitPackage() {}',
        'function assertEmitSucceeded() {}',
        'function aardvark() {}',
        '// endregion | Emit',
        '// region | Cache',
        'function write() {}',
        'function read() {}',
        '// endregion | Cache',
      ].join('\n'),
      errors: [
        { messageId: 'unsorted', data: { name: 'assertEmitSucceeded', previous: 'emitPackage' } },
        { messageId: 'unsorted', data: { name: 'read', previous: 'write' } },
      ],
    },
  ],
});
