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
  return sidePanelState[tabId] === true;
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

/**
 * Genera el HTML de la notificación
 * @param selectedText - Texto seleccionado
 * @returns HTML de la notificación
 */
export const generateNotificationHTML = (selectedText: string): string => {
  const truncatedText = selectedText.length > 200 ? selectedText.substring(0, 200) + '...' : selectedText;
  
  return `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
      <div style="display: flex; align-items: center;">
        <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-right: 8px;"></div>
        <strong style="color: #1f2937;">Browser AI</strong>
      </div>
      <button id="close-ai-notification" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280; padding: 0; width: 20px; height: 20px;">&times;</button>
    </div>
    <div style="color: #374151; margin-bottom: 16px;">
      <div style="font-weight: 500; margin-bottom: 8px;">Texto seleccionado para traducir:</div>
      <div style="background: #f8fafc; padding: 8px; border-radius: 6px; border-left: 3px solid #3b82f6; font-size: 13px; max-height: 100px; overflow-y: auto;">
        "${truncatedText}"
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="open-sidepanel-btn" style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; flex: 1;">
        🔄 Abrir Traductor
      </button>
      <button id="close-ai-notification-2" style="background: #e5e7eb; color: #6b7280; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 13px;">
        ✕
      </button>
    </div>
  `;
};

/**
 * Trunca el texto para la notificación
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima (por defecto 200)
 * @returns Texto truncado
 */
export const truncateTextForNotification = (text: string, maxLength = 200): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

/**
 * Determina el comportamiento del menú contextual basado en el estado del side panel
 * @param isSidePanelOpen - Si el side panel está abierto
 * @param selectedText - Texto seleccionado
 * @param tabId - ID de la pestaña
 * @returns Objeto con la acción a realizar y la razón
 */
export const determineContextMenuBehavior = (
  isSidePanelOpen: boolean, 
  selectedText: string, 
  tabId: number
) => {
  if (!selectedText || !tabId) {
    return { action: 'none', reason: 'invalid_input' };
  }

  if (isSidePanelOpen) {
    return { 
      action: 'update_directly', 
      reason: 'panel_open',
      shouldShowNotification: false
    };
  } else {
    return { 
      action: 'show_notification', 
      reason: 'panel_closed',
      shouldShowNotification: true
    };
  }
};
