Este documento describe el modelo de desarrollo y la arquitectura implementada para la integración de Vue.js en el proyecto de extensión de navegador. Vue.js es un framework progresivo para construir interfaces de usuario, conocido por su facilidad de uso, rendimiento y flexibilidad.

## Conceptos Fundamentales

### 1. Estructura de Proyecto

La integración de Vue.js seguirá una estructura de proyecto que se alinea con las convenciones de WXT y Vue, facilitando la organización y el mantenimiento del código:

```
📂 src/
   📁 assets/             # Archivos estáticos (imágenes, CSS global)
   📁 components/         # Componentes reutilizables de Vue
   📁 composables/        # Funciones de composición reutilizables (lógica con estado)
   📁 entrypoints/        # Puntos de entrada de la extensión (sidepanel, popup, etc.)
      📁 sidepanel/
         📄 App.vue
         📄 main.ts
   📁 hooks/              # Hooks personalizados (si aplica)
   📁 utils/              # Utilidades generales (funciones puras)
   📄 app.config.ts       # Configuración global de la aplicación
```

### 2. Componentes Vue

Los componentes son la base de las aplicaciones Vue. Se organizarán de la siguiente manera:
- **Componentes Atómicos**: Pequeños, reutilizables, sin lógica de negocio compleja (botones, inputs).
- **Componentes de Composición**: Agrupan componentes atómicos y contienen lógica de UI específica.
- **Vistas/Páginas**: Componentes de nivel superior que representan una pantalla completa o un entrypoint.

### 3. Gestión de Estado

Para la gestión de estado, se utilizará:
- **`ref` y `reactive`**: Para el estado local de los componentes.
- **Pinia**: Como store centralizado para el estado global de la aplicación, facilitando la compartición de estado entre diferentes entrypoints de la extensión (background, sidepanel).

### 4. Enrutamiento

Dado que las extensiones de navegador suelen tener interfaces de usuario más simples y a menudo se limitan a un solo "entry point" (como un sidepanel o popup), el enrutamiento tradicional (como Vue Router) puede no ser necesario. Si se requiere navegación entre diferentes vistas dentro de un mismo entrypoint, se considerará una solución ligera o un enrutamiento manual basado en componentes.

## Buenas Prácticas

1. **Composición API**: Preferir la Composition API para una mejor organización de la lógica y reutilización.
2. **Tipado Fuerte**: Utilizar TypeScript en todos los componentes y composables para garantizar la robustez del código.
3. **Separación de Preocupaciones**: Mantener la lógica de negocio en composables o utilidades, separada de la lógica de presentación en los componentes.
4. **Rendimiento**: Optimizar el renderizado de componentes y el uso de recursos, crucial para extensiones de navegador.
5. **Accesibilidad**: Asegurar que los componentes de la UI sean accesibles.

## Testing

Para las pruebas de componentes Vue, se utilizará **Vue Test Utils** en conjunto con Vitest. Esto permitirá:
- Montar y renderizar componentes de Vue de forma aislada.
- Simular interacciones del usuario y eventos.
- Afirmar el comportamiento y la salida de los componentes.

```typescript
// Ejemplo de test con Vue Test Utils y Vitest
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(MyComponent, { props: { msg: 'Hello Vue' } });
    expect(wrapper.text()).toContain('Hello Vue');
  });
});
```

## Recursos Adicionales

- [Documentación Oficial de Vue.js](https://vuejs.org/)
- [Documentación de Pinia](https://pinia.vuejs.org/)
- [Documentación de Vue Test Utils](https://test-utils.vuejs.org/)
