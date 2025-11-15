import { beforeEach } from "vitest";
import { setupBrowserMocks } from "./mocks/browser-api.mock";

beforeEach(() => {
  // Esto es necesario ya que las pruebas pueden modificar el estado global
  setupBrowserMocks();
});
