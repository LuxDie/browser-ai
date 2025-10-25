## Hoja de ruta para Browser AI

Este escrito documenta a grandes rasgos la intención y la planificación del proyecto a futuro. Tiene como objetivo facilitar a las personas la decisión de utilizar y participar de su desarrollo.

### Fase 1 (en desarrollo) — UX e infraestructura
- Mejoras UX (teclas rápidas, tema oscuro, accesibilidad avanzada).
- Mejora de la infraestructura de desarrollo: frameworks, librerías, herramientas de construcción, etc.

### Fase 2 — Capacidades lingüísticas adicionales
- Escritura, reescritura, corrección y resumen. Se utilizarán las APIs integradas en el navegador (actualmente en fase experimental).

### Fase 3 — Integraciones y expansión
- Integración opcional con servicios cloud para mayor calidad o costos variables.
- Persistencia de datos, historial local.

### Fase 4 - Internacionalización y mejora de robustez
- Agregar soporte para idiomas adicionales.
- Ampliación de cobertura de pruebas unitarias y smoke tests E2E manuales.

### Riesgos generales
- **Inestabilidad de APIs integradas**: Las APIs de IA en el navegador están en fase experimental y pueden cambiar o discontinuarse, afectando funcionalidades clave.
- **Tamaño del bundle**: Agregar nuevas capacidades y frameworks podría aumentar el tamaño del paquete, impactando el rendimiento y la instalación.
- **Compatibilidad multiplataforma**: Aunque WXT facilita el desarrollo para múltiples navegadores, la adopción desigual de APIs integradas (con Chrome a la vanguardia) podría limitar funcionalidades en otros navegadores inicialmente.
- **Privacidad en integraciones cloud**: Las opciones de fallback a servicios externos deben manejar datos de usuario con cuidado para mantener la confianza.
- **Curva de aprendizaje**: Nuevos colaboradores podrían necesitar tiempo para adaptarse a tecnologías como Vue, WXT y APIs de Chrome AI.

### Suposiciones generales
- Usuarios valoran privacidad y rapidez; aceptan resultados "suficientemente buenos".
- Dispositivo objetivo: laptop/desktop promedio con CPU moderna.

### Checklist general
- Build instalable y guía en `README.md`.
- Demo breve (gif) y casos de prueba de muestra.
- Mensajería clara de limitaciones y privacidad.


