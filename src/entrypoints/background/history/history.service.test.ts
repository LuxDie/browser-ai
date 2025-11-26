import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryService } from './history.service';
import { StorageService } from '@/utils/storage.service';
import { HistoryRecord } from './history.model';

// Mock StorageService
const mockStorageService = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
};

describe('HistoryService', () => {
  let historyService: HistoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    historyService = new HistoryService(mockStorageService as unknown as StorageService);
  });

  it('should add a record and generate id and timestamp', async () => {
    mockStorageService.get.mockResolvedValue([]);
    const recordToAdd = {
      type: 'summarize',
      input: 'This is a test input.',
      output: 'This is a test output.',
    } as Omit<HistoryRecord, 'id' | 'timestamp'>;

    await historyService.addRecord(recordToAdd);

    expect(mockStorageService.set).toHaveBeenCalledTimes(1);
    const savedHistory = mockStorageService.set.mock.calls[0][1];
    expect(savedHistory).toHaveLength(1);
    expect(savedHistory[0]).toMatchObject(recordToAdd);
    expect(savedHistory[0].id).toBeDefined();
    expect(savedHistory[0].timestamp).toBeDefined();
  });

  it('should get the history', async () => {
    const mockHistory: HistoryRecord[] = [
      { id: '1', timestamp: Date.now(), type: 'summarize', input: 'in1', output: 'out1' },
    ];
    mockStorageService.get.mockResolvedValue(mockHistory);

    const history = await historyService.getHistory();

    expect(mockStorageService.get).toHaveBeenCalledWith('ai_processing_history');
    expect(history).toEqual(mockHistory);
  });

  it('should clear the history', async () => {
    await historyService.clearHistory();

    expect(mockStorageService.remove).toHaveBeenCalledWith('ai_processing_history');
  });

  it('should respect the history limit of 50 records', async () => {
    const existingHistory: HistoryRecord[] = Array.from({ length: 50 }, (_, i) => ({
      id: `id-${i}`,
      timestamp: Date.now() - i,
      type: 'translate',
      input: `input-${i}`,
      output: `output-${i}`,
    }));
    mockStorageService.get.mockResolvedValue(existingHistory);

    const newRecord = {
      type: 'summarize',
      input: 'new input',
      output: 'new output',
    } as Omit<HistoryRecord, 'id' | 'timestamp'>;

    await historyService.addRecord(newRecord);

    expect(mockStorageService.set).toHaveBeenCalledTimes(1);
    const savedHistory = mockStorageService.set.mock.calls[0][1];
    expect(savedHistory).toHaveLength(50);
    expect(savedHistory[0].input).toBe('new input');
    expect(savedHistory[49].input).toBe('input-48');
  });
});
