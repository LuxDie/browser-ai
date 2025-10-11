/**
 * Funciones auxiliares para el manejo de modelos
 * Estas funciones encapsulan la lógica de gestión de modelos utilizada en la implementación
 */

export interface ModelStatus {
  available: boolean;
  downloading: boolean;
  progress?: number;
  error?: string;
}

export interface PendingTranslation {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Genera una clave para un par de idiomas
 * @param source - Idioma origen
 * @param target - Idioma destino
 * @returns Clave única para el par de idiomas
 */
export const getLanguagePairKey = (source: string, target: string): string => {
  return `${source}-${target}`;
};

/**
 * Establece el estado de un modelo
 * @param source - Idioma origen
 * @param target - Idioma destino
 * @param status - Estado del modelo
 * @param modelStatusCache - Cache de estados de modelos
 */
export const setModelStatus = (
  source: string, 
  target: string, 
  status: ModelStatus,
  modelStatusCache: Map<string, ModelStatus>
) => {
  const key = getLanguagePairKey(source, target);
  modelStatusCache.set(key, status);
};

/**
 * Obtiene el estado de un modelo
 * @param source - Idioma origen
 * @param target - Idioma destino
 * @param modelStatusCache - Cache de estados de modelos
 * @returns Estado del modelo o null si no existe
 */
export const getModelStatus = (
  source: string, 
  target: string,
  modelStatusCache: Map<string, ModelStatus>
): ModelStatus | null => {
  const key = getLanguagePairKey(source, target);
  return modelStatusCache.get(key) || null;
};

/**
 * Agrega una traducción pendiente
 * @param text - Texto a traducir
 * @param sourceLanguage - Idioma origen
 * @param targetLanguage - Idioma destino
 * @param pendingTranslations - Array de traducciones pendientes
 */
export const addPendingTranslation = (
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  pendingTranslations: PendingTranslation[]
) => {
  const pending = {
    text,
    sourceLanguage,
    targetLanguage,
    timestamp: Date.now()
  };
  
  // Remove duplicates for same language pair
  const key = getLanguagePairKey(sourceLanguage, targetLanguage);
  const filtered = pendingTranslations.filter(p => 
    getLanguagePairKey(p.sourceLanguage, p.targetLanguage) !== key
  );
  
  filtered.push(pending);
  pendingTranslations.length = 0;
  pendingTranslations.push(...filtered);
};

/**
 * Obtiene las traducciones pendientes para un par de idiomas
 * @param sourceLanguage - Idioma origen
 * @param targetLanguage - Idioma destino
 * @param pendingTranslations - Array de traducciones pendientes
 * @returns Array de traducciones pendientes para el par de idiomas
 */
export const getPendingTranslations = (
  sourceLanguage: string,
  targetLanguage: string,
  pendingTranslations: PendingTranslation[]
) => {
  const key = getLanguagePairKey(sourceLanguage, targetLanguage);
  return pendingTranslations.filter(p => 
    getLanguagePairKey(p.sourceLanguage, p.targetLanguage) === key
  );
};

/**
 * Determina el flujo de traducción basado en el estado del modelo
 * @param modelStatus - Estado del modelo
 * @param text - Texto a traducir
 * @param sourceLanguage - Idioma origen
 * @param targetLanguage - Idioma destino
 * @returns Objeto con la acción a realizar y la razón
 */
export const determineTranslationFlow = (
  modelStatus: ModelStatus | null,
  text: string,
  sourceLanguage: string,
  targetLanguage: string
) => {
  if (!text.trim()) {
    return { action: 'none', reason: 'no_text' };
  }

  if (!sourceLanguage || !targetLanguage) {
    return { action: 'none', reason: 'missing_languages' };
  }

  if (sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
    return { action: 'none', reason: 'same_languages' };
  }

  if (modelStatus?.available) {
    return { action: 'translate_directly', reason: 'model_available' };
  }

  if (modelStatus?.downloading) {
    return { action: 'add_to_pending', reason: 'model_downloading' };
  }

  if (!modelStatus?.available) {
    return { action: 'show_options', reason: 'model_not_available' };
  }

  return { action: 'unknown', reason: 'unexpected_state' };
};

/**
 * Actualiza el progreso de descarga
 * @param currentProgress - Progreso actual
 * @param newProgress - Nuevo progreso
 * @returns Objeto con información del progreso actualizado
 */
export const updateDownloadProgress = (currentProgress: number, newProgress: number) => {
  if (newProgress < 0 || newProgress > 100) {
    throw new Error('Progress must be between 0 and 100');
  }
  
  if (newProgress < currentProgress) {
    throw new Error('Progress cannot decrease');
  }
  
  return {
    progress: newProgress,
    isComplete: newProgress === 100,
    canCancel: newProgress < 100
  };
};

/**
 * Formatea el mensaje de notificación
 * @param sourceLanguage - Idioma origen
 * @param targetLanguage - Idioma destino
 * @param status - Estado del modelo
 * @returns Mensaje formateado
 */
export const formatNotificationMessage = (
  sourceLanguage: string,
  targetLanguage: string,
  status: string
) => {
  const languagePair = `${sourceLanguage.toUpperCase()}→${targetLanguage.toUpperCase()}`;
  
  switch (status) {
    case 'ready':
      return `${languagePair} listo`;
    case 'downloading':
      return `Descargando modelo ${languagePair}...`;
    case 'error':
      return `Error descargando modelo ${languagePair}`;
    default:
      return `Estado desconocido para ${languagePair}`;
  }
};

/**
 * Determina el tipo de notificación basado en el estado del modelo
 * @param modelStatus - Estado del modelo
 * @returns Objeto con tipo y prioridad de la notificación
 */
export const getNotificationType = (modelStatus: ModelStatus | null) => {
  if (modelStatus?.available) {
    return { type: 'success', priority: 'normal' };
  }
  
  if (modelStatus?.downloading) {
    return { type: 'info', priority: 'low' };
  }
  
  if (modelStatus?.error) {
    return { type: 'error', priority: 'high' };
  }
  
  return { type: 'info', priority: 'normal' };
};

/**
 * Maneja errores de descarga de modelos
 * @param error - Error ocurrido
 * @param sourceLanguage - Idioma origen
 * @param targetLanguage - Idioma destino
 * @returns Objeto con información del error manejado
 */
export const handleDownloadError = (
  error: Error,
  sourceLanguage: string,
  targetLanguage: string
) => {
  const errorTypes = {
    'NetworkError': 'Sin conexión a internet',
    'StorageError': 'Espacio insuficiente en disco',
    'PermissionError': 'Permisos insuficientes',
    'TimeoutError': 'Tiempo de descarga agotado'
  };

  const errorMessage = errorTypes[error.name as keyof typeof errorTypes] || error.message;
  
  return {
    sourceLanguage,
    targetLanguage,
    error: errorMessage,
    canRetry: !['PermissionError', 'StorageError'].includes(error.name),
    fallbackAvailable: true
  };
};
