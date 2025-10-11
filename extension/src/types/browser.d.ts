// Chrome AI APIs - Extensiones de tipos globales para APIs experimentales
// Los tipos base están definidos en @types/dom-chromium-ai

// Extender el tipo Self para incluir las APIs de Chrome AI
interface Self {
  LanguageModel: typeof LanguageModel
  Translator: typeof Translator
  LanguageDetector: typeof LanguageDetector
  Summarizer: typeof Summarizer
  Writer: typeof Writer
  Rewriter: typeof Rewriter
  Proofreader: typeof Proofreader
}

// Extender el tipo global Window para APIs de Chrome AI
interface Window {
  LanguageModel: typeof LanguageModel
  Translator: typeof Translator
  LanguageDetector: typeof LanguageDetector
  Summarizer: typeof Summarizer
  Writer: typeof Writer
  Rewriter: typeof Rewriter
  Proofreader: typeof Proofreader
}

// Extender ServiceWorkerGlobalScope para APIs de Chrome AI
interface ServiceWorkerGlobalScope {
  LanguageModel: typeof LanguageModel
  Translator: typeof Translator
  LanguageDetector: typeof LanguageDetector
  Summarizer: typeof Summarizer
  Writer: typeof Writer
  Rewriter: typeof Rewriter
  Proofreader: typeof Proofreader
}

// Tipos para mensajes de Chrome Extension
interface ChromeMessage {
  type: string
  data?: unknown
}

interface ModelStatus {
  available: boolean
  downloading: boolean
  progress?: number
  error?: string
}

interface PendingTranslation {
  text: string
  sourceLanguage: string
  targetLanguage: string
}

interface AvailableLanguagesResponse {
  languages: Array<{ code: string; name: string }>
}

interface ModelAvailabilityResponse {
  source: string
  target: string
  status: ModelStatus
}

interface ModelDownloadProgress {
  source: string
  target: string
  progress: number
}

interface ModelDownloadCompleted {
  source: string
  target: string
}

interface ModelDownloadError {
  source: string
  target: string
  error: string
}

interface ModelDownloadCancelled {
  source: string
  target: string
}

interface TranslationCompleted {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  usingCloud?: boolean
}

interface TranslationError {
  error: string
}

interface CloudAPINotConfigured {
  message: string
}

interface LanguageDetected {
  language: string
}

// Extender tipos de Chrome para testing
declare namespace chrome {
  namespace runtime {
    interface ExtensionMessageEvent {
      trigger?: (message: ChromeMessage) => void
    }
  }
}
