# Arquitectura WXT

## Introducción

Este documento describe el modelo de desarrollo y la arquitectura propuesta por WXT (Web Extension Toolkit) para el desarrollo de extensiones de navegador modernas. WXT simplifica la creación de extensiones proporcionando una capa de abstracción sobre las APIs estándar del navegador, con soporte nativo para TypeScript, Vite y herramientas modernas de desarrollo.

## Conceptos Fundamentales

### 1. Estructura de Proyecto

WXT sigue una estructura de proyecto convencional que facilita la organización del código:

```
extension/
├── public/          # Archivos estáticos
├── src/
│   ├── background/  # Scripts de background
│   ├── content/     # Content scripts
│   ├── entries/     # Puntos de entrada
│   ├── components/  # Componentes UI reutilizables
│   └── lib/         # Utilidades y lógica compartida
├── wxt.config.ts    # Configuración de WXT
└── package.json
```

### 2. Sistema de Módulos

WXT utiliza Vite como bundler, lo que permite:
- Importación de módulos ES
- Hot Module Replacement (HMR) en desarrollo
- Soporte para TypeScript, Vue, React, Svelte, etc.
- Tree-shaking para optimización de bundles

### 3. Entry Points

WXT define diferentes tipos de entry points para las extensiones:

- **Background Scripts**: Procesos de larga duración
- **Content Scripts**: Inyectados en páginas web
- **Options Page**: Página de configuración
- **Popup/Modal**: Interfaz de usuario flotante
- **Sidepanel**: Panel lateral del navegador
- **New Tab**: Personalización de nueva pestaña

## Mensajería con @webext-core/messaging

### Patrón Request-Response

```typescript
// En background/handlers.ts
export const getDataHandler = defineMessageHandler({
  name: 'GET_DATA',
  async handle(params) {
    // Lógica del handler
    return { data: 'resultado' };
  },
});

// En el frontend
const result = await sendMessage('GET_DATA', { /* params */ });
```

### Eventos Push

Para notificaciones unidireccionales:

```typescript
// En background/events.ts
chrome.runtime.sendMessage({
  type: 'DATA_UPDATED',
  data: { /* datos */ }
});

// En el frontend
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'DATA_UPDATED') {
    // Manejar actualización
  }
});
```

## Desarrollo y Build

### Comandos Principales

- `wxt dev`: Inicia el servidor de desarrollo
- `wxt build`: Genera la extensión para producción
- `wxt zip`: Crea un archivo ZIP listo para publicación

### Variables de Entorno

WXT soporta variables de entorno a través de archivos `.env`:

```
VITE_API_URL=https://api.ejemplo.com
```

## Buenas Prácticas

1. **Tipado Fuerte**: Aprovechar TypeScript para mejorar la calidad del código
2. **Separación de Preocupaciones**: Mantener la lógica de negocio separada de la UI
3. **Manejo de Errores**: Implementar manejo de errores consistente
4. **Testing**: Escribir pruebas unitarias y de integración
5. **Documentación**: Documentar APIs y componentes importantes

## Testing

WXT integra Vitest para pruebas unitarias con configuración sencilla:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
});
```

El plugin `WxtVitest` polyfills la API del navegador con [@webext-core/fake-browser](https://webext-core.aklinker1.io/fake-browser/installation), configura aliases y variables globales de WXT.

### Ejemplos Básicos

```typescript
import { describe, it, expect } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

const storage = storage.defineItem('local:key');

describe('storage', () => {
  beforeEach(() => fakeBrowser.reset());

  it('guarda y recupera valores', async () => {
    await storage.setValue('test');
    expect(await storage.getValue()).toBe('test');
  });
});
```

Para mockear APIs de WXT, usa rutas reales en lugar de `#imports` (consulta `.wxt/types/imports-module.d.ts`).

Otros frameworks requieren setup manual.

## Recursos Adicionales

- [Documentación Oficial de WXT](https://wxt.dev/)
- [Guía de Migración](https://wxt.dev/guide/migration)
- [Ejemplos de Código](https://wxt.dev/examples)
