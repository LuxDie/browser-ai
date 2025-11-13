import { beforeEach } from "vitest";
import { setupBrowserMocks } from "./utils/browser-api-mocks";

beforeEach(() => {
  // Esto es necesario ya que las pruebas pueden modificar el estado global
  setupBrowserMocks();
});
