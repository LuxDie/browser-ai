# Plan de Refactorización - sidepanel.test.ts

## 1. División en Archivos Especializados

### `sidepanel-render.test.ts` (~200 líneas)
- Initial render state
- API status display
- Language selector updates
- UI elements visibility

### `sidepanel-translation.test.ts` (~250 líneas)
- Translation flow (manual and automatic)
- Translation source indicators (local/cloud)
- Translation cancellation
- Translation errors

### `sidepanel-models.test.ts` (~200 líneas)
- Model availability checks
- Model download states
- Model download progress
- Download cancellation
- Model-related error handling

### `sidepanel-languages.test.ts` (~200 líneas)
- Language detection flow
- Browser language detection
- Language selector behavior
- Language change handling
- Same language validation

## 2. Archivo de Helpers Compartidos

### `sidepanel.test.helpers.ts`
```typescript
// Setup helpers
export const setupTextInput = async (text: string): Promise => {
  const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
  textarea.value = text;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.runAllTimersAsync();
};

export const setupLanguageDetection = async (language: string): Promise => {
  simulateRuntimeMessage({ 
    type: 'LANGUAGE_DETECTED', 
    data: { language } 
  });
  await vi.runAllTimersAsync();
};

export const selectTargetLanguage = async (languageCode: string): Promise => {
  const targetSelect = document.getElementById('target-language') as HTMLSelectElement;
  targetSelect.value = languageCode;
  targetSelect.dispatchEvent(new Event('change'));
  await vi.runAllTimersAsync();
};

export const clickTranslateButton = async (): Promise => {
  const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
  translateButton.click();
  await vi.runAllTimersAsync();
};

// Assertion helpers
export const expectTranslateButtonState = (
  disabled: boolean, 
  text: string
): void => {
  const button = document.getElementById('translate-button') as HTMLButtonElement;
  expect(button.disabled).toBe(disabled);
  expect(button.textContent?.trim()).toBe(text);
};

export const expectModelStatusVisible = (visible: boolean): void => {
  const container = document.getElementById('model-status-container');
  if (visible) {
    expect(container?.innerHTML).toBeTruthy();
  } else {
    expect(container?.innerHTML).toBeFalsy();
  }
};

// Mock factories
export const createMockTranslationResponse = (
  text: string,
  sourceLanguage = 'en',
  targetLanguage = 'es',
  usingCloud = false
) => ({
  translatedText: `${text} (translated)`,
  sourceLanguage,
  targetLanguage,
  usingCloud
});

export const createMockLanguages = () => [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' }
];
```

## 3. Correcciones de Asincronía

### Antes (❌):
```typescript
case 'translateTextRequest':
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ translatedText: '...' });
    }, 50);
  });
```

### Después (✅):
```typescript
case 'translateTextRequest':
  // Si necesitas simular delay para un test específico, usa vi.advanceTimersByTimeAsync
  return Promise.resolve({
    translatedText: typeof payload.text === 'string'
      ? `${payload.text} (translated)`
      : 'Texto traducido',
    sourceLanguage: typeof payload.sourceLanguage === 'string' 
      ? payload.sourceLanguage 
      : 'en',
    targetLanguage: typeof payload.targetLanguage === 'string' 
      ? payload.targetLanguage 
      : 'es',
    usingCloud: false
  });
```

## 4. Mejora de Type Safety

### Antes (❌):
```typescript
(sendMessage as any).mockImplementation(defaultSendMessageImplementation);
```

### Después (✅):
```typescript
import { vi, type MockedFunction } from 'vitest';

const mockSendMessage = sendMessage as MockedFunction;
mockSendMessage.mockImplementation(defaultSendMessageImplementation);
```

## 5. Tests más Específicos

### Antes (❌):
```typescript
it('should render the initial state correctly', () => {
  const root = document.getElementById('root');
  expect(root?.innerHTML).toContain('Browser AI');
  const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
  expect(textarea.value).toBe('');
  const translateButton = document.getElementById('translate-button') as HTMLButtonElement;
  expect(translateButton.disabled).toBe(true);
});
```

### Después (✅):
```typescript
describe('Initial Render', () => {
  it('should render header with title and description', () => {
    const root = document.getElementById('root');
    expect(root?.innerHTML).toContain('Browser AI');
    expect(root?.innerHTML).toContain('Traducción con IA integrada');
  });

  it('should render empty input textarea', () => {
    const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('should render disabled translate button initially', () => {
    expectTranslateButtonState(true, 'Traducir');
  });
});
```

## 6. Estructura de Carpetas Propuesta

```
tests/
├── sidepanel/
│   ├── helpers/
│   │   ├── setup.ts
│   │   ├── assertions.ts
│   │   └── mocks.ts
│   ├── sidepanel-render.test.ts
│   ├── sidepanel-translation.test.ts
│   ├── sidepanel-models.test.ts
│   └── sidepanel-languages.test.ts
```

## Prioridades

1. **Alta**: Eliminar `setTimeout` (viola guía de TypeScript)
2. **Alta**: Dividir archivo (excede 800 líneas)
3. **Media**: Mejorar type safety
4. **Media**: Crear helpers compartidos
5. **Baja**: Refinar nombres de tests
