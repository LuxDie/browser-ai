# Guía de TSDoc

## Introducción

TSDoc es el estándar de Microsoft para comentarios de documentación en TypeScript. Proporciona IntelliSense mejorado, generación de docs con TypeDoc y consistencia.

## Estándares

- Formato: `/** */` antes del elemento.
- Idioma: Descripciones en castellano, tags en inglés.
- Tags:
  - `@param` todos los parámetros.
  - `@returns` si no void.
  - `@throws` si aplica.
  - `@example` 1 caso de uso.

## Ejemplos

### Función
```typescript
/**
 * Traduce texto.
 * @param text - Texto fuente.
 * @param sourceLanguage - Idioma origen.
 * @param targetLanguage - Idioma destino.
 * @returns Texto traducido.
 * @throws Si modelo falla.
 * @example
 * await translateText('Hola', 'es', 'en');
 */
```

### Interface
```typescript
 /**
  * Opciones de ejemplo.
  */
interface Example {
  /** Propiedad de ejemplo. */
  prop: string;
}
```

## Verificación
`npm run lint`
