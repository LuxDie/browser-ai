## 0.3.0-beta.1 (2025-12-03)

### Features

- **sidepanel:** Migrate sidepanel from Tailwind CSS to Vuetify (e9a5cc9)
- **sidepanel:** Implement cancellation of ongoing AI processing (a74b9be)
- **sidepanel:** Add cancel button to ModelDownloadCard (f5d4107)
- **sidepanel:** Add progress indicator component for model downloads (31e1de3)
- **ai:** Add cancellation support for AI processing operations (41b10f1)
- **ai:** Add progress updates during model downloads (176e82a)

### Bug Fixes

- **sidepanel:** Await text validation before processing selected text (3d58613)
- **sidepanel:** Clear global event listeners on unmount (a0c93bb)
- **sidepanel:** Open sidepanel for specific tabs (c5b24b3)
- **ai:** Correct hardcoded fallback language in AI service intermediate translation (2824287)
- **core:** Add validation for unsupported detected languages (9c14dc3)
- **types:** Correctly load WXT's types (e9061db)

### Refactoring

- **sidepanel:** Migrate SidepanelApp to Vue and add tests (551f2b0)
- **sidepanel:** Extensive component extraction and reorganization (LanguageSelector, SummarizeOption, ProcessControls, OutputArea, InputArea, etc.)
- **core:** Simplify AI service interaction by removing messaging layer (a785d7a)
- **core:** Unify AI model management and language detection (257f8a3)
- **core:** Replace `browser.i18n.getMessage` with `t` function for consistency (18f3014)
- **lang:** Extract and centralize language handling into dedicated service (254a0fb)
- **messaging:** Simplify inter-component message interfaces (472d97c)

### Documentation

- **dev:** Add comprehensive TSDoc documentation throughout codebase (17f5333)
- **dev:** Update ADRs 0002 and 0005 for cancellation and progress indicator support (54b9d4e)
- **dev:** Update agent guidelines, workflows, and code quality rules (622087f, fe8fc46, f97bdbb)

### Testing

- **unit:** Migrate translation logic from message handlers to AIService (0efc877)
- **unit:** Localize test strings to Spanish (ed9e96b)
- **mock:** Centralize and improve browser API mocks (82f9273, db65b6a, 621f29d)

### Chore

- **lint:** Add eslint-plugin-vue and improve template formatting (c527aaa)
- **deps:** Fix package vulnerabilities (0128e84)
- **config:** Update ESLint and TypeScript configurations for improved type safety (4894144)
