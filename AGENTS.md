# Reglas de Colaboración para agentes

Este documento define las reglas y el flujo de trabajo que el agente debe seguir para colaborar en este proyecto.

## Flujo de Trabajo Mandatorio: Especificación Primero (Specification-First)

**Regla fundamental:** Todo cambio en el proyecto, sin excepción, debe hacerse primero en la especificación (los documentos `.md`) y solo después de su aprobación, se procederá a la implementación en el código.

### Proceso a Seguir

1.  **Discusión del Cambio:** El usuario y el agente discuten la modificación o nueva funcionalidad.
2.  **Propuesta de Especificación:** El agente debe proponer los cambios necesarios en los documentos `.md` relevantes (ej: `implementation.md`, `ui.md`, etc.).
3.  **Aprobación del Usuario:** El usuario debe revisar y aprobar explícitamente los cambios en la documentación.
4.  **Implementación en Código:** Solo después de que la especificación ha sido aprobada, el agente tiene permitido escribir, modificar o generar el código correspondiente para implementar el cambio.

### Reglas de Pruebas

- **Obligatoriedad de pruebas unitarias:** Toda nueva funcionalidad o corrección debe incluir pruebas unitarias que acompañen la implementación.
- **Mismo PR que la funcionalidad:** Las pruebas deben enviarse en el mismo Pull Request que el código de la funcionalidad.
- **Cobertura y casos:** Deben cubrir casos felices y casos borde relevantes. Mantener o aumentar la cobertura global. Cualquier reducción debe estar explícitamente justificada y aprobada.
- **Ejecución en CI:** No se permite fusionar cambios si las pruebas no pasan en el entorno de integración continua.
- **Actualización ante cambios:** Si se modifica comportamiento existente, actualizar las pruebas afectadas o agregar nuevas según corresponda.

## Reglas de Internacionalización

**Enfoque híbrido con predominio del inglés para facilitar la colaboración y mantenimiento:**

### Código y Estructura: INGLÉS
- **Nombres de archivos:** `user-service.ts`, `auth-controller.js`
- **Nombres de carpetas:** `components/`, `services/`, `utils/`
- **Variables y funciones:** `getUserData()`, `isAuthenticated`
- **Clases y interfaces:** `UserService`, `AuthController`
- **Constantes técnicas:** `API_ENDPOINTS`, `ERROR_CODES`

### Documentación y Comentarios: CASTELLANO
- **Comentarios en código:** Explicaciones de lógica de negocio en castellano
- **Documentación técnica:** `README.md`, archivos en `docs/`
- **Mensajes de commit:** `feat: agregar validación de formulario`
- **Comentarios de PR:** Explicaciones detalladas en castellano

### Excepciones
- **Strings de UI:** Siempre en el idioma del usuario final
- **Mensajes de error:** En el idioma del usuario
- **Logs de producción:** Pueden ser en inglés para debugging global
- **APIs públicas:** Documentación en inglés, ejemplos bilingües

**Justificación:** Facilita colaboración internacional, mantiene consistencia con librerías/frameworks, y permite comprensión local del equipo.

## Reglas de Nomenclatura de Archivos

**Estándar de nomenclatura para mantener consistencia y profesionalismo:**

### Archivos Especiales: MAYÚSCULAS
- **Archivos de configuración de agentes:** `AGENTS.md`, `GEMINI.md`
- **Archivos de configuración del proyecto:** `README.md`, `LICENSE.md`

### Archivos de Documentación: kebab-case
- **Documentación técnica:** `general-description.md`, `implementation.md`
- **Guías específicas:** `typescript.md`, `tailwind.md`, `ui.md`
- **Documentación de integración:** `typescript-tailwind-integration.md`

### Archivos de Código: Según convención del lenguaje
- **TypeScript/JavaScript:** `camelCase.ts` o `PascalCase.ts` según el tipo
- **CSS/SCSS:** `kebab-case.css`
- **HTML:** `kebab-case.html`
- **Configuración:** `kebab-case.config.js`

**Justificación:** Facilita navegación, mantiene consistencia con estándares web, y mejora la legibilidad del proyecto.
