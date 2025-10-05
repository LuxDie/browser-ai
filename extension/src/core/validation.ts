/**
 * Funciones de validación para el núcleo de la aplicación
 * Estas funciones encapsulan la lógica de validación utilizada en la implementación
 */

/**
 * Valida si un código de idioma tiene el formato correcto (ISO 639-1 - 2 letras)
 * @param code - Código de idioma a validar
 * @returns true si el código es válido, false en caso contrario
 */
export const isValidLanguageCodeFormat = (code: string): boolean => {
  // Debe ser exactamente 2 letras (a-z o A-Z)
  return /^[a-zA-Z]{2}$/.test(code);
};

/**
 * Valida si un texto es válido para traducción
 * @param text - Texto a validar
 * @returns true si el texto es válido para traducción, false en caso contrario
 */
export const isValidTextForTranslation = (text: string): boolean => {
  const trimmedText = text.trim();
  if (trimmedText.length < 3) return false;
  
  const urlRegex = /^https?:\/\//;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const numberRegex = /^\d+$/;
  
  if (urlRegex.test(trimmedText) || emailRegex.test(trimmedText) || numberRegex.test(trimmedText)) {
    return false;
  }
  
  return true;
};

/**
 * Valida un par de idiomas (origen y destino)
 * @param source - Idioma origen
 * @param target - Idioma destino
 * @returns Objeto con resultado de validación y razón si es inválido
 */
export const validateLanguagePair = (source: string, target: string): { valid: boolean; reason?: string } => {
  if (!isValidLanguageCodeFormat(source)) {
    return { valid: false, reason: `Invalid source language code: ${source}` };
  }
  if (!isValidLanguageCodeFormat(target)) {
    return { valid: false, reason: `Invalid target language code: ${target}` };
  }
  return { valid: true };
};

/**
 * Determina si se debe renderizar con los idiomas dados
 * @param sourceLang - Idioma origen
 * @param targetLang - Idioma destino
 * @returns true si se debe renderizar, false en caso contrario
 */
export const shouldRenderWithLanguages = (sourceLang: string, targetLang: string): boolean => {
  // No renderizar si los idiomas no son válidos
  if (!sourceLang || !targetLang) return false;
  if (!isValidLanguageCodeFormat(sourceLang)) return false;
  if (!isValidLanguageCodeFormat(targetLang)) return false;
  return true;
};

/**
 * Valida si un código de idioma está en la lista de códigos válidos
 * @param code - Código de idioma a validar
 * @returns true si el código es válido, false en caso contrario
 */
export const isValidLanguageCode = (code: string): boolean => {
  const validCodes = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
    'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no'
  ];
  return validCodes.includes(code.toLowerCase());
};

/**
 * Valida la entrada del menú contextual
 * @param menuItemId - ID del elemento del menú
 * @param selectionText - Texto seleccionado
 * @param tab - Información de la pestaña
 * @returns true si la entrada es válida, false en caso contrario
 */
export const isValidContextMenuInput = (
  menuItemId: string, 
  selectionText: string | undefined, 
  tab: { id: number, windowId: number } | undefined
): boolean => {
  return menuItemId === 'translate-selected-text' && 
         selectionText !== undefined && 
         selectionText.trim().length > 0 && 
         tab !== undefined && 
         tab.id !== undefined;
};
