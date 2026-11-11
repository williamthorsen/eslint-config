import rule from '../no-js-extension-for-ts.ts';
import { createTypedRuleTester } from '../test-utils/ruleTester.ts';

// The rule resolves each specifier through the program, so every target is a file under `__fixtures__/rules/`.
const ruleTester = createTypedRuleTester();

ruleTester.run('no-js-extension-for-ts', rule, {
  valid: [
    // Non-firing: the specifier already names the source
    "import { value } from './extension-target.ts';",
    // Non-firing: an extensionless specifier is `import-x/extensions`'s to report
    "import { value } from './extension-target';",
    // Non-firing: a declaration file describes JavaScript at the written path
    "import { value } from './extension-declared.js';",
    // Non-firing: an unresolvable specifier has no source to name
    "// @ts-expect-error -- the target does not exist\nimport { value } from './missing.js';",
    // Non-firing: a bare specifier names a path that the package publishes
    "import type { Program } from 'typescript/lib/typescript.js';",
    // Non-firing: a computed specifier is not a string literal
    "const name = 'target'; void import(`./extension-${name}.js`);",
  ],
  invalid: [
    {
      // Firing: `.js` naming a `.ts` source
      code: "import { value } from './extension-target.js';",
      output: "import { value } from './extension-target.ts';",
      errors: [{ messageId: 'tsExtension', data: { extension: 'ts', importPath: './extension-target.js' } }],
    },
    {
      // Firing: the fix takes the resolved file's extension
      code: "import { value } from './extension-component.js';",
      output: "import { value } from './extension-component.tsx';",
      errors: [{ messageId: 'tsExtension', data: { extension: 'tsx', importPath: './extension-component.js' } }],
    },
    {
      // Firing: `.jsx` naming a `.tsx` source
      code: "import { value } from './extension-component.jsx';",
      output: "import { value } from './extension-component.tsx';",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: `.mjs` naming a `.mts` source
      code: "import { value } from './extension-esm.mjs';",
      output: "import { value } from './extension-esm.mts';",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: `.cjs` naming a `.cts` source
      code: "import { value } from './extension-cjs.cjs';",
      output: "import { value } from './extension-cjs.cts';",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: only the final extension is compared, so a dotted base name matches
      code: "import { value } from './extension-target.config.js';",
      output: "import { value } from './extension-target.config.ts';",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: a type-only import
      code: "import type { value } from './extension-target.js';",
      output: "import type { value } from './extension-target.ts';",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: a side-effect import
      code: "import './extension-target.js';",
      output: "import './extension-target.ts';",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: a named re-export
      code: "export { value } from './extension-target.js';",
      output: "export { value } from './extension-target.ts';",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: a star re-export
      code: "export * from './extension-target.js';",
      output: "export * from './extension-target.ts';",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: a dynamic import
      code: "void import('./extension-target.js');",
      output: "void import('./extension-target.ts');",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: an import assignment
      code: "import type target = require('./extension-target.js');",
      output: "import type target = require('./extension-target.ts');",
      errors: [{ messageId: 'tsExtension' }],
    },
    {
      // Firing: an `import()` type, with the quote style kept
      code: 'type Value = typeof import("./extension-target.js").value;',
      output: 'type Value = typeof import("./extension-target.ts").value;',
      errors: [{ messageId: 'tsExtension' }],
    },
  ],
});
