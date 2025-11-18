# Adición de APIs de IA de navegador faltantes

**Session ID:** ses_568f38ceaffebjvm0yKy007uNw
**Created:** 11/18/2025, 9:59:26 AM
**Updated:** 11/18/2025, 10:04:50 AM

---

## User

---

## Assistant

```
Tool: bash
```

---

## User

Debemos incorporar al AIService las APIs de IA de navegador faltantes, a saber: Writer, Rewriter, Proofreader y Prompt.

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: grep
```

---

## Assistant

```
Tool: grep
```

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: grep
```

---

## Assistant

```
Tool: grep
```

---

## Assistant

```
Tool: read
```

---

## Assistant

```
Tool: todowrite
```

---

## Assistant

## Plan for Incorporating Missing Browser AI APIs

Based on my analysis of the current codebase, here's what needs to be done to incorporate the Writer, Rewriter, Proofreader, and Prompt APIs into the AIService:

### Current Architecture Analysis

The current system has:
- **ModelManager**: Handles browser AI API initialization, model status checking, downloading, and execution
- **AIService**: Orchestrates text processing operations (translation, summarization, language detection)
- **Supported APIs**: Currently only Translator, Summarizer, and LanguageDetector

### Required Changes

#### 1. Update ModelManager Types and Initialization

**File**: `src/entrypoints/background/model-manager/model-manager.service.ts`

Add the new API types to the `browserAPIs` interface:
```typescript
#browserAPIs: {
  languageDetector: typeof LanguageDetector | null
  translator: typeof Translator | null
  summarizer: typeof Summarizer | null
  writer: typeof Writer | null           // NEW
  rewriter: typeof Rewriter | null       // NEW  
  proofreader: typeof Proofreader | null // NEW
  prompt: typeof Prompt | null           // NEW
}
```

Initialize them in the constructor:
```typescript
constructor() {
  this.#browserAPIs.languageDetector = 'LanguageDetector' in self ? LanguageDetector : null;
  this.#browserAPIs.translator = 'Translator' in self ? Translator : null;
  this.#browserAPIs.summarizer = 'Summarizer' in self ? Summarizer : null;
  this.#browserAPIs.writer = 'ai' in self && 'writer' in self.ai ? self.ai.writer : null;        // NEW
  this.#browserAPIs.rewriter = 'ai' in self && 'rewriter' in self.ai ? self.ai.rewriter : null;  // NEW
  this.#browserAPIs.proofreader = 'ai' in self && 'proofreader' in self.ai ? self.ai.proofreader : null; // NEW
  this.#browserAPIs.prompt = 'ai' in self && 'prompt' in self.ai ? self.ai.prompt : null;        // NEW
}
```

#### 2. Add Model Status Checking

Update the `checkModelStatus` method to handle the new API types:
```typescript
async checkModelStatus(config:
  { type: 'language-detection' } |
  { type: 'translation'; source: SupportedLanguageCode; target: SupportedLanguageCode } |
  { type: 'summarization' } |
  { type: 'writer' } |           // NEW
  { type: 'rewriter' } |         // NEW
  { type: 'proofreader' } |      // NEW
  { type: 'prompt' }             // NEW
): Promise<AIModelStatus>
```

Add cases for each new API type, similar to the existing summarizer case.

#### 3. Add Model Downloading

Update the `downloadModel` method signature and implementation to support the new APIs.

#### 4. Add API Methods to ModelManager

Add new methods for each API:
- `async write(text: string, options?: WriterOptions): Promise<string>`
- `async rewrite(text: string, options?: RewriterOptions): Promise<string>`  
- `async proofread(text: string, options?: ProofreaderOptions): Promise<string>`
- `async prompt(text: string, options?: PromptOptions): Promise<string>`

#### 5. Update AIService

**File**: `src/entrypoints/background/ai/ai.service.ts`

Add new methods to AIService:
- `async write(text: string): Promise<string>`
- `async rewrite(text: string): Promise<string>`
- `async proofread(text: string): Promise<string>`
- `async prompt(text: string): Promise<string>`

Each method should follow the same pattern as existing methods: setup model, execute operation, handle notifications.

#### 6. Update API Availability Check

Update `checkAPIAvailability()` to include the new APIs:
```typescript
checkAPIAvailability(): boolean {
  return !!(
    this.#browserAPIs.languageDetector ?? 
    this.#browserAPIs.translator ?? 
    this.#browserAPIs.summarizer ??
    this.#browserAPIs.writer ??        // NEW
    this.#browserAPIs.rewriter ??      // NEW
    this.#browserAPIs.proofreader ??   // NEW
    this.#browserAPIs.prompt           // NEW
  );
}
```

#### 7. Update Tests

**File**: `src/entrypoints/background/ai/ai.service.test.ts`

Add test cases for each new method, following the existing patterns for translation and summarization tests.

### API Specifications (Based on Chrome AI Standards)

- **Writer API**: Generates new text content based on prompts
- **Rewriter API**: Rewrites existing text while maintaining meaning
- **Proofreader API**: Corrects grammar, spelling, and style issues
- **Prompt API**: General-purpose AI interaction for custom prompts

### Implementation Notes

1. **Error Handling**: Each API should handle cases where the browser API is unavailable
2. **Model Management**: Follow the same download-on-demand pattern as existing APIs
3. **Notifications**: Send appropriate notifications when models are downloaded
4. **Internationalization**: Use `browser.i18n.getMessage()` for error messages
5. **Type Safety**: Leverage the `@types/dom-chromium-ai` package for proper typing

This plan maintains consistency with the existing architecture while extending functionality to support all major Chrome AI APIs.

---

## User

No se usa `self.ai`, se usa la clase global, por ej: `Writer`, `Writer.create`, etc.

---

## Assistant

---

