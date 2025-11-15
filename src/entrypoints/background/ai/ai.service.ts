import { defineProxyService } from '@webext-core/proxy-service';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import { sendMessage } from '@/entrypoints/background/messaging';
import type { SupportedLanguageCode, SummarizerLanguageCode } from '../languages';
import { SUMMARIZER_LANGUAGE_CODES } from '../languages';
import type { SummarizerOptions } from '../model-manager/model-manager.model';

interface ProcessOptions {
  summarize: boolean;
  sourceLanguage: SupportedLanguageCode;
  targetLanguage: SupportedLanguageCode;
}

export class AIService {
  #modelManager = ModelManager.getInstance();

  // TODO: lanzar un error en vez de devolver `undefined`
  async processText(text: string, options: ProcessOptions): Promise<string | undefined> {
    let sendNotification = false;
    let processedText: string | undefined;

    if (options.summarize) {

      // Verificar disponibilidad del modelo
      let modelStatus = await this.#modelManager.checkModelStatus({ type: 'summarization' });

      // Si hay un error (API no disponible), lanzar error
      if (modelStatus.errorMessage) {
        throw new Error(modelStatus.errorMessage);
      }

      if (modelStatus.state === 'downloadable') {
        // Si el resumen requiere descargar un modelo, mostrar estado de descarga
        modelStatus.state = 'downloading';
        sendNotification = true;
        void sendMessage('modelStatusUpdate', modelStatus);
        modelStatus = await this.#modelManager.downloadModel({ type: 'summarization' });
        void sendMessage('modelStatusUpdate', modelStatus);
        if (modelStatus.state !== 'available') {
          console.error(modelStatus.errorMessage);
          return;
        }
      }

      // Lógica para manejar idiomas no soportados por el summarizer
      const isSourceSupported = SUMMARIZER_LANGUAGE_CODES.includes(options.sourceLanguage as SummarizerLanguageCode);
      const isTargetSupported = SUMMARIZER_LANGUAGE_CODES.includes(options.targetLanguage as SummarizerLanguageCode);
      const summarizerDefaultLanguage = SUMMARIZER_LANGUAGE_CODES[0];

      let textToSummarize = text;
      let summarizerInputLanguage: SummarizerLanguageCode = summarizerDefaultLanguage;
      let summarizerOutputLanguage: SummarizerLanguageCode = summarizerDefaultLanguage;

      // Caso 1: Ambos idiomas soportados - resumir directamente
      if (isSourceSupported && isTargetSupported) {
        summarizerInputLanguage = options.sourceLanguage as SummarizerLanguageCode;
        summarizerOutputLanguage = options.targetLanguage as SummarizerLanguageCode;
      }
      // Caso 2: Source no soportado, target sí - traducir input a inglés, resumir en target
      else if (!isSourceSupported && isTargetSupported) {
        textToSummarize = await this.#modelManager.translate(text, options.sourceLanguage, summarizerDefaultLanguage);
        summarizerOutputLanguage = options.targetLanguage as SummarizerLanguageCode;
      }
      // Caso 3: Source sí, target no - resumir en inglés, traducir resumen al target
      else if (isSourceSupported && !isTargetSupported) {
        summarizerInputLanguage = options.sourceLanguage as SummarizerLanguageCode;
        // El resumen se traducirá después
      }
      // Caso 4: Ambos no soportados - traducir input a inglés, resumir en inglés, traducir resumen al target
      else {
        textToSummarize = await this.#modelManager.translate(text, options.sourceLanguage, summarizerDefaultLanguage);
        // El resumen se traducirá después
      }

      const summarizerOptions: SummarizerOptions = {
        type: 'tldr',
        length: 'medium',
        format: 'plain-text',
        expectedInputLanguages: [summarizerInputLanguage],
        outputLanguage: summarizerOutputLanguage
      };
      let summary = await this.#modelManager.summarizeText(textToSummarize, summarizerOptions);

      // Si el target no está soportado, traducir el resumen al idioma objetivo
      if (!isTargetSupported) {
        summary = await this.#modelManager.translate(summary, summarizerDefaultLanguage, options.targetLanguage);
      }

      processedText = summary;
    } else {
      let model = await this.#modelManager.checkModelStatus({ type: 'translation', source: options.sourceLanguage, target: options.targetLanguage });
      // Si hay un error (API no disponible), lanzar error
      if (model.errorMessage) {
        throw new Error(model.errorMessage);
      }
      if (model.state === 'downloadable') {
        // Si la traducción requiere descargar un modelo, mostraremos una notificación al finalizar
        sendNotification = true;
        model.state = 'downloading';
        void sendMessage('modelStatusUpdate', model);
        model = await this.#modelManager.downloadModel({ type: 'translation', source: options.sourceLanguage, target: options.targetLanguage });
        void sendMessage('modelStatusUpdate', model);
        if (model.state !== 'available') {
          console.error(model.errorMessage);
          return;
        }
      }

      processedText = await this.#modelManager.translate(text, options.sourceLanguage, options.targetLanguage);
    }
    if (sendNotification) {
      void browser.notifications.create({
        type: 'basic',
        title: browser.i18n.getMessage('extName'),
        message: browser.i18n.getMessage('textProcessedNotification'),
        iconUrl: 'icons/icon-128.png'
      });
    }
    
    return processedText;
  }

  async detectLanguage(text: string): Promise<string> {
    // Verificar disponibilidad del modelo de detección de idioma
    let modelStatus = await this.#modelManager.checkModelStatus({ type: 'language-detection' });

    if (modelStatus.state === 'downloadable') {
      // Si el modelo es descargable, descargarlo primero
      modelStatus.state = 'downloading';
      void sendMessage('modelStatusUpdate', modelStatus);
      modelStatus = await this.#modelManager.downloadModel({ type: 'language-detection' });
      void sendMessage('modelStatusUpdate', modelStatus);
    }
    return await this.#modelManager.detectLanguage(text);
  }
}

export const [registerAIService, getAIService] = defineProxyService('AIService', () => new AIService());
