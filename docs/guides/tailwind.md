# Mejores Prácticas para Tailwind CSS

## 1. Configuración Moderna del tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '2rem',
        screens: {
          "2xl": "1400px",
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## 2. Organización de Clases

**Usar un orden consistente:**
```jsx
// ✅ Bueno - Orden: Layout → Box Model → Typography → Visual → Interactive
<div className="
  flex flex-col items-center justify-center
  w-full max-w-md mx-auto p-6
  text-lg font-semibold text-gray-900
  bg-white border border-gray-200 rounded-lg shadow-sm
  hover:shadow-md focus:outline-none focus:ring-2
  transition-all duration-200
">
  Contenido
</div>
```

## 3. Componentes Reutilizables

**Crear clases de componentes con @apply (con moderación):**
```css
/* ✅ Bueno - Solo para patrones muy repetitivos */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white font-medium rounded-lg 
           hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
           disabled:opacity-50 disabled:cursor-not-allowed
           transition-colors duration-200;
  }
}
```

## 4. Responsive Design

**Mobile-first approach:**
```jsx
// ✅ Bueno - Diseño mobile-first
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:gap-8
  xl:grid-cols-4
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

## 5. Estados y Variantes Modernas

```jsx
// ✅ Bueno - Usar variantes de estado
<button className="
  px-4 py-2 bg-blue-600 text-white rounded-lg
  hover:bg-blue-700
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  active:bg-blue-800
  disabled:opacity-50 disabled:cursor-not-allowed
  data-[state=loading]:animate-pulse
">
  Click me
</button>
```

## 6. Utilidades de Espaciado y Sizing

```jsx
// ✅ Bueno - Usar sistema de spacing consistente
<div className="space-y-6"> {/* Espacio vertical entre hijos */}
  <div className="space-x-4 flex"> {/* Espacio horizontal entre hijos */}
    <button>Botón 1</button>
    <button>Botón 2</button>
  </div>
</div>

// ✅ Bueno - Usar clases de aspect ratio
<img 
  src="/imagen.jpg" 
  className="w-full aspect-video object-cover rounded-lg" 
  alt="Descripción"
/>
```

## 7. Patrones Anti-Patrones

### ❌ Evitar

```jsx
// ❌ Malo - clases inline muy largas en Tailwind
<div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
```

### ✅ Preferir

```jsx
// ✅ Bueno - componentes reutilizables
<Card variant="elevated" className="max-w-md" />
```
