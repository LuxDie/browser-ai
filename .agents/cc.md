---
description: "Calidad de código"
---
Ejecuta las siguientes verificaciones:

1. Verifica que las ediciones cumplen con los estándares de calidad delineados en las [guías de desarrollo](docs/guides)
2. Ejecuta en paralelo (usando `comando & comando ... & wait`):
  - `npm run lint` para verificar errores de ESLint
  - `npm run type-check` para verificar errores de TypeScript
  - `npm run test` para verificar las pruebas
  - `npm run build` para compilar
3. Corrige cualquier error encontrado antes de finalizar
4. Confirma que todos los comandos se ejecuten sin errores
