
export interface ModelStatus {
  available: boolean;
  downloading: boolean;
  progress?: number;
  error?: string;
}

export interface AvailableLanguagesResponse {
  languages: Array<{ code: string; name: string }>;
}

export interface ModelAvailabilityResponse {
  status: ModelStatus;
}

export interface ModelDownloadProgress {
  progress: number;
}

export interface ModelDownloadError {
  error: string;
}

export interface ModelNotAvailable {
  error: string;
}

export interface ModelDownloading {
  progress: number;
}

export interface TranslationCompleted {
  translatedText: string;
  usingCloud?: boolean;
}

export interface TranslationError {
  error: string;
}

export interface CloudAPINotConfigured {
  message: string;
}

export interface LanguageDetected {
  language: string;
}

export interface LanguageDetectionError {
  error: string;
}
