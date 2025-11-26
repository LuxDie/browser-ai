# Plan de Implementación: Capa de Persistencia e Historial

## Contexto
El objetivo es dotar a la extensión de "memoria" persistente. Actualmente, los procesamientos de IA son efímeros. Necesitamos implementar un sistema robusto para almacenar datos localmente usando la API nativa de extensiones (`browser.storage`), abstrayendo la complejidad en servicios reutilizables.

## Arquitectura Propuesta
1.  **`StorageService`**: Un wrapper genérico y fuertemente tipado sobre `browser.storage.local`. Su única responsabilidad es leer y escribir datos crudos sin conocer la lógica de negocio.
2.  **`HistoryService`**: Un servicio de dominio que utiliza `StorageService`. Gestiona la entidad `HistoryRecord`, encargándose de añadir registros, recuperar el listado ordenado y limpiar datos antiguos.

---

## Pasos de Ejecución

### Paso 1: Definición de Tipos y Modelos
Antes de la lógica, debemos definir las estructuras de datos.
*   **Archivo:** `src/entrypoints/background/history/history.model.ts`
*   **Tarea:** Definir la interfaz `HistoryRecord` siguiendo la convención del proyecto de usar archivos `*.model.ts` dentro del módulo del servicio.
    ```typescript
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
    ```

### Paso 2: Implementación de `StorageService`
Este servicio debe ser agnóstico al tipo de dato.
*   **Ubicación:** `src/utils/storage.service.ts`
*   **Requisitos:**
    *   Utilizar `browser.storage.local` (asegurar compatibilidad con el namespace de WXT/WebExtension).
    *   Métodos requeridos:
        *   `get<T>(key: string): Promise<T | null>`
        *   `set<T>(key: string, value: T): Promise<void>`
        *   `remove(key: string): Promise<void>`
        *   `clear(): Promise<void>`
    *   Manejo de errores (try/catch) para evitar que fallos de I/O rompan la UI.

### Paso 3: Implementación de `HistoryService`
Este servicio contendrá la lógica de negocio del historial.
*   **Ubicación:** `src/entrypoints/background/history/history.service.ts`
*   **Dependencias:** `StorageService`.
*   **Constantes:** Definir una key constante, e.g., `STORAGE_KEY_HISTORY = 'ai_processing_history'`.
*   **Funcionalidad:**
    *   **`addRecord(record: Omit<HistoryRecord, 'id' | 'timestamp'>)`**: Debe generar el ID (usar `crypto.randomUUID()`) y el timestamp automáticamente, obtener el historial actual, añadir el nuevo al principio (unshift) y guardar.
    *   **`getHistory()`**: Devuelve la lista completa.
    *   **`clearHistory()`**: Borra la clave específica del historial.
    *   **Límite de Historial**: Implementar obligatoriamente un límite de 50 registros. Al añadir uno nuevo, si la lista excede 50, eliminar los más antiguos antes de guardar.

### Paso 4: Tests Unitarios (Crítico)
Dado que `browser.storage` es una API del navegador, **debe ser mockeada** para los tests.
*   **Archivo de Mock:** `src/tests/mocks/browser-api.mock.ts`.
    *   **Acción**: Actualizar este archivo centralizado para incluir mocks de `browser.storage.local` (métodos `get`, `set`, `remove`, `clear`).
*   **Archivo:** `src/utils/storage.service.test.ts`
    *   Testear que `get` llama a `browser.storage.local.get` a través del mock centralizado.
    *   Testear que `set` guarda los datos correctamente.
*   **Archivo:** `src/entrypoints/background/history/history.service.test.ts`
    *   Testear que `addRecord` crea un ID y timestamp.
    *   Testear que el límite de 50 registros se respeta (añadir 51 y verificar que quedan 50).
    *   Testear que se persiste la información acumulada.

### Paso 5: Barril de Exportación
*   Actualizar o crear archivos `index.ts` en las carpetas correspondientes para facilitar las importaciones limpias en el resto de la aplicación.

---

## Notas para el Desarrollador
1.  **Tipado Estricto:** No usar `any`. Asegurar que `StorageService` use genéricos `<T>`.
2.  **Mocking Centralizado:** Utilizar `src/tests/mocks/browser-api.mock.ts` para todo lo relacionado con la API `browser`.
3.  **Persistencia Asíncrona:** Todas las operaciones de almacenamiento son asíncronas. Asegúrate de usar `async/await` correctamente.

---

### Orden de Comandos Sugerido

1.  Crear directorio `src/entrypoints/background/history/`.
2.  Crear `src/entrypoints/background/history/history.model.ts`.
3.  Crear `src/utils/storage.service.ts`.
4.  Actualizar `src/tests/mocks/browser-api.mock.ts` con mocks de storage.
5.  Crear `src/utils/storage.service.test.ts`.
6.  Crear `src/entrypoints/background/history/history.service.ts`.
7.  Crear `src/entrypoints/background/history/history.service.test.ts`.
8.  Ejecutar `npm run test` para validar.