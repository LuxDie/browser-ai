import { defineProxyService } from '@webext-core/proxy-service';
import { ModelManager } from '@/entrypoints/background/model-manager/model-manager.service';
import { sendMessage } from '@/entrypoints/background/messaging';
import { LanguageService } from '../language/language.service';
import type { SupportedLanguageCode, SummarizerLanguageCode } from '../language/language.service';
import type { SummarizerOptions } from '../model-manager/model-manager.model';

interface ProcessOptions {
  summarize: boolean;
  sourceLanguage: SupportedLanguageCode;
  targetLanguage: SupportedLanguageCode;
}

export class AIService {
  #modelManager = ModelManager.getInstance();
  #languageService = LanguageService.getInstance();
  #abortController = new AbortController();

  cancelProcessing(): void {
    this.#abortController.abort();
    this.#abortController = new AbortController();
  }

  async #setupModel(
    modelParams: Parameters<ModelManager['checkModelStatus']>[0]
  ): Promise<boolean> {
    let downloadTriggered = false;
    // Verificar disponibilidad del modelo
    let modelStatus = await this.#modelManager.checkModelStatus(modelParams);

    // Si hay un error (API no disponible), lanzar error
    if (modelStatus.errorMessage) {
      throw new Error(modelStatus.errorMessage);
    }

    if (modelStatus.state === 'downloadable') {

      // Si la traducción requiere descargar un modelo, mostraremos una notificación al finalizar
      downloadTriggered = true;

      void sendMessage('modelStatusUpdate', { state: 'downloading' });
      const progressCallback: CreateMonitorCallback = (monitor) => {
        monitor.addEventListener('downloadprogress', (event) => {
          void sendMessage('modelStatusUpdate', {
            state: 'downloading',
            downloadProgress: Math.round(event.loaded * 100)
          });
        });
      };
      modelStatus = await this.#modelManager.downloadModel(
        modelParams,
        progressCallback,
        { signal: this.#abortController.signal },
      );
      void sendMessage('modelStatusUpdate', modelStatus);
    } else if (modelStatus.state === 'downloading') {

      // Si el modelo ya está descargándose, mostraremos una notificación al finalizar
      downloadTriggered = true;

      void sendMessage('modelStatusUpdate', modelStatus);
    }
    return downloadTriggered;
  }

  async processText(text: string, options: ProcessOptions): Promise<string> {
    let processedText = text;
    let notificationPending = false;

    if (options.summarize) {

      notificationPending = await this.#setupModel({ type: 'summarization' });

      // Lógica para manejar idiomas no soportados por el summarizer
      const summarizerLanguages = this.#languageService.getSummarizerLanguageCodes();
      const summarizerDefaultLanguage = summarizerLanguages[0];

      processedText = text;
      let summarizerInputLanguage: SummarizerLanguageCode = summarizerDefaultLanguage;
      let summarizerOutputLanguage: SummarizerLanguageCode = summarizerDefaultLanguage;

      // Preparar el texto y idiomas para el summarizer
      if (this.#languageService.isSummarizerLanguage(options.sourceLanguage)) {
        summarizerInputLanguage = options.sourceLanguage;
      } else {
        summarizerInputLanguage = summarizerDefaultLanguage;
        notificationPending = await this.#setupModel({
          type: 'translation',
          source: options.sourceLanguage,
          target: summarizerDefaultLanguage
        });
        processedText = await this.#modelManager.translate(
          processedText,
          options.sourceLanguage,
          summarizerDefaultLanguage,
          { signal: this.#abortController.signal }
        );
      }

      if (this.#languageService.isSummarizerLanguage(options.targetLanguage)) {
        summarizerOutputLanguage = options.targetLanguage;
      } else {
        summarizerOutputLanguage = summarizerDefaultLanguage;
      }

      const summarizerOptions: SummarizerOptions = {
        expectedInputLanguages: [summarizerInputLanguage],
        outputLanguage: summarizerOutputLanguage
      };
      processedText = await this.#modelManager
        .summarize(
          processedText,
          summarizerOptions,
          { signal: this.#abortController.signal },
        );

      if (summarizerOutputLanguage !== options.targetLanguage) {
        notificationPending = await this.#setupModel({
          type: 'translation',
          source: summarizerDefaultLanguage,
          target: options.targetLanguage
        });
        processedText = await this.#modelManager
          .translate(
            processedText,
            summarizerDefaultLanguage,
            options.targetLanguage,
            { signal: this.#abortController.signal },
          );
      }
    } else { // summarize === false
      notificationPending = await this.#setupModel({
        type: 'translation',
        source: options.sourceLanguage,
        target: options.targetLanguage
      });

      processedText = await this.#modelManager
        .translate(
          processedText,
          options.sourceLanguage,
          options.targetLanguage,
          { signal: this.#abortController.signal },
        );
    }

    if (notificationPending) {
      // TODO: separar responsabilidad
      void browser.notifications.create({
        type: 'basic',
        title: t('extName'),
        message: t('textProcessedNotification'),
        iconUrl: 'icons/icon-128.png'
      });
    }

    return processedText;
  }

  async detectLanguage(text: string): Promise<string> {
    await this.#setupModel({ type: 'language-detection' });
    return await this.#modelManager
      .detectLanguage(text, { signal: this.#abortController.signal });
  }
  checkAPIAvailability(): boolean {
    return this.#modelManager.checkAPIAvailability();
  }
}

export const [registerAIService, getAIService] = defineProxyService(
  'AIService',
  () => new AIService()
);
