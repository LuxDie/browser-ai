# Reglas de Colaboración para agentes

Este documento define las reglas y el flujo de trabajo que el agente debe seguir para colaborar en este proyecto.

## Flujo de Trabajo Mandatorio: Especificación Primero (Specification-First)

**Regla fundamental:** Todo cambio o adición al proyecto, sin excepción, debe basarse estrictamente en la especificación técnica (los documentos `.md` en el directorio @docs). Cualquier desviación de la misma debe ser corregida, y de no poder conformarla por limitaciones técnicas o de otra índole, dicha situación deberá quedar debidamente documentada en la misma especificación.

### Reglas de Pruebas

- **Obligatoriedad de pruebas unitarias:** Toda nueva funcionalidad o corrección debe incluir pruebas unitarias que acompañen la implementación.
- **Mismo PR que la funcionalidad:** Las pruebas deben enviarse en el mismo Pull Request que el código de la funcionalidad.
- **Cobertura y casos:** Deben cubrir casos felices y casos borde relevantes. Mantener o aumentar la cobertura global. Cualquier reducción debe estar explícitamente justificada y aprobada.
- **Ejecución en CI:** No se permite fusionar cambios si las pruebas no pasan en el entorno de integración continua.
- **Actualización ante cambios:** Si se modifica comportamiento existente, actualizar las pruebas afectadas o agregar nuevas según corresponda.

## Reglas de Internacionalización

Para toda contribución, los agentes deben cumplir con las normas de idioma, nomenclatura y estructura de issues, PRs, tags y milestones definidas en `CONTRIBUTING.md`.

Las siguientes reglas son específicas para agentes automáticos:

### Código y estructura generado:
- Todo nombre técnico (funciones, clases, archivos, carpetas, APIs, variables, constantes, descripciones de tests, etc.) debe estar en **inglés**.
- Strings de UI y mensajes de error deben seguir el idioma definido para el usuario final de la extensión.

### Comentarios y documentación interna generada por agentes:
- Los comentarios explicativos de lógica de negocio y diseño en el código generado deben estar en **castellano** (excepto casos en los que la especificación o el equipo indique lo contrario).
- La documentación técnica generada (ej. archivos en `docs/`), debe estar en castellano, salvo que la especificación indique expresamente lo contrario.

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

## Información del Repositorio

- **Nombre del repositorio:** `browser-ai`
- **URL del repositorio:** `https://github.com/LuxDie/browser-ai`
- **Propietario:** `LuxDie`
- **Tipo:** Repositorio público de extensión de navegador

**Nota:** Los agentes deben usar esta información para todas las operaciones de GitHub (crear issues, PRs, releases, etc.).
