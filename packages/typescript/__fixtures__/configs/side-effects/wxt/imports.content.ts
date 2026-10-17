import { defineContentScript } from '#imports';

export default defineContentScript({
  matches: ['https://example.com/*'],
  main() {
    globalThis.dispatchEvent(new Event('ready'));
  },
});
