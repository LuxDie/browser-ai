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
- **`manifest.json`**: metadatos, permisos (`sidePanel`, `storage`, `activeTab`, `scripting`)
- **`sidepanel`**: UI principal y flujos de usuario
- **`background`**: estado global y eventos del navegador
- **`content`**: lectura/edición del DOM y puente con la página

## Integración con IA
- Preferencia por APIs integradas del navegador
- Abstracción de proveedores para alternar entre local/nube
- Configuración persistente por función
