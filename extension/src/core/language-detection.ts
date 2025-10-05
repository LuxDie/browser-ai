/**
 * Funciones de detección de idioma para el núcleo de la aplicación
 * Estas funciones encapsulan la lógica de detección de idioma utilizada en la implementación
 */

/**
 * Detección de idioma simplificada
 * @param text - Texto a analizar
 * @returns Código de idioma detectado
 */
export const simpleLanguageDetection = (text: string): string => {
  // Detectar español por ñ únicamente
  if (/[ñ]/i.test(text)) {
    return 'es';
  }
  
  // Por defecto, asumir inglés
  return 'en';
};

/**
 * Obtiene el nombre del idioma en español
 * @param code - Código del idioma
 * @returns Nombre del idioma en español
 */
export const getLanguageName = (code: string): string => {
  const names: { [key: string]: string } = {
    'en': 'Inglés',
    'es': 'Español',
    'fr': 'Francés',
    'de': 'Alemán',
    'it': 'Italiano',
    'pt': 'Portugués',
    'ru': 'Ruso',
    'ja': 'Japonés',
    'ko': 'Coreano',
    'zh': 'Chino',
    'ar': 'Árabe',
    'hi': 'Hindi',
    'th': 'Tailandés',
    'vi': 'Vietnamita',
    'tr': 'Turco',
    'pl': 'Polaco',
    'nl': 'Holandés',
    'sv': 'Sueco',
    'da': 'Danés',
    'no': 'Noruego'
  };
  return names[code] || code.toUpperCase();
};

/**
 * Obtiene la lista de idiomas disponibles
 * @returns Array de códigos de idioma disponibles
 */
export const getAvailableLanguages = (): string[] => {
  return [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
    'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no'
  ];
};
