# Arquitectura de la Extensión (MV3)

## Plataforma y componentes
- **Plataforma Principal:** Chrome Extension **Manifest V3**
- **UI:** `sidePanel` como vista principal
- **Service Worker:** `background` para orquestación
- **Content Scripts:** `content` para interacción con el DOM



## Responsabilidades
- **`manifest.json`**: metadatos, permisos (`sidePanel`, `storage`, `activeTab`, `scripting`, `notifications`)
- **`sidepanel`**: UI principal y flujos de usuario
- **`background`**: estado global y eventos del navegador
- **`content`**: lectura/edición del DOM y puente con la página

## Componentes de Gestión de Modelos

### ModelManager (background)
- **Detección de disponibilidad**: Verificar disponibilidad de API
- **Gestión de descargas**: Iniciar y monitorear descargas
- **Notificaciones**: Enviar notificaciones push cuando modelos estén listos

### TranslationService (background)
- **Abstracción de proveedores**: Manejar APIs integradas
- **Ejecución diferida**: Almacenar traducción pendiente durante descarga de modelo
- **Monitoreo de progreso**: Escuchar eventos de descarga de modelos

### UI Components (sidepanel)
- **LanguageSelector**: Selector desplegable de idioma destino
- **DownloadProgress**: Indicador de progreso de descarga
- **NotificationHandler**: Manejar notificaciones push del sistema

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
