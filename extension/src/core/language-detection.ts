/**
 * Funciones de detección de idioma para el núcleo de la aplicación
 * Estas funciones encapsulan la lógica de detección de idioma utilizada en la implementación
 */


/**
 * Obtiene el nombre del idioma en español
 * @param code - Código del idioma
 * @returns Nombre del idioma en español
 */
export const getLanguageName = (code: string): string => {
  const names: { [key: string]: string } = {
    'ar': 'Árabe',
    'bg': 'Búlgaro',
    'bn': 'Bengalí',
    'cs': 'Checo',
    'da': 'Danés',
    'de': 'Alemán',
    'el': 'Griego',
    'en': 'Inglés',
    'es': 'Español',
    'fi': 'Finés',
    'fr': 'Francés',
    'hi': 'Hindi',
    'hr': 'Croata',
    'hu': 'Húngaro',
    'id': 'Indonesio',
    'it': 'Italiano',
    'iw': 'Hebreo',
    'ja': 'Japonés',
    'kn': 'Canarés',
    'ko': 'Coreano',
    'lt': 'Lituano',
    'mr': 'Maratí',
    'nl': 'Neerlandés',
    'no': 'Noruego',
    'pl': 'Polaco',
    'pt': 'Portugués',
    'ro': 'Rumano',
    'ru': 'Ruso',
    'sk': 'Eslovaco',
    'sl': 'Esloveno',
    'sv': 'Sueco',
    'ta': 'Tamil',
    'te': 'Telugu',
    'th': 'Tailandés',
    'tr': 'Turco',
    'uk': 'Ucraniano',
    'vi': 'Vietnamita',
    'zh': 'Chino'
  };
  return names[code] || code.toUpperCase();
};

/**
 * Obtiene la lista de idiomas disponibles
 * @returns Array de códigos de idioma disponibles
 * @remarks
 * Esta lista fue tomada de chrome://on-device-translation-internals/.
 * Se excluyó 'zh_Hant' porque no funciona correctamente.
 */
export const getAvailableLanguages = (): string[] => {
  return [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi',
    'fr', 'hi', 'hr', 'hu', 'id', 'it', 'iw', 'ja', 'kn',
    'ko', 'lt', 'mr', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk',
    'sl', 'sv', 'ta', 'te', 'th', 'tr', 'uk', 'vi', 'zh'
  ];
};
