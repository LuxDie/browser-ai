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

## Alcance mínimo por feature
- Captura de texto (content → panel)
- Presentación de estados (carga, error, éxito)

## Herramientas
- **Vitest**: Framework de pruebas unitarias
- **WXT Fake Browser**: Entorno de navegador simulado para pruebas de extensiones
- **@types/chrome**: Tipos para Chrome Extension APIs
- **@types/dom-chromium-ai**: Tipos para Chrome AI APIs

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
