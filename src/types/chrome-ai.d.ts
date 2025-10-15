interface LanguageDetectionResult {
  confidence: number;
  detectedLanguage: string;
}

interface LanguageDetector {
  detect(text: string): Promise<LanguageDetectionResult[]>;
}

interface LanguageDetectorConstructor {
  create(): Promise<LanguageDetector>;
}

interface Translator {
  translate(text: string): Promise<string>;
}

interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslatorConstructor {
  create(options: TranslatorOptions): Promise<Translator>;
}

declare global {
    interface Window {
        LanguageDetector: LanguageDetectorConstructor;
        Translator: TranslatorConstructor;
    }
}

export {};
