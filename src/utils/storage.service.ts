import { browser } from 'wxt/browser';

/**
 * A generic wrapper for the browser.storage.local API.
 * Provides typed methods for getting, setting, removing, and clearing data.
 */
export class StorageService {
  /**
   * Retrieves an item from storage by key.
   * @param key The key of the item to retrieve.
   * @returns A promise that resolves with the item, or null if not found.
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await browser.storage.local.get(key);
      return data[key] ? (data[key] as T) : null;
    } catch (error) {
      console.error(`Error getting item from storage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Saves an item to storage.
   * @param key The key to save the item under.
   * @param value The value to save.
   * @returns A promise that resolves when the item is saved.
   */
  public async set<T>(key: string, value: T): Promise<void> {
    try {
      await browser.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Error setting item in storage (key: ${key}):`, error);
    }
  }

  /**
   * Removes an item from storage by key.
   * @param key The key of the item to remove.
   * @returns A promise that resolves when the item is removed.
   */
  public async remove(key: string): Promise<void> {
    try {
      await browser.storage.local.remove(key);
    } catch (error) {
      console.error(`Error removing item from storage (key: ${key}):`, error);
    }
  }

  /**
   * Clears all items from storage.
   * @returns A promise that resolves when storage is cleared.
   */
  public async clear(): Promise<void> {
    try {
      await browser.storage.local.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storageService = new StorageService();
