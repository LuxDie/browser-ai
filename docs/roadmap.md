## Hoja de ruta del Producto

Documento único de hoja de ruta para "Browser AI". Estructurado por fases; la Fase 1 corresponde al MVP (solo traducción), seguido de expansiones opcionales.

### Fase 1 — MVP Traducción

#### Objetivo
Entregar una extensión de Chrome que permita seleccionar texto en cualquier página y traducirlo desde un panel lateral, con UX simple y soporte de todos los idiomas disponibles en la API.

#### Alcance
- Extensión Chrome MV3 con panel lateral y menú contextual.
- Flujo: selección de texto → panel lateral con el texto capturado.
- Traducción vía API (detección del idioma origen → idioma destino seleccionado).
- UI mínima con una única acción de traducción y estados de carga/errores claros.
- Preferencias: idioma destino predeterminado y modo de privacidad.

#### Entregables
- Proyecto con Vite + TypeScript + Tailwind.
- Manifest V3 y panel lateral funcional.
- Menú contextual para enviar texto al panel lateral.
- Integración con API de traducción (todos los idiomas soportados).

#### Criterios de aceptación
- Instalación y apertura del panel lateral en cualquier página.
- Con texto seleccionado, el panel lateral recibe el contenido y ejecuta la traducción.
- Traducción entre cualquier par de idiomas soportados por la API.
- Errores comunicados en el idioma del usuario.
- Pruebas unitarias incluidas para la lógica principal (captura, transformación y llamada a la API) y pasando en CI.

#### Dependencias
- Chrome MV3 (panel lateral, contextMenus).
- TypeScript, Vite, Tailwind.
- API de traducción multilenguaje.

#### Riesgos
- Permisos MV3 y restricciones de sandbox.
- Tamaño del paquete (evitar dependencias pesadas; usar tree-shaking y code splitting).

### Fase 2 — UX y calidad
- Mejoras UX (teclas rápidas, temas, accesibilidad avanzada).
- Estados vacíos, copiado rápido, notas de limitaciones y privacidad mejoradas.
- Ampliación de cobertura de pruebas unitarias y smoke tests E2E manuales.

### Fase 3 — Capacidades lingüísticas adicionales
- Módulos opcionales: corrección y resumen (APIs integradas o en la nube).
- Controles de calidad perceptual (ejemplos de referencia para QA manual).

### Fase 4 — Integraciones y expansión
- Integración opcional con servicios cloud para mayor calidad o costos variables.
- Historial local y favoritos.

### Suposiciones generales
- Usuarios valoran privacidad y rapidez; aceptan resultados "suficientemente buenos".
- Dispositivo objetivo: laptop/desktop promedio con CPU moderna.

### Checklist general
- Build instalable y guía en `README.md`.
- Demo breve (gif) y casos de prueba de muestra.
- Mensajería clara de limitaciones y privacidad.


