# Integración TypeScript + Tailwind CSS

## 1. Tipado de Props con Variantes

```typescript
// ✅ Bueno - Crear variantes tipadas para funciones de componentes
type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: string | HTMLElement;
}

function createButton(options: ButtonOptions): HTMLButtonElement {
  const { variant = 'primary', size = 'md', children } = options;
  
  const button = document.createElement('button');

  const baseClasses = 'font-medium rounded-lg transition-colors duration-200';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  button.className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;

  if (typeof children === 'string') {
    button.textContent = children;
  } else {
    button.appendChild(children);
  }

  return button;
};
```

## 2. Usar clsx o cn helper

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ✅ Excelente - Helper para combinar clases
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Uso:
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  error && 'error-classes'
)} />
```

## 3. Configurar IntelliSense

**En VS Code, instalar:**
- Tailwind CSS IntelliSense
- TypeScript Importer

**Configurar settings.json:**
```json
{
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"],
    ["clsx\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

## 4. Herramientas Recomendadas

### TypeScript
- **ESLint + TypeScript ESLint**: Linting avanzado
- **Prettier**: Formateo consistente
- **ts-reset**: Mejores tipos por defecto
- **Zod**: Validación de schemas en runtime

### Tailwind
- **tailwind-merge**: Combinar clases sin conflictos
- **clsx**: Construcción condicional de clases
