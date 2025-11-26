export type ProcessType = 'summarize' | 'translate';

export interface HistoryRecord {
  id: string;           // UUID
  timestamp: number;    // Unix timestamp
  type: ProcessType;
  input: string;        // El texto original
  output: string;       // El resultado de la IA
  metadata?: {
    sourceLanguage?: string;
    targetLanguage?: string;
  };
}
