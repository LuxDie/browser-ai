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

## Integración con IA
- Preferencia por APIs integradas del navegador
- Abstracción de proveedores
