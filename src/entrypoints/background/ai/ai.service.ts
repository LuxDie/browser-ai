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
  #isNotificationPending = false;
  async #setupModel(
    this: AIService,
    modelParams: Parameters<ModelManager['checkModelStatus']>[0]
  ) {
    // Verificar disponibilidad del modelo
    let modelStatus = await this.#modelManager.checkModelStatus(modelParams);

    // Si hay un error (API no disponible), lanzar error
    if (modelStatus.errorMessage) {
      throw new Error(modelStatus.errorMessage);
    }

    if (modelStatus.state === 'downloadable') {

      // Si la traducción requiere descargar un modelo, mostraremos una notificación al finalizar
      this.#isNotificationPending = true;

      void sendMessage('modelStatusUpdate', { state: 'downloading' });
      modelStatus = await this.#modelManager.downloadModel(modelParams);
      void sendMessage('modelStatusUpdate', modelStatus);
    } else if (modelStatus.state === 'downloading') {

      // Si el modelo ya está descargándose, mostraremos una notificación al finalizar
      this.#isNotificationPending = true;

      void sendMessage('modelStatusUpdate', modelStatus);
    }
  }

  async processText(text: string, options: ProcessOptions): Promise<string> {
    let processedText = text;

    if (options.summarize) {

      await this.#setupModel({ type: 'summarization' });

      // Lógica para manejar idiomas no soportados por el summarizer
      const isSourceSupported = SUMMARIZER_LANGUAGE_CODES.includes(options.sourceLanguage as SummarizerLanguageCode);
      const isTargetSupported = SUMMARIZER_LANGUAGE_CODES.includes(options.targetLanguage as SummarizerLanguageCode);
      const summarizerDefaultLanguage = SUMMARIZER_LANGUAGE_CODES[0];

      processedText = text;
      let summarizerInputLanguage: SummarizerLanguageCode = summarizerDefaultLanguage;
      let summarizerOutputLanguage: SummarizerLanguageCode = summarizerDefaultLanguage;

      // Preparar el texto y idiomas para el summarizer
      if (isSourceSupported) {
        summarizerInputLanguage = options.sourceLanguage as SummarizerLanguageCode;
      } else {
        summarizerInputLanguage = summarizerDefaultLanguage;
        await this.#setupModel({
          type: 'translation',
          source: options.sourceLanguage,
          target: summarizerDefaultLanguage
        });
        processedText = await this.#modelManager.translate(
          processedText,
          options.sourceLanguage,
          summarizerDefaultLanguage
        );
      }

      if (isTargetSupported) {
        summarizerOutputLanguage = options.targetLanguage as SummarizerLanguageCode;
      } else {
        summarizerOutputLanguage = summarizerDefaultLanguage;
      }

      const summarizerOptions: SummarizerOptions = {
        expectedInputLanguages: [summarizerInputLanguage],
        outputLanguage: summarizerOutputLanguage
      };
      processedText = await this.#modelManager.summarize(processedText, summarizerOptions);

      if (summarizerOutputLanguage !== options.targetLanguage) {
        await this.#setupModel({
          type: 'translation',
          source: summarizerDefaultLanguage,
          target: options.targetLanguage
        });
        processedText = await this.#modelManager.translate(processedText, summarizerDefaultLanguage, options.targetLanguage);
      }
    } else { // summarize === false
      await this.#setupModel({
        type: 'translation',
        source: options.sourceLanguage,
        target: options.targetLanguage
      });

      processedText = await this.#modelManager.translate(processedText, options.sourceLanguage, options.targetLanguage);
    }
    
    if (this.#isNotificationPending) {
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
    await this.#setupModel({ type: 'language-detection' });
    return await this.#modelManager.detectLanguage(text);
  }
}

export const [registerAIService, getAIService] =
  defineProxyService('AIService', () => new AIService());
