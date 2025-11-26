/* Esta lista fue tomada de chrome://on-device-translation-internals/.
 * Se excluyó 'zh_Hant' porque no funciona correctamente.
 */
const SUPPORTED_LANGUAGES = [
  'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi',
  'fr', 'hi', 'hr', 'hu', 'id', 'it', 'iw', 'ja', 'kn', 'ko',
  'lt', 'mr', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl',
  'sv', 'ta', 'te', 'th', 'tr', 'uk', 'vi', 'zh'
] as const;
const SUMMARIZER_LANGUAGE_CODES =
  ['en', 'es', 'ja'] as const satisfies readonly SupportedLanguageCode[];

export type SupportedLanguages = typeof SUPPORTED_LANGUAGES;
export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number];
export type SummarizerLanguageCode = typeof SUMMARIZER_LANGUAGE_CODES[number];

/**
 * Claves válidas de internacionalización para idiomas soportados
 */
export type SupportedLanguageKey = `lang_${SupportedLanguageCode}`;

/**
 * Servicio para gestionar operaciones relacionadas con idiomas
 * Centraliza la lógica de obtención de idiomas soportados y del navegador
 */
export class LanguageService {
  static #instance: LanguageService | null = null;

  static getInstance(): LanguageService {
    if (!LanguageService.#instance) {
      LanguageService.#instance = new LanguageService();
    }
    return LanguageService.#instance;
  }
  /**
   * Obtiene la lista de idiomas soportados por la aplicación
   * @returns Lista de códigos de idiomas soportados
   */
  getSupportedLanguages(): SupportedLanguages {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Obtiene la lista de códigos de idiomas soportados para resumen
   * @returns Lista de códigos de idiomas soportados para resumen
   */
  getSummarizerLanguageCodes(): typeof SUMMARIZER_LANGUAGE_CODES {
    return SUMMARIZER_LANGUAGE_CODES;
  }

  /**
   * Detecta el idioma principal del navegador del usuario
   * @returns Código de idioma (ej: 'es', 'en', 'fr')
   */
  getBrowserLanguage(): string {
    // Tomar el primer idioma y convertir 'es-ES' a 'es'
    return navigator.language.split('-')[0]!;
  }

  /**
   * Obtiene la clave de mensaje de internacionalización para un idioma soportado
   * @param code - Código del idioma
   * @returns La clave de mensaje garantizada válida para i18n
   */
  getLanguageKey(code: SupportedLanguageCode): SupportedLanguageKey {
    return `lang_${code}` as const;
  }

  /**
   * Determina si un idioma está soportado
   * @param languageCode - Código del idioma a verificar
   * @returns true si el idioma está soportado
   */
  isLanguageSupported(languageCode: string): languageCode is SupportedLanguageCode {
    return SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguageCode);
  }

  isSummarizerLanguage(languageCode: string): languageCode is SummarizerLanguageCode {
    return SUMMARIZER_LANGUAGE_CODES.includes(languageCode as SummarizerLanguageCode);
  }
}
