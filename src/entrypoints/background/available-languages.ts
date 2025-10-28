/* Esta lista fue tomada de chrome://on-device-translation-internals/.
 * Se excluyó 'zh_Hant' porque no funciona correctamente.
 */ 
export const AVAILABLE_LANGUAGES = [
  { code: 'ar', name: 'Árabe' },
  { code: 'bg', name: 'Búlgaro' },
  { code: 'bn', name: 'Bengalí' },
  { code: 'cs', name: 'Checo' },
  { code: 'da', name: 'Danés' },
  { code: 'de', name: 'Alemán' },
  { code: 'el', name: 'Griego' },
  { code: 'en', name: 'Inglés' },
  { code: 'es', name: 'Español' },
  { code: 'fi', name: 'Finés' },
  { code: 'fr', name: 'Francés' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hr', name: 'Croata' },
  { code: 'hu', name: 'Húngaro' },
  { code: 'id', name: 'Indonesio' },
  { code: 'it', name: 'Italiano' },
  { code: 'iw', name: 'Hebreo' },
  { code: 'ja', name: 'Japonés' },
  { code: 'kn', name: 'Canarés' },
  { code: 'ko', name: 'Coreano' },
  { code: 'lt', name: 'Lituano' },
  { code: 'mr', name: 'Maratí' },
  { code: 'nl', name: 'Neerlandés' },
  { code: 'no', name: 'Noruego' },
  { code: 'pl', name: 'Polaco' },
  { code: 'pt', name: 'Portugués' },
  { code: 'ro', name: 'Rumano' },
  { code: 'ru', name: 'Ruso' },
  { code: 'sk', name: 'Eslovaco' },
  { code: 'sl', name: 'Esloveno' },
  { code: 'sv', name: 'Sueco' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Tailandés' },
  { code: 'tr', name: 'Turco' },
  { code: 'uk', name: 'Ucraniano' },
  { code: 'vi', name: 'Vietnamita' },
  { code: 'zh', name: 'Chino' }
] as const;

export type LanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];

export const SUMMARIZER_LANGUAGE_CODES = ['en', 'es', 'ja'] as const;

export type SummarizerLanguageCode = typeof SUMMARIZER_LANGUAGE_CODES[number];
