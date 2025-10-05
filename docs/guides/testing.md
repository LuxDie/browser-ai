# Estrategia de Pruebas

## Principios
- Toda funcionalidad nueva requiere pruebas unitarias
- Casos felices y casos borde relevantes
- Mantener o aumentar cobertura global; justificar reducciones
- Pruebas deben correr y pasar en CI antes de merge

## Niveles
- Unitarias: lógica pura (transformaciones, selección de proveedor)
- Integración ligera: comunicación panel ↔ background (mock de APIs de navegador)
- E2E manuales mínimos: checklist en `docs/roadmap.md`

## Estructura de Archivos de Pruebas

El proyecto mantiene pruebas organizadas en archivos especializados por funcionalidad:

### `text-validation.test.ts`
- Validación de texto para traducción
- Rechazo de URLs, emails, números
- Longitud mínima de texto
- Filtros de entrada

### `language-validation.test.ts`
- Validación estricta de códigos ISO 639-1 (2 letras)
- Rechazo de valores inválidos (`Auto`, `auto`, `eng`, etc.)
- Validación de pares de idiomas (origen-destino)
- Prevención de renderizado con códigos inválidos


### `context-menu.test.ts`
- Lógica del menú contextual
- Validación de input del menú
- Generación de notificaciones HTML
- Truncamiento de texto
- Flujo según estado del panel lateral

### `translation-core.test.ts`
- Detección de idiomas con LanguageDetector API
- Traducción con Translator API
- Operaciones de almacenamiento (Storage API)
- Validación de códigos de idioma
- Manejo de errores en detección y traducción

### `model-management.test.ts`
- Gestión de estado de modelos de traducción
- Traducciones pendientes y colas
- Progreso de descarga de modelos
- Notificaciones de estado
- Manejo de errores de descarga

Los archivos de pruebas no deben exceder las 800 líneas de longitud.

## Alcance mínimo por feature
- Captura de texto (content → panel)
- Transformación/normalización de entrada
- Selección de proveedor IA (local/nube/fallback)
- Mapeo de acciones a comandos de IA
- Presentación de estados (carga, error, éxito)

## Herramientas
- **Vitest**: Framework de pruebas unitarias
- **ts-mockito** / **sinon**: Mocks y stubs
- **@types/chrome**: Tipos para Chrome Extension APIs
- **@types/dom-chromium-ai**: Tipos para Chrome AI APIs

## Ejemplo (pseudo)
```ts
import { selectProvider } from './provider';

test('fallback a nube cuando local falla', async () => {
  const result = await selectProvider({ localAvailable: true, localFails: true });
  expect(result.provider).toBe('cloud');
});
```

## Principios de Organización
- Cada archivo debe enfocarse en una responsabilidad específica
- Máximo recomendado: ~400 líneas por archivo
- Nombres descriptivos que indiquen el contenido
- División lógica por dominio o componente

