# Reglas de Colaboración para agentes

## Flujo de Trabajo Mandatorio: Especificación Primero (Specification-First)

**Regla fundamental:** Todo cambio o adición al proyecto, sin excepción, debe basarse estrictamente en la [especificación técnica](/docs/).

### Calidad de código

Siempre verificar lo siguiente antes de completar cualquier tarea de desarrollo:

1. Verificar que las ediciones cumplen con los estándares de calidad delineados en las [guías de desarrollo](docs/guides)
2. Ejecutar en paralelo (usando `comando & comando ... & wait`):
  - `npm run lint` para verificar errores de ESLint
  - `npm run type-check` para verificar errores de TypeScript
  - `npm run test` para verificar las pruebas
  - `npm run build` para compilar
6. Corregir cualquier error encontrado antes de finalizar
7. Confirmar que todos los comandos se ejecuten sin errores

Esta regla no se aplica para tareas de documentación, configuración, o cualquier operación que no involucre modificaciones del código fuente local.


### Reglas de Pruebas

- **Obligatoriedad de pruebas unitarias:** Toda nueva funcionalidad o corrección debe incluir pruebas unitarias que acompañen la implementación.
- **Actualización ante cambios:** Si se modifica comportamiento existente, actualizar las pruebas afectadas o agregar nuevas según corresponda.

### Código y estructura generado:

- Todo nombre técnico (funciones, clases, archivos, carpetas, APIs, variables, constantes, descripciones de tests, etc.) debe estar en inglés.
- Strings de UI y mensajes de error deben estar en castellano.

### Comentarios y documentación interna generada por agentes:

- Los comentarios explicativos de lógica de negocio y diseño en el código generado deben estar en **castellano** (excepto casos en los que la especificación o el equipo indique lo contrario).
- La documentación técnica generada (ej. archivos en `docs/`), debe estar en castellano.

### Internacionalización

Las cadenas de texto deben estar internacionalizadas con la API `browser.i18n.getMessage`.

### Pruebas

- Las cadenas de texto en las pruebas unitarias deben estar en castellano. Las que se usan más de una vez deben estar en constantes. Si se usan en una sola prueba deben tener alcance local. Los nombres de las constantes deben estar en inglés, según las reglas del proyecto.

### Uso de herramientas

- Siempre prefiere utilizar herramientas antes que comandos de consola.
