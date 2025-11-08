import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },  
  srcDir: 'src',
  webExt: {
    disabled: true,
  },
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
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
    // WXT no encuentra los íconos automáticamente
    icons: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    default_locale: 'es',
  },
});
