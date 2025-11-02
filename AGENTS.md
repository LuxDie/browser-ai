# Reglas de Colaboración para agentes

## Flujo de Trabajo Mandatorio: Especificación Primero (Specification-First)

**Regla fundamental:** Todo cambio o adición al proyecto, sin excepción, debe basarse estrictamente en la [especificación técnica](/docs/).

- [Calidad de Código](/.agents/code-quality.md)

### Reglas de Pruebas

- **Obligatoriedad de pruebas unitarias:** Toda nueva funcionalidad o corrección debe incluir pruebas unitarias que acompañen la implementación.
- **Actualización ante cambios:** Si se modifica comportamiento existente, actualizar las pruebas afectadas o agregar nuevas según corresponda.

### Código y estructura generado:
- Todo nombre técnico (funciones, clases, archivos, carpetas, APIs, variables, constantes, descripciones de tests, etc.) debe estar en inglés.
- Strings de UI y mensajes de error deben estar en castellano.

### Comentarios y documentación interna generada por agentes:
- Los comentarios explicativos de lógica de negocio y diseño en el código generado deben estar en **castellano** (excepto casos en los que la especificación o el equipo indique lo contrario).
- La documentación técnica generada (ej. archivos en `docs/`), debe estar en castellano.
