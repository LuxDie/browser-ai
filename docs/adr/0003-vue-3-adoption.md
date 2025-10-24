# 0003 — Adopción de Vue 3 como Framework Frontend

## Contexto
El proyecto Browser AI requiere una interfaz de usuario para el panel lateral que sea moderna, mantenible y eficiente. Actualmente, no se ha definido un framework frontend, pero el equipo cuenta con experiencia previa en Angular. Dado que el proyecto crece en complejidad y necesita una solución frontend robusta, se evaluaron varias opciones de frameworks JavaScript modernos.

Se consideró la transición a un framework que facilite el desarrollo sin comprometer la calidad y que se alinee con las necesidades del proyecto. Las razones principales para elegir Vue 3 incluyen:

- **Transición suave desde Angular**: Templates similares y conceptos familiares para el equipo.
- **Alineación filosófica**: Framework independiente, colaborativo y de código abierto sin agendas corporativas.
- **Balance ideal**: Ecosistema maduro con bundle pequeño y excelente documentación.
- **Comunidad**: Segunda comunidad más grande de frameworks frontend, con excelente soporte en español.
- **Adecuación para Browser AI**: Composition API + TypeScript para estructura clara en el Side Panel, templates declarativos para UI mantenible, reactivity eficiente para menos overhead, y `<script setup>` para código conciso.

## Decisión
Adoptar Vue 3 como framework principal para el desarrollo de la interfaz de usuario del panel lateral y cualquier componente frontend futuro del proyecto Browser AI.

La implementación comenzará integrando Vue 3 en el entrypoint del sidepanel, utilizando:
- Composition API con `<script setup>` para simplicidad.
- TypeScript para tipado fuerte.
- Pinia como solución de estado si el proyecto crece en complejidad.

## Alternativas Consideradas
- **Mantener vanilla JavaScript/HTML**: Demasiado verboso y difícil de mantener para una UI compleja.
- **React**: Comunidad más grande, pero mayor bundle y conceptos menos familiares desde Angular.
- **Angular**: Opción natural dada la experiencia del equipo, pero más pesado y con mayor curva de aprendizaje para nuevos miembros.
- **Svelte**: Bundle pequeño, pero ecosistema menos maduro y soporte limitado en español.

## Consecuencias
- **Positivas**:
  - Desarrollo más rápido y mantenible gracias a la familiaridad con Angular.
  - Mejor experiencia de usuario con reactivity eficiente en el panel lateral.
  - Comunidad activa para soporte y recursos.
  - Arquitectura escalable con Pinia para gestión de estado futuro.
- **Negativas**:
  - Introducción de una nueva dependencia (Vue 3 y sus herramientas).
  - Necesidad de configuración adicional en el build (WXT/Vite).
  - Posible aumento inicial del bundle size, aunque mínimo con tree-shaking.
- **Riesgos**:
  - Curva de aprendizaje para miembros del equipo no familiarizados con Vue.
  - Compatibilidad con extensiones de navegador y APIs de Chrome AI.
- **Implementación**:
  - Actualizar configuración de build para incluir Vue 3.
  - Migrar componentes del sidepanel gradualmente.
  - Agregar pruebas unitarias para componentes Vue.
  - Documentar patrones de desarrollo en la guía técnica.
