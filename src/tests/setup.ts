import { beforeEach } from "vitest";
import { config } from '@vue/test-utils';
import { vuetify } from "@/plugins/vuetify";
import { setupBrowserMocks } from "./mocks/browser-api.mock";

beforeEach(() => {
  // Esto es necesario ya que las pruebas pueden modificar el estado global
  setupBrowserMocks();
});

config.global.plugins = [vuetify];
