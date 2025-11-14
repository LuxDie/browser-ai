/* Esta lista fue tomada de chrome://on-device-translation-internals/.
 * Se excluyó 'zh_Hant' porque no funciona correctamente.
 */

export const SUPPORTED_LANGUAGES = [
  'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi',
  'fr', 'hi', 'hr', 'hu', 'id', 'it', 'iw', 'ja', 'kn', 'ko',
  'lt', 'mr', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl',
  'sv', 'ta', 'te', 'th', 'tr', 'uk', 'vi', 'zh'
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number];

export const SUMMARIZER_LANGUAGE_CODES = ['en', 'es', 'ja'] as const;

export type SummarizerLanguageCode = typeof SUMMARIZER_LANGUAGE_CODES[number];

/**
 * Claves válidas de internacionalización para idiomas soportados
 */
export type SupportedLanguageKey = `lang_${SupportedLanguageCode}`;

/**
 * Obtiene la clave de mensaje de internacionalización para un idioma soportado
 * @param code Código del idioma
 * @returns La clave de mensaje garantizada válida para i18n
 */
export function getLanguageKey(code: SupportedLanguageCode): SupportedLanguageKey {
  return `lang_${code}` as const;
}

/**
 * Determina si un idioma está soportado
 * @param languageCode Código del idioma a verificar
 * @returns true si el idioma está soportado
 */
export function isLanguageSupported(languageCode: string): languageCode is SupportedLanguageCode {
  return SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguageCode);
}
