import { defineProxyService } from '@webext-core/proxy-service';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import { sendMessage } from '@/entrypoints/background/messaging';
import { LanguageCode } from '../available-languages';
import { SummarizerOptions } from '../model-manager/model-manager.model';
import { browser } from 'wxt/browser';

interface ProcessOptions {
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  summarize: boolean
}

export class ProcessTextService {
  async processText(text: string, options: ProcessOptions): Promise<string | undefined> {
    const modelManager = ModelManager.getInstance();
    let sendNotification = false;
    let proccesedText = '';

    if (options.summarize) {

      // Verificar disponibilidad del modelo
      let modelStatus = await modelManager.checkModelStatus({ type: 'summarization' });

      // Si hay un error (API no disponible), lanzar error
      if (modelStatus.errorMessage) {
        throw new Error(modelStatus.errorMessage);
      }

      if (modelStatus.state === 'downloadable') {
        // Si el resumen requiere descargar un modelo, mostrar estado de descarga
        modelStatus.state = 'downloading';
        sendNotification = true;
        void sendMessage('modelStatusUpdate', modelStatus);
        modelStatus = await modelManager.downloadModel({ type: 'summarization' });
        void sendMessage('modelStatusUpdate', modelStatus);
        if (modelStatus.state !== 'available') {
          console.error(modelStatus.errorMessage);
          return;
        }
      }
      const summarizerOptions: SummarizerOptions = {
        expectedInputLanguages: [options.sourceLanguage],
        outputLanguage: options.targetLanguage
      };
      proccesedText = await modelManager.summarizeText(text, summarizerOptions);
    } else {
      let model = await modelManager.checkModelStatus({ type: 'translation', source: options.sourceLanguage, target: options.targetLanguage });
      // Si hay un error (API no disponible), lanzar error
      if (model.errorMessage) {
        throw new Error(model.errorMessage);
      }
      if (model.state === 'downloadable') {
        // Si la traducción requiere descargar un modelo, mostraremos una notificación al finalizar
        sendNotification = true;
        model.state = 'downloading';
        void sendMessage('modelStatusUpdate', model);
        model = await modelManager.downloadModel({ type: 'translation', source: options.sourceLanguage, target: options.targetLanguage });
        void sendMessage('modelStatusUpdate', model);
        if (model.state !== 'available') {
          console.error(model.errorMessage);
          return;
        }
      }

      proccesedText = await modelManager.translate(text, options.sourceLanguage, options.targetLanguage);
    }
    if (sendNotification) {
      void browser.notifications.create({
        type: 'basic',
        title: 'Notificación de traducción',
        message: 'La traducción se ha completado',
        iconUrl: 'icons/icon-128.png'
      });
    }
    
    return proccesedText;
  }
}

export const [registerProcessTextService, getProcessTextService] = defineProxyService('ProcessTextService', () => new ProcessTextService());
