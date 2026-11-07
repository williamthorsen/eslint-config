import rule from '../no-real-time-sleep.ts';
import { RuleTester } from '../test-utils/ruleTester.ts';

const ruleTester = new RuleTester();

const error = [{ messageId: 'realTimeSleep' }] as const;

ruleTester.run('no-real-time-sleep', rule, {
  valid: [
    // Non-firing: a zero or omitted delay yields a turn rather than waiting
    'await new Promise((resolve) => setTimeout(resolve, 0));',
    'await new Promise((resolve) => setTimeout(resolve));',
    'await new Promise((resolve) => setTimeout(() => resolve(), 0));',
    "import { setTimeout } from 'node:timers/promises'; await setTimeout(0);",
    "import { setTimeout } from 'node:timers/promises'; await setTimeout();",
    // Non-firing: the timer does not resolve the promise
    'await new Promise((resolve) => { setTimeout(() => {}, 100); resolve(); });',
    'new Promise((resolve, reject) => setTimeout(reject, 100));',
    // Non-firing: the callback passes `resolve` along without calling it
    'new Promise((resolve) => setTimeout(() => register(resolve), 100));',
    // Non-firing: a local `setTimeout` or `Promise` shadows the global
    'function setTimeout(fn, ms) {} new Promise((resolve) => setTimeout(resolve, 100));',
    'class Promise { constructor(fn) {} } new Promise((resolve) => setTimeout(resolve, 100));',
    // Non-firing: `setTimeout` from a module other than `timers/promises`
    "import { setTimeout } from 'node:timers'; setTimeout(() => {}, 100);",
    "import { setTimeout } from './clock.ts'; await setTimeout(100);",
    "import * as timers from 'node:timers'; timers.setTimeout(() => {}, 100);",
  ],
  invalid: [
    // Firing: `resolve` passed as the handler, in an expression body and a block body
    { code: 'await new Promise((resolve) => setTimeout(resolve, 100));', errors: error },
    { code: 'await new Promise((resolve) => { setTimeout(resolve, 100); });', errors: error },
    { code: 'await new Promise(function (resolve) { setTimeout(resolve, 100); });', errors: error },
    // Firing: `resolve` called from the handler, at any depth
    { code: 'await new Promise((resolve) => setTimeout(() => resolve(), 100));', errors: error },
    { code: 'await new Promise((resolve) => setTimeout(() => { resolve(); }, 100));', errors: error },
    { code: 'await new Promise((r) => setTimeout(() => { if (ready) { r(undefined); } }, 100));', errors: error },
    // Firing: a variable delay, whose value the rule cannot know
    { code: 'function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }', errors: error },
    // Firing: the timer reached through `globalThis`
    { code: 'await new Promise((resolve) => globalThis.setTimeout(resolve, 100));', errors: error },
    // Firing: `setTimeout` from `timers/promises`, by each specifier and import form
    { code: "import { setTimeout } from 'node:timers/promises'; await setTimeout(100);", errors: error },
    { code: "import { setTimeout } from 'timers/promises'; await setTimeout(100);", errors: error },
    { code: "import { setTimeout as sleep } from 'node:timers/promises'; await sleep(100);", errors: error },
    { code: "import * as timers from 'node:timers/promises'; await timers.setTimeout(100);", errors: error },
    { code: "import timers from 'node:timers/promises'; await timers.setTimeout(100);", errors: error },
  ],
});
