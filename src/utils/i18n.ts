/**
 * Función helper para internacionalización
 * @param key - Clave del mensaje de internacionalización
 * @param substitutions - Array opcional de substituciones para placeholders en el mensaje
 * @returns El mensaje internacionalizado
 */
export function t(...args: Parameters<typeof browser.i18n['getMessage']>) {
  return browser.i18n.getMessage(...args);
}
