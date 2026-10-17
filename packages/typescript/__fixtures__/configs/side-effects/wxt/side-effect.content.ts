import { startScanning } from 'some-scanner';
import { defineContentScript } from 'wxt/utils/define-content-script';

startScanning();

export default defineContentScript({
  matches: ['https://example.com/*'],
  main() {
    startScanning();
  },
});
