import { describe, it, expect, beforeEach } from 'vitest';
import { browser } from 'wxt/browser';
import { storageService } from './storage.service';

describe('StorageService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should get an item from storage', async () => {
    const key = 'test-key';
    const value = { data: 'test-value' };
    (browser.storage.local.get as any).mockResolvedValue({ [key]: value });

    const result = await storageService.get(key);

    expect(browser.storage.local.get).toHaveBeenCalledWith(key);
    expect(result).toEqual(value);
  });

  it('should return null when getting a non-existent item', async () => {
    const key = 'non-existent-key';
    (browser.storage.local.get as any).mockResolvedValue({});

    const result = await storageService.get(key);

    expect(browser.storage.local.get).toHaveBeenCalledWith(key);
    expect(result).toBeNull();
  });

  it('should set an item in storage', async () => {
    const key = 'test-key';
    const value = { data: 'test-value' };

    await storageService.set(key, value);

    expect(browser.storage.local.set).toHaveBeenCalledWith({ [key]: value });
  });

  it('should remove an item from storage', async () => {
    const key = 'test-key';

    await storageService.remove(key);

    expect(browser.storage.local.remove).toHaveBeenCalledWith(key);
  });

  it('should clear all items from storage', async () => {
    await storageService.clear();

    expect(browser.storage.local.clear).toHaveBeenCalled();
  });
});
