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

## Instalación y Uso

### Requisitos

- **Chrome 138 o superior**: Requerido para las APIs de IA integradas
- **Manifest V3**: Compatible con la última versión de extensiones Chrome

#### Requisitos de Hardware

**Para Translator API y Language Detector API (Fase 1 actual):**
- **Sistema operativo**: Windows 10/11, macOS 13+ (Ventura), Linux, o ChromeOS (desde Platform 16389.0.0) en dispositivos Chromebook Plus
- **Dispositivo**: Solo escritorio (no funciona en móviles)
- **Almacenamiento**: Al menos 22 GB de espacio libre en el volumen que contiene tu perfil de Chrome
- **Red**: Conexión sin límites de datos

**Para APIs adicionales (Fases futuras - Summarizer, Writer, Rewriter, Proofreader):**
- **Sistema operativo**: Windows 10/11, macOS 13+ (Ventura), o Linux
- **Dispositivo**: Solo escritorio (no funciona en móviles)
- **Almacenamiento**: Al menos 22 GB de espacio libre en el volumen que contiene tu perfil de Chrome
- **GPU**: Más de 4 GB de VRAM (requisito estricto)
- **Red**: Conexión sin límites de datos

> **Nota**: Para verificar el tamaño actual del modelo Gemini Nano, visita `chrome://on-device-internals` y ve a **Model status**. Para debugging de APIs, selecciona **Event Logs**.

### Instalación para Desarrollo

1. **Clonar el repositorio**:
   ```bash
   git clone <repository-url>
   cd browser-ai
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Construir la extensión**:
   ```bash
   npm run build
   ```

4. **Cargar en Chrome**:
   - Abrir Chrome y ir a `chrome://extensions/`
   - Activar "Modo de desarrollador"
   - Hacer clic en "Cargar extensión sin empaquetar"
   - Seleccionar la carpeta `dist/`

### Uso

1. **Traducción desde selección de texto**:
   - Seleccionar texto en cualquier página web
   - Hacer clic derecho y seleccionar "Traducir con Browser AI"
   - El panel lateral se abrirá automáticamente con la traducción

2. **Traducción manual**:
   - Hacer clic en el icono de Browser AI en la barra de herramientas
   - Escribir o pegar texto en el panel lateral
   - Seleccionar idioma destino y hacer clic en "Traducir"

3. **Configuración**:
   - Ir a `chrome://extensions/`
   - Buscar Browser AI y hacer clic en "Opciones"
   - Configurar idioma destino predeterminado y modo de privacidad

### Scripts de Desarrollo

```bash
npm run dev          # Modo desarrollo con hot reload
npm run build        # Construir para producción
npm run preview      # Vista previa de la build
npm run test         # Ejecutar pruebas
npm run lint         # Linter
npm run type-check   # Verificación de tipos TypeScript
```

## APIs Utilizadas

Browser AI utiliza las siguientes APIs integradas de Chrome:

- **[Translator API](https://developer.chrome.com/docs/ai/built-in-apis#translator-api)**: Para traducción de texto
- **[Language Detector API](https://developer.chrome.com/docs/ai/built-in-apis#language-detector-api)**: Para detección automática del idioma

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
