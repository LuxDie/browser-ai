# Browser AI (Título Provisional)

## Estado del Proyecto

**Título Provisional:** Browser AI  
**Estado:** En Desarrollo

## Descripción

Para una descripción completa del proyecto, incluyendo propósito y público objetivo, consulta [`docs/general-description.md`](docs/general-description.md).

## Stack Tecnológico

- **Plataforma:** Extensión de Chrome (Manifest V3)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Herramienta de Compilación:** Vite
- **Interfaz:** Panel Lateral (sidePanel) + menú contextual
- **IA:** Enfoque híbrido (APIs nativas del navegador + servicios en la nube)

## Características Principales

- ✅ **Privacidad Total**: Procesamiento local usando APIs nativas del navegador
- ✅ **Sin Costos**: No hay límites de API ni tarifas
- ✅ **Funcionamiento Offline**: Análisis sin conexión a internet
- ✅ **Enfoque Híbrido**: Opción de usar IA en la nube cuando sea necesario
- ✅ **Interfaz Simple**: Diseño intuitivo sin conocimientos técnicos requeridos

## Funcionalidades

- **Corrección de Texto**: Detección y sugerencias de errores gramaticales
- **Traducción**: Traducción automática entre múltiples idiomas

- **Extracción de Ideas Clave**: Resumen automático de conceptos principales
- **Reconocimiento de Entidades**: Identificación de personas, lugares, organizaciones

## Documentación

La documentación técnica completa se encuentra en la carpeta `docs/`:

- Fundamentos:
  - [`general-description.md`](docs/general-description.md)
  - [`roadmap.md`](docs/roadmap.md)
  - [`ai-architecture.md`](docs/ai-architecture.md)
- Especificaciones:
  - [`specs/extension-architecture.md`](docs/specs/extension-architecture.md)
  - [`specs/user-flows.md`](docs/specs/user-flows.md)
  - [`ui.md`](docs/ui.md)
  - [`ux.md`](docs/ux.md)
- Guías:
  - [`guides/typescript.md`](docs/guides/typescript.md)
  - [`guides/tailwind.md`](docs/guides/tailwind.md)
  - [`guides/typescript-tailwind-integration.md`](docs/guides/typescript-tailwind-integration.md)
  - [`guides/testing.md`](docs/guides/testing.md)
  - [`guides/ci.md`](docs/guides/ci.md)
- Decisiones:
  - [`adr/README.md`](docs/adr/README.md)
  - [`adr/0001-hybrid-ai-approach.md`](docs/adr/0001-hybrid-ai-approach.md)

## Desarrollo

Este proyecto sigue un enfoque de **especificación primero** (Specification-First). Todos los cambios deben documentarse primero en los archivos `.md` correspondientes antes de proceder con la implementación en código.

### Reglas de Colaboración

- **Código y Estructura:** Inglés
- **Documentación y Comentarios:** Castellano
- **Nomenclatura:** Seguir convenciones establecidas en `AGENTS.md`

## Licencia

Este proyecto está licenciado bajo la [MIT License](LICENSE) - ver el archivo LICENSE para más detalles.

### Resumen de la Licencia MIT

La licencia MIT es una licencia de software libre permisiva que permite a otros usar, modificar, distribuir y vender el software, siempre que se incluya el aviso de copyright y la licencia en todas las copias o partes sustanciales del software.

**Características principales:**
- ✅ Uso comercial permitido
- ✅ Modificación permitida
- ✅ Distribución permitida
- ✅ Uso privado permitido
- ✅ Sin garantías
- ✅ Incluir copyright y licencia en las copias
