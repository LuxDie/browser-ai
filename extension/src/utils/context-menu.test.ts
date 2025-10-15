import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  isValidContextMenuInput,
  isSidePanelOpen,
  createContextMenuStorageData,
  createNotificationScriptParams,
  generateNotificationHTML,
  truncateTextForNotification,
  determineContextMenuBehavior
} from '@/utils';

describe('Context Menu Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Context Menu Logic', () => {
    it('should validate context menu input correctly', () => {

      // Valid input
      expect(isValidContextMenuInput('translate-selected-text', 'Hello world', { id: 123, windowId: 456 })).toBe(true);
      
      // Invalid menu item
      expect(isValidContextMenuInput('wrong-menu', 'Hello world', { id: 123, windowId: 456 })).toBe(false);
      
      // Missing selection text
      expect(isValidContextMenuInput('translate-selected-text', undefined, { id: 123, windowId: 456 })).toBe(false);
      
      // Empty selection text
      expect(isValidContextMenuInput('translate-selected-text', '', { id: 123, windowId: 456 })).toBe(false);
      
      // Missing tab
      expect(isValidContextMenuInput('translate-selected-text', 'Hello world', undefined)).toBe(false);
      
      // Missing tab id
      expect(isValidContextMenuInput('translate-selected-text', 'Hello world', { id: undefined as unknown as number, windowId: 456 })).toBe(false);
    });

    it('should determine side panel state correctly', () => {
      const sidePanelState: Record<number, boolean> = {};

      // Panel closed by default
      expect(isSidePanelOpen(123, sidePanelState)).toBe(false);
      
      // Panel open
      sidePanelState[123] = true;
      expect(isSidePanelOpen(123, sidePanelState)).toBe(true);
      
      // Panel explicitly closed
      sidePanelState[123] = false;
      expect(isSidePanelOpen(123, sidePanelState)).toBe(false);
    });

    it('should create correct storage data for context menu', () => {

      const selectedText = 'Hello world';
      const expectedData = {
        selectedText: selectedText,
        fromContextMenu: true,
        autoTranslate: true
      };

      expect(createContextMenuStorageData(selectedText)).toEqual(expectedData);
    });

    it('should create notification script parameters correctly', () => {

      const tabId = 123;
      const selectedText = 'Test text';
      const params = createNotificationScriptParams(tabId, selectedText);

      expect(params.target).toEqual({ tabId });
      expect(params.args).toEqual([selectedText]);
      expect(typeof params.func).toBe('function');
    });
  });

  describe('Notification Content Generation', () => {
    it('should generate correct notification HTML structure', () => {

      const shortText = 'Hello world';
      const longText = 'A'.repeat(250);
      
      const shortHTML = generateNotificationHTML(shortText);
      const longHTML = generateNotificationHTML(longText);

      // Check that both contain essential elements
      expect(shortHTML).toContain('Browser AI');
      expect(shortHTML).toContain('Abrir Traductor');
      expect(shortHTML).toContain(shortText);
      
      expect(longHTML).toContain('Browser AI');
      expect(longHTML).toContain('Abrir Traductor');
      expect(longHTML).toContain('A'.repeat(200) + '...');
    });

    it('should handle text truncation correctly', () => {

      const shortText = 'Hello';
      const longText = 'A'.repeat(250);
      const exactLengthText = 'B'.repeat(200);

      expect(truncateTextForNotification(shortText)).toBe('Hello');
      expect(truncateTextForNotification(longText)).toBe('A'.repeat(200) + '...');
      expect(truncateTextForNotification(exactLengthText)).toBe('B'.repeat(200));
    });
  });

  describe('Context Menu Flow Logic', () => {
    it('should determine correct behavior based on side panel state', () => {

      // Panel closed - should show notification
      expect(determineContextMenuBehavior(false, 'Hello', 123)).toEqual({
        action: 'show_notification',
        reason: 'panel_closed',
        shouldShowNotification: true
      });

      // Panel open - should update directly
      expect(determineContextMenuBehavior(true, 'Hello', 123)).toEqual({
        action: 'update_directly',
        reason: 'panel_open',
        shouldShowNotification: false
      });

      // Invalid input - should do nothing
      expect(determineContextMenuBehavior(false, '', 123)).toEqual({
        action: 'none',
        reason: 'invalid_input'
      });

      expect(determineContextMenuBehavior(false, 'Hello', 0)).toEqual({
        action: 'none',
        reason: 'invalid_input'
      });
    });
  });
});
