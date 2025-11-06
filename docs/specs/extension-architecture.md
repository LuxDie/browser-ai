# Arquitectura de la Extensión (MV3)

**Versión:** v0.2.1
**Última modificación:** 2025-11-06

## Plataforma y componentes
- **Plataforma Principal:** Extensión de Navegador **Manifest V3**
- **UI:** `sidePanel` como vista principal
- **Service Worker:** `background` para orquestación
- **Content Scripts:** `content` para interacción con el DOM

## Responsabilidades
- **`manifest.json`**: metadatos, permisos (`sidePanel`, `storage`, `activeTab`, `scripting`, `notifications`)
- **`sidepanel`**: UI principal y flujos de usuario
- **`background`**: estado global y eventos del navegador
- **`content`**: lectura/edición del DOM y puente con la página

## Componentes de Backend (Service Worker)

### `AIService` (background)
- **Orquestación**: Dirige las operaciones de IA (traducción, resumen) y aplica la lógica de negocio.
- **Abstracción de proveedores**: Maneja las APIs integradas.
- **Ejecución diferida**: Almacena operaciones pendientes durante la descarga de modelos.

### `ModelManager` (background)
- **Gestión de Modelos**: Abstrae las APIs de `Translator` y `Summarizer` del navegador.
- **Detección de disponibilidad**: Verifica la disponibilidad de los modelos de traducción y resumen.
- **Gestión de descargas**: Inicia y monitorea las descargas de modelos.
- **Notificaciones**: Envía notificaciones push cuando los modelos están listos.

## Componentes de UI (Sidepanel)

### `ProcessControls.vue`
- **Controles de Procesamiento**: Contiene los controles para activar el resumen, seleccionar el idioma de destino y ejecutar la operación.

### Otros Componentes de UI
- **`LanguageSelector`**: Selector desplegable de idioma destino.
- **`DownloadProgress`**: Indicador de progreso de descarga.
- **`NotificationHandler`**: Maneja notificaciones push del sistema.

### Implementación Técnica de UI Components
- **Framework Frontend**: Vue 3 con Composition API y `<script setup>`
- **Lenguaje**: TypeScript para tipado fuerte
- **Estilos**: Tailwind CSS para diseño responsivo y consistente
- **Gestión de Estado**: Pinia para estado global compartido entre componentes
- **Pruebas**: Vue Test Utils con Vitest para cobertura unitaria
- **Build Tool**: WXT con módulo Vue para integración en extensiones

## Integración con IA
- Preferencia por APIs integradas del navegador
- Abstracción de proveedores
