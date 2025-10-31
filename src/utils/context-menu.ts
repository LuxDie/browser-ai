/**
 * Funciones auxiliares para el manejo del menú contextual
 * Estas funciones encapsulan la lógica del menú contextual utilizada en la implementación
 */

/**
 * Determina si el side panel está abierto para una pestaña específica
 * @param tabId - ID de la pestaña
 * @param sidePanelState - Estado del side panel por pestaña
 * @returns true si el panel está abierto, false en caso contrario
 */
export const isSidePanelOpen = (tabId: number, sidePanelState: Record<number, boolean>): boolean => {
  return sidePanelState[tabId] ?? false;
};

/**
 * Crea los datos de almacenamiento para el menú contextual
 * @param selectedText - Texto seleccionado
 * @returns Objeto con los datos para almacenar
 */
export const createContextMenuStorageData = (selectedText: string) => {
  return {
    selectedText: selectedText,
    fromContextMenu: true,
    autoTranslate: true
  };
};

/**
 * Crea los parámetros para el script de notificación
 * @param tabId - ID de la pestaña
 * @param selectedText - Texto seleccionado
 * @returns Objeto con los parámetros del script
 */
export const createNotificationScriptParams = (tabId: number, selectedText: string) => {
  return {
    target: { tabId },
    func: (text: string) => text, // Mock function
    args: [selectedText]
  };
};
