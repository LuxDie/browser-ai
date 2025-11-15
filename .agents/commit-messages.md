# Reglas para Mensajes de Confirmación

## Idioma: INGLÉS

**Regla fundamental:** Todos los mensajes de commit deben escribirse en inglés, siguiendo las directrices de internacionalización establecidas en [AGENTS.md](/AGENTS.md).

## Formato Requerido

- **Prefijo de tipo:** Usar tipos de commit convencionales: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- **Alcance:** Opcional. Se debe especificar el dominio al que pertenece la modificación, no la capa técnica. Por ejemplo, `feat(auth): add user authentication system` en vez de `feat(component): add user authentication system`. La excepción a esta regla es cuando el alcance es general, por ejemplo `feat(ui): improve loading indicators`.
  - Las refactorizaciones de pruebas se prefijan con `test`
  - Las modificaciones de simulacros para pruebas se prefijan con `test(mock)`
  - Las modificaciones de pruebas deben utilizar el alcance `unit`, `integration` o `e2e`.
- **Línea de resumen:** Máximo 50 caracteres, escribir en inglés, ser conciso y claro
- **Cuerpo del mensaje:** Opcional, para explicaciones detalladas si son necesarias
- **Ejemplos:**
  - `feat: add user authentication system`
  - `fix: resolve memory leak in data processing`
  - `docs: update API documentation`
  - `test: add unit tests for user service`

## Template Disponible

El proyecto incluye un template `.gitmessage` con ejemplos y directrices.
