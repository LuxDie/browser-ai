# Estrategia de Pruebas

## Principios
- Toda funcionalidad nueva requiere pruebas unitarias
- Casos felices y casos borde relevantes
- Mantener o aumentar cobertura global; justificar reducciones
- Pruebas deben correr y pasar en CI antes de merge

## Niveles
- **Unitarias**: lógica pura (transformaciones, selección de proveedor)
- **Integración ligera**: comunicación panel ↔ background (mock de APIs de navegador)
- **E2E automatizadas**: Flujos completos de usuario con Playwright (ver [e2e/README.md](../../e2e/README.md))
- **E2E manuales**: checklist en `docs/roadmap.md` para casos que requieren interacción humana

## Alcance mínimo por feature
- Captura de texto (content → panel)
- Presentación de estados (carga, error, éxito)

## Herramientas

### Pruebas Unitarias e Integración
- **Vitest**: Framework de pruebas unitarias
- **WXT Fake Browser**: Entorno de navegador simulado para pruebas de extensiones
- **Vue Test Utils**: Utilidades para probar componentes Vue
- **@types/chrome**: Tipos para Chrome Extension APIs
- **@types/dom-chromium-ai**: Tipos para Chrome AI APIs

### Pruebas E2E
- **Playwright**: Framework para pruebas end-to-end automatizadas
- **Mocks de Chrome AI APIs**: Simulación de `Translator`, `Summarizer`, `LanguageDetector` para pruebas confiables

Para más detalles sobre pruebas E2E, consulta [e2e/README.md](../../e2e/README.md).

## Principios de Organización de Archivos de Pruebas
### Principios Generales
- Cada archivo debe enfocarse en una responsabilidad específica
- Nombres descriptivos que indiquen el contenido
- División lógica por dominio o componente
- No deben exceder las 800 líneas de código

### Convenciones de Ubicación y Nomenclatura
- Los archivos deben estar en la misma ruta que el archivo que se está probando.
- Deben tener el mismo nombre que el archivo que se está probando, con la extensión `.test.ts`. En caso de que el archivo bajo prueba se llame `index.js`, el archivo de pruebas debe llamarse como la carpeta contenedora.
  - **Ejemplo**: Para `utils.ts`, el archivo de pruebas es `utils.test.ts`.
