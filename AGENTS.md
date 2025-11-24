# Reglas de Colaboración para agentes

## Flujo de Trabajo Mandatorio: Especificación Primero (Specification-First)

- **Regla fundamental:** Todo cambio o adición al proyecto, sin excepción, debe basarse estrictamente en la [especificación técnica](/docs/)

- [Reglas para mensajes de confirmación Git](/.agents/commit-messages.md)

### Reglas generales
- **Importante**: si te atascas tratando de corregir un error, especialmente en fallos de pruebas, desiste luego de los primeros intentos y completa el resto de la tarea. Al finalizar, informa al usuario sobre el problema y por qué no se pudo corregir
- No aplicar soluciones alternativas a lo que pidió el usuario. Si el plan original no funciona, detener la tarea y pedir nuevas instrucciones
- No ejecutar comandos de control de versiones salvo que se haya explicitado en las instrucciones

### Reglas de Pruebas

- **Obligatoriedad de pruebas unitarias:** Toda nueva funcionalidad o corrección debe incluir pruebas unitarias que acompañen la implementación
- **Actualización ante cambios:** Si se modifica comportamiento existente, actualizar las pruebas afectadas o agregar nuevas según corresponda
- **Refactorización**: **Nunca** se debe eliminar un caso de prueba salvo que realmente sea obsoleto

### Código y estructura generado:

- Todo nombre técnico (funciones, clases, archivos, carpetas, APIs, variables, constantes, descripciones de tests, etc.) debe estar en inglés
- Strings de UI y mensajes de error deben estar en castellano

### Comentarios y documentación interna generada por agentes:

- Los comentarios explicativos de lógica de negocio y diseño en el código generado deben estar en **castellano** (excepto casos en los que la especificación o el equipo indique lo contrario)
- La documentación técnica generada (ej. archivos en `docs/`), debe estar en castellano

### Internacionalización

Las cadenas de texto deben estar internacionalizadas con la API `browser.i18n.getMessage`.

### Pruebas

- Las cadenas de texto en las pruebas unitarias deben estar en castellano. Las que se usan más de una vez deben estar en constantes. Si se usan en una sola prueba deben tener alcance local. Los nombres de las constantes deben estar en inglés, según las reglas del proyecto.
- Las variables globales se simulan con `vi.stubGlobals`, no con `Object.assign`
- Las pruebas unitarias deben simular todo servicio externo para mantener la aislación

### Uso de herramientas

- Siempre prefiere utilizar herramientas antes que comandos de consola
