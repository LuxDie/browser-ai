import type { SummarizerLanguageCode } from '@/entrypoints/background/language/language.service';

/**
 * Opciones para creación de summarizer.
 * Extiende las opciones base reemplazando campos.
 */
export interface SummarizerOptions extends Omit<SummarizerCreateOptions, 'expectedInputLanguages' | 'outputLanguage'> {
  /** Idiomas de entrada esperados. */
  expectedInputLanguages: SummarizerLanguageCode[];
  /** Idioma de salida del resumen. */
  outputLanguage: SummarizerLanguageCode;
}

/**
 * Estado actual de un modelo de IA.
 * Describe el estado de disponibilidad, errores y progreso de descarga.
 */
export interface AIModelStatus {
  /** Estado actual del modelo. */
  state: Availability;
  /** Mensaje de error si el modelo falló. */
  errorMessage?: string;
  /** Progreso de descarga en porcentaje (0-100). */
  downloadProgress?: number;
}
export interface AIModelStatus {
  state: Availability;
  errorMessage?: string;
  downloadProgress?: number;
}
