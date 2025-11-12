/* Esta lista fue tomada de chrome://on-device-translation-internals/.
 * Se excluyó 'zh_Hant' porque no funciona correctamente.
 */

// TODO: derivar nameKey en la implementación y quitar
export const AVAILABLE_LANGUAGES = [
  { code: 'ar', nameKey: 'lang_ar' },
  { code: 'bg', nameKey: 'lang_bg' },
  { code: 'bn', nameKey: 'lang_bn' },
  { code: 'cs', nameKey: 'lang_cs' },
  { code: 'da', nameKey: 'lang_da' },
  { code: 'de', nameKey: 'lang_de' },
  { code: 'el', nameKey: 'lang_el' },
  { code: 'en', nameKey: 'lang_en' },
  { code: 'es', nameKey: 'lang_es' },
  { code: 'fi', nameKey: 'lang_fi' },
  { code: 'fr', nameKey: 'lang_fr' },
  { code: 'hi', nameKey: 'lang_hi' },
  { code: 'hr', nameKey: 'lang_hr' },
  { code: 'hu', nameKey: 'lang_hu' },
  { code: 'id', nameKey: 'lang_id' },
  { code: 'it', nameKey: 'lang_it' },
  { code: 'iw', nameKey: 'lang_iw' },
  { code: 'ja', nameKey: 'lang_ja' },
  { code: 'kn', nameKey: 'lang_kn' },
  { code: 'ko', nameKey: 'lang_ko' },
  { code: 'lt', nameKey: 'lang_lt' },
  { code: 'mr', nameKey: 'lang_mr' },
  { code: 'nl', nameKey: 'lang_nl' },
  { code: 'no', nameKey: 'lang_no' },
  { code: 'pl', nameKey: 'lang_pl' },
  { code: 'pt', nameKey: 'lang_pt' },
  { code: 'ro', nameKey: 'lang_ro' },
  { code: 'ru', nameKey: 'lang_ru' },
  { code: 'sk', nameKey: 'lang_sk' },
  { code: 'sl', nameKey: 'lang_sl' },
  { code: 'sv', nameKey: 'lang_sv' },
  { code: 'ta', nameKey: 'lang_ta' },
  { code: 'te', nameKey: 'lang_te' },
  { code: 'th', nameKey: 'lang_th' },
  { code: 'tr', nameKey: 'lang_tr' },
  { code: 'uk', nameKey: 'lang_uk' },
  { code: 'vi', nameKey: 'lang_vi' },
  { code: 'zh', nameKey: 'lang_zh' }
] as const;

export type AvailableLanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];

export const SUMMARIZER_LANGUAGE_CODES = ['en', 'es', 'ja'] as const;

export type SummarizerLanguageCode = typeof SUMMARIZER_LANGUAGE_CODES[number];
