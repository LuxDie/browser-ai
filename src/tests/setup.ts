import { beforeEach, afterEach } from "vitest";
import { config, enableAutoUnmount } from '@vue/test-utils';
import { vuetify } from "@/plugins/vuetify";
import { setupBrowserMocks } from "./mocks/browser-api.mock";

beforeEach(() => {
  // Esto es necesario ya que las pruebas pueden modificar el estado global
  setupBrowserMocks();
});

enableAutoUnmount(afterEach);

config.global.plugins = [vuetify];
