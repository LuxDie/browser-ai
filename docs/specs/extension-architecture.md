# Arquitectura de la Extensión (MV3)

## Plataforma y componentes
- **Plataforma Principal:** Chrome Extension **Manifest V3**
- **UI:** `sidePanel` como vista principal
- **Service Worker:** `background` para orquestación
- **Content Scripts:** `content` para interacción con el DOM

## Estructura propuesta del proyecto

```
/
├── extension/
│   ├── public/
│   │   ├── icons/
│   │   │   └── icon-128.png
│   │   └── manifest.json
│   ├── src/
│   │   ├── sidepanel/
│   │   │   ├── sidepanel.html
│   │   │   └── sidepanel.ts
│   │   ├── background.ts
│   │   └── content.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
├── docs/
│   ├── specs/
│   │   └── extension-architecture.md
└── package.json
```

## Responsabilidades
- **`manifest.json`**: metadatos, permisos (`sidePanel`, `storage`, `activeTab`, `scripting`, `notifications`)
- **`sidepanel`**: UI principal y flujos de usuario
- **`background`**: estado global y eventos del navegador
- **`content`**: lectura/edición del DOM y puente con la página

## Componentes de Gestión de Modelos

### ModelManager (background)
- **Detección de disponibilidad**: Verificar qué modelos están descargados
- **Gestión de descargas**: Iniciar, monitorear y cancelar descargas
- **Cache de estado**: Almacenar estado de modelos y descargas
- **Notificaciones**: Enviar notificaciones push cuando modelos estén listos

### TranslationService (background)
- **Abstracción de proveedores**: Manejar APIs integradas vs nube
- **Ejecución diferida**: Almacenar traducciones pendientes durante descargas
- **Fallback automático**: Cambiar a nube si modelo local falla
- **Monitoreo de progreso**: Escuchar eventos de descarga de modelos

### UI Components (sidepanel)
- **LanguageSelector**: Selector desplegable de idioma destino
- **ModelStatusIndicator**: Mostrar estado de disponibilidad de modelos
- **DownloadProgress**: Indicador de progreso de descarga
- **ModelOptions**: Opciones para descargar modelo o usar nube
- **NotificationHandler**: Manejar notificaciones push del sistema

## Integración con IA
- Preferencia por APIs integradas del navegador
- Abstracción de proveedores para alternar entre local/nube
- Configuración persistente por función
