# 0004 — Vuetify 3 como Librería de Componentes

## Contexto

Con Vue 3 adoptado como framework UI (ver ADR 0003), necesitamos una librería de componentes que:
- Acelere el desarrollo de nuevas features (Resumir, Corregir, etc.)
- Proporcione componentes accesibles y consistentes
- Se integre bien con TypeScript
- Sea familiar para el equipo de desarrollo

El desarrollador principal tiene experiencia extensa con Angular Material, lo que influye en la elección.

## Alternativas Evaluadas

### shadcn-vue
**Ventajas:**
- Bundle mínimo (~50KB, copy-paste de componentes)
- Basado en Radix Vue (primitivos accesibles)
- Usa Tailwind (ya en el proyecto)
- Máximo control y customización

**Desventajas:**
- Requiere copiar/mantener código de componentes
- No es Material Design
- Curva de aprendizaje desde Angular Material

### Naive UI
**Ventajas:**
- TypeScript excelente
- Bundle medio (~150KB)
- Componentes completos

**Desventajas:**
- No es Material Design
- Documentación menos extensa en español
- Estética diferente a Angular Material

### PrimeVue
**Ventajas:**
- 90+ componentes
- Maduro y estable

**Desventajas:**
- Estética corporativa/enterprise
- Requiere configuración de tema extensa
- No es Material Design

### Vuetify 3
**Ventajas:**
- Material Design 3 nativo
- Equivalencias directas con Angular Material
- Documentación excelente
- TypeScript completo
- 80+ componentes listos
- Ecosistema maduro

**Desventajas:**
- Bundle más grande (~200KB)
- Puede coexistir con Tailwind pero requiere consideración

## Decisión

Adoptar **Vuetify 3** como librería de componentes para Browser AI.

## Razones

1. **Transición Natural desde Angular Material**: Equivalencias directas de componentes facilitan desarrollo
   - `mat-button` → `v-btn`
   - `mat-card` → `v-card`
   - `mat-select` → `v-select`
   - etc.

2. **Material Design 3**: Mantiene consistencia con la experiencia previa del equipo y estándares de diseño modernos

3. **Productividad**: Componentes completos aceleran desarrollo de features como Resumir, Corregir, Escribir

4. **TypeScript**: Soporte excelente con tipos completos

5. **Documentación**: Extensa y de alta calidad, con ejemplos prácticos

6. **Bundle Size Aceptable**: 200KB es justificable para:
   - Extensión de Chrome (no web crítica)
   - Componentes completos sin código adicional
   - Tree-shaking reduce tamaño en producción

## Consecuencias

### Positivas
- Desarrollo rápido de componentes UI
- Menor curva de aprendizaje para desarrolladores con experiencia en Angular Material
- Componentes accesibles y testeados
- Actualizaciones y soporte de la comunidad

### Negativas
- Bundle size mayor que alternativas minimalistas
- Coexistencia con Tailwind requiere atención a prioridad de estilos
- Dependencia de librería externa (vendor lock-in moderado)

### Mitigación
- Usar auto-import de Vuetify para optimizar bundle
- Documentar prioridad de estilos Vuetify vs Tailwind
- Considerar migración futura si bundle size se vuelve crítico

## Integración con Stack Actual

- **Vue 3**: Base para componentes Vuetify
- **Tailwind CSS**: Coexiste para utilidades (flexbox, spacing, etc.)
- **TypeScript**: Tipado completo de componentes
- **Vite**: Plugin `vite-plugin-vuetify` configurado en WXT para auto-import de componentes

## Referencias

- [Documentación Vuetify 3](https://vuetifyjs.com/)
- [Material Design 3](https://m3.material.io/)
- [Comparativa de Librerías Vue](https://vuejs.org/ecosystem/ui-libraries.html)
- ADR 0003 — Adopción de Vue 3
