import { onMessage, sendMessage } from '@/entrypoints/background/messaging';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import { registerAIService } from '@/entrypoints/background/ai/ai.service';

export type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';

/* Background script para Browser AI
 * Maneja eventos del navegador y comunicación entre componentes
 */
export default defineBackground({
  type: 'module',
  main() {
    // Registrar servicios proxy
    registerAIService();


    // Texto seleccionado pendiente para envío al sidepanel
    let pendingRequest: { text: string, action: 'translate' | 'summarize' | 'rewrite' | 'proofread' } | null = null;

    // Instancias de servicios
    const modelManager = ModelManager.getInstance();

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

      // Opción de reescritura
      browser.contextMenus.create({
        id: 'rewriteSelection',
        parentId: 'browserAI',
        title: browser.i18n.getMessage('rewriteMenu') || 'Rewrite',
        contexts: ['selection']
      });

      // Opción de corrección
      browser.contextMenus.create({
        id: 'proofreadSelection',
        parentId: 'browserAI',
        title: browser.i18n.getMessage('proofreadMenu') || 'Proofread',
        contexts: ['selection']
      });
    }

    // Manejador de clics en el menú contextual
    browser.contextMenus.onClicked.addListener((info, tab) => {
      if (!tab) {
        throw new Error(browser.i18n.getMessage('tabNotFoundError'));
      }

      if (info.selectionText && (
        info.menuItemId === 'translateSelection' ||
        info.menuItemId === 'summarizeSelection' ||
        info.menuItemId === 'rewriteSelection' ||
        info.menuItemId === 'proofreadSelection'
      )) {
        const selectedText = info.selectionText;
        let action: 'translate' | 'summarize' | 'rewrite' | 'proofread' = 'translate';

        switch (info.menuItemId) {
          case 'summarizeSelection':
            action = 'summarize';
            break;
          case 'rewriteSelection':
            action = 'rewrite';
            break;
          case 'proofreadSelection':
            action = 'proofread';
            break;
          case 'translateSelection':
          default:
            action = 'translate';
            break;
        }

        void (async () => {
          await browser.sidePanel.open({ windowId: tab.windowId });

          // Intentar enviar el texto al sidepanel inmediatamente
          try {
            await sendMessage('selectedText', { text: selectedText, action });
          } catch (error) {
            if (error instanceof Error && error.message === browser.i18n.getMessage('connectionErrorMessage')) {
              // El panel lateral está cerrado, guardar el texto seleccionado para enviarlo cuando esté listo
              pendingRequest = { text: selectedText, action };
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
          iconUrl: 'icons/icon-128.png'
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

    // Inicializar menú contextual al instalar la extensión y configurar side panel behavior al instalar la extensión
    browser.runtime.onInstalled.addListener(() => {
      void (async () => {
        await createContextMenu();

        // Configurar comportamiento del panel lateral para que se abra al hacer click en el ícono
        await browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        console.log('Side panel behavior configured successfully');
      })();
    });

    // Recrear menú contextual al iniciar el navegador
    browser.runtime.onStartup.addListener(() => {
      void createContextMenu();
    });
  }
});
