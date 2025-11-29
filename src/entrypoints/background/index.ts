import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import { registerAIService } from '@/entrypoints/background/ai/ai.service';
import {
  SIDEPANEL_PATH,
  EXTENSION_ICON_PATH,
  CONNECTION_ERROR_MESSAGE,
} from '@/utils/constants';

/* Background script para Browser AI
 * Maneja eventos del navegador y comunicación entre componentes
 */
export default defineBackground({
  type: 'module',
  main() {
    // Registrar servicios proxy
    registerAIService();

    // Texto seleccionado pendiente para envío al sidepanel
    let pendingRequest: { text: string, summarize: boolean } | null = null;

    // Instancias de servicios
    const modelManager = ModelManager.getInstance();

    // Cache local para el estado del panel lateral
    const sidepanelState = new Map<number, { enabled: boolean, path: string }>();

    // Función para crear el menú contextual
    async function createContextMenu(): Promise<void> {
      // Eliminar menús contextuales existentes para evitar duplicados
      await browser.contextMenus.removeAll();

      // Crear menú padre
      browser.contextMenus.create({
        id: 'browserAI',
        title: browser.i18n.getMessage('browserAIMenu'),
        contexts: ['selection']
      });

      // Opción de traducción
      browser.contextMenus.create({
        id: 'translateSelection',
        parentId: 'browserAI',
        title: browser.i18n.getMessage('translateMenu'),
        contexts: ['selection']
      });

      // Opción de resumen
      browser.contextMenus.create({
        id: 'summarizeSelection',
        parentId: 'browserAI',
        title: browser.i18n.getMessage('summarizeMenu'),
        contexts: ['selection']
      });
    }

    // Manejador de clics en el menú contextual
    browser.contextMenus.onClicked.addListener((info, tab) => {
      if (info.selectionText && (info.menuItemId === 'translateSelection' || info.menuItemId === 'summarizeSelection')) {
        const selectedText = info.selectionText;
        const summarize = info.menuItemId === 'summarizeSelection';

        void (async () => {
          if (!tab) { return; }

          openSidepanel(tab.id!);
          // Intentar enviar el texto al sidepanel inmediatamente
          try {
            await sendMessage('selectedText', { text: selectedText, summarize });
          } catch (error) {
            if (error instanceof Error && error.message === CONNECTION_ERROR_MESSAGE) {
              // El panel lateral está cerrado, guardar el texto seleccionado
              // para enviarlo cuando esté listo
              pendingRequest = { text: selectedText, summarize };
            } else {
              throw error;
            }
          }
        })();
      }
    });

    // Manejadores de mensajes usando @webext-core/messaging
    onMessage('getModelStatus', async (message) => {
      const { source, target } = message.data;
      return await modelManager.checkModelStatus({ type: 'translation', source, target });
    });

    onMessage('translateText', async (message) => {
      const { text, sourceLanguage, targetLanguage } = message.data;
      let sendNotification = false;

      // Verificar disponibilidad del modelo
      let modelStatus = await modelManager.checkModelStatus({ type: 'translation', source: sourceLanguage, target: targetLanguage });
      if (modelStatus.state === 'downloadable') {
        // Si la traducción requiere descargar un modelo, mostraremos una notificación al finalizar
        sendNotification = true;
        modelStatus.state = 'downloading';
        void sendMessage('modelStatusUpdate', modelStatus);
        modelStatus = await modelManager.downloadModel({ type: 'translation', source: sourceLanguage, target: targetLanguage });
        void sendMessage('modelStatusUpdate', modelStatus);
      }

      const translatedText = await modelManager.translate(text, sourceLanguage, targetLanguage);

      if (sendNotification) {
        void browser.notifications.create({
          type: 'basic',
          title: browser.i18n.getMessage('extName'),
          message: browser.i18n.getMessage('textProcessedNotification'),
          iconUrl: EXTENSION_ICON_PATH
        });
      }

      return translatedText;
    });


    onMessage('sidepanelReady', () => {
      if (pendingRequest) {
        void sendMessage('selectedText', pendingRequest);
        pendingRequest = null;
      }
    });

    // Inicializar menú contextual al instalar la extensión
    browser.runtime.onInstalled.addListener(() => {
      // Deshabilita el panel lateral global (window)
      void browser.sidePanel.setOptions({
        enabled: false
      });
      void createContextMenu();
    });

    // Escucha el clic en el icono de la extensión
    browser.action.onClicked.addListener((tab) => {
      toggleSidepanel(tab.id!);
    });

    function toggleSidepanel(tabId: number) {
      const currentState = sidepanelState.get(tabId) ?? { enabled: false, path: '' };

      if (currentState.enabled && currentState.path === SIDEPANEL_PATH) {
        // Cerrar el panel lateral
        void browser.sidePanel.setOptions({
          tabId,
          path: SIDEPANEL_PATH,
          enabled: false
        });
        sidepanelState.set(tabId, { enabled: false, path: SIDEPANEL_PATH });
      } else {
        // Abrir el panel lateral
        openSidepanel(tabId);
      }
    }

    function openSidepanel(tabId: number) {
      void browser.sidePanel.setOptions({
        tabId,
        path: SIDEPANEL_PATH,
        enabled: true
      });
      void browser.sidePanel.open({
        tabId,
      });
      sidepanelState.set(tabId, { enabled: true, path: SIDEPANEL_PATH });
    }
  }
});
