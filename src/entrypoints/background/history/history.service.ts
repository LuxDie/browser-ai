import { storageService, StorageService } from '@/utils/storage.service';
import { HistoryRecord } from './history.model';

const STORAGE_KEY_HISTORY = 'ai_processing_history';
const MAX_HISTORY_RECORDS = 50;

/**
 * Service to manage the history of AI processing records.
 */
export class HistoryService {
  constructor(private storage: StorageService) {}

  /**
   * Adds a new record to the history.
   * It automatically generates an ID and a timestamp.
   * If the history exceeds the maximum limit, the oldest records are removed.
   * @param record The partial record to add (without id and timestamp).
   * @returns A promise that resolves when the record is added.
   */
  public async addRecord(record: Omit<HistoryRecord, 'id' | 'timestamp'>): Promise<void> {
    const newRecord: HistoryRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const history = (await this.getHistory()) || [];
    history.unshift(newRecord);

    if (history.length > MAX_HISTORY_RECORDS) {
      history.splice(MAX_HISTORY_RECORDS);
    }

    await this.storage.set(STORAGE_KEY_HISTORY, history);
  }

  /**
   * Retrieves the full list of history records.
   * @returns A promise that resolves with the list of records, or null if none.
   */
  public async getHistory(): Promise<HistoryRecord[] | null> {
    return this.storage.get<HistoryRecord[]>(STORAGE_KEY_HISTORY);
  }

  /**
   * Clears the entire history.
   * @returns A promise that resolves when the history is cleared.
   */
  public async clearHistory(): Promise<void> {
    await this.storage.remove(STORAGE_KEY_HISTORY);
  }
}

export const historyService = new HistoryService(storageService);
