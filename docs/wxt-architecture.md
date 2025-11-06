# Arquitectura WXT

**Versión:** v0.2.1
**Última modificación:** 2025-11-06

## Introducción

Este documento describe el modelo de desarrollo y la arquitectura propuesta por WXT (Web Extension Toolkit) para el desarrollo de extensiones de navegador modernas. WXT simplifica la creación de extensiones proporcionando una capa de abstracción sobre las APIs estándar del navegador, con soporte nativo para TypeScript, Vite y herramientas modernas de desarrollo.

## Conceptos Fundamentales

### 1. Estructura de Proyecto

WXT sigue una estructura de proyecto convencional que facilita la organización del código:

```
📂 browser-ai/
   📁 .output/
   📁 .wxt/
   📁 modules/
   📁 public/
   📂 src/
      📁 assets/
      📁 components/
      📁 composables/
      📁 entrypoints/
      📁 hooks/
      📁 utils/
      📄 app.config.ts
   📄 .env
   📄 .env.publish
   📄 package.json
   📄 tsconfig.json
   📄 web-ext.config.ts
   📄 wxt.config.ts
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

> La extensión utiliza **exclusivamente** @webext-core/messaging con `defineExtensionMessaging` para toda la comunicación entre componentes, proporcionando un protocolo tipado y consistente.
> 
> **Nota importante**: Toda la comunicación sigue el patrón `sendMessage - onMessage`, incluyendo mensajes iniciados por el background al sidepanel para notificaciones push y actualizaciones en tiempo real.

### Patrón sendMessage - onMessage

Para todas las operaciones de comunicación entre componentes de la extensión:

```typescript
// En messaging.ts - Definir el protocolo tipado
import { defineExtensionMessaging } from '@webext-core/messaging';
import { AvailableLanguages, LanguageCode } from '@/entrypoints/background';
import type { AIModelStatus } from '@/entrypoints/background/model-manager/model-manager.model';

export interface ProtocolMap {
  getModelStatus(data: { source: string; target: string }): AIModelStatus;
  translateText(data: { text: string; targetLanguage: LanguageCode; sourceLanguage: LanguageCode }): string;
  selectedText(data: { text: string; summarize?: boolean }): void;
  modelStatusUpdate(data: AIModelStatus): void;
  // ... otros mensajes
}

const messaging = defineExtensionMessaging<ProtocolMap>();
export const sendMessage = messaging.sendMessage.bind(messaging);
export const onMessage = messaging.onMessage.bind(messaging);

// En background.ts - Handlers que retornan valores directamente
onMessage('translateText', async (message) => {
  const { text, sourceLanguage, targetLanguage } = message.data;
  // Lógica de traducción
  return "texto traducido";
});

// En background.ts - El background puede enviar mensajes push usando sendMessage
function notifyModelStatus(status: AIModelStatus) {
  // Envío de notificación push al sidepanel usando el mismo sistema tipado
  sendMessage('modelStatusUpdate', status).catch(console.error);
}

// En sidepanel.ts - Llamadas síncronas con await para requests
try {
  const response = await sendMessage('translateText', {
    text: "hello world",
    targetLanguage: 'es',
    sourceLanguage: 'en'
  });
  // Manejar respuesta exitosa
} catch (error) {
  // Manejar errores
}

// En sidepanel.ts - Listeners para mensajes push del background
onMessage('modelStatusUpdate', (message) => {
  updateProgressUI(message.data);
});
```

### Beneficios del Patrón sendMessage - onMessage

1. **Tipado fuerte**: El protocolo está definido en TypeScript, previniendo errores en tiempo de compilación
2. **Consistencia**: Todas las comunicaciones siguen el mismo patrón
3. **Mantenibilidad**: Cambios en el protocolo se reflejan automáticamente en todo el código
4. **Debugging**: Mensajes tipados facilitan el seguimiento y depuración

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
