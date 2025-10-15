import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },  
  srcDir: 'extension/src',
  webExt: {
    disabled: true,
  },
  manifest: {
    name: 'Browser AI',
    description: "AI-powered translation using Chrome's built-in APIs",
    minimum_chrome_version: '138',
    permissions: [
      'sidePanel',
      'activeTab',
      'contextMenus',
      'notifications',
    ],
    action: {
      default_title: 'Browser AI',
    },
    // Icons not being found by WXT automatically
    icons: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
  },
});
