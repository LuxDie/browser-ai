# 0006 — Eliminación Completa de Tailwind CSS por Vuetify 3

## Contexto

Inicialmente coexistencia Tailwind + Vuetify considerada (ADR 0004).

Durante merge, incompatibilidades críticas: estilos globales solapan (resets CSS, base styles, typography defaults), causando conflictos visuales/prioridad.

## Decisión

**Eliminar Tailwind CSS completamente**, adoptar Vuetify 3 puro.

## Razones para Eliminación Tailwind

1. **Solapamientos Irresolubles**: Ambos insertan CSS global (normalize, box-sizing, font-family), !important no viable para todo.
2. **Mantenimiento Complejo**: Layers/custom CSS para coexistencia aumenta complejidad/debug.
3. **Bundle Limpio**: Vuetify tree-shaking optimizado, Tailwind duplicado innecesario.
4. **Consistencia UI**: Vuetify Material Design 3 full evita hybrid inconsistencies.
5. **Productividad**: Componentes Vuetify cubren 100% needs, no utilidades Tailwind requeridas.

## Consecuencias

**Positivas**:
- UI consistente Material Design 3.
- Menor bundle, mejor perf.
- Menos CSS conflicts.

**Negativas**:
- Pérdida Tailwind utilities (mitigado por Vuetify spacing/flex/spacing).
- Tests adaptados.

## Integración

- vite-plugin-vuetify auto-import.
- src/plugins/vuetify.ts configurado.
- ESLint updates HEAD integrados.

## Referencias

- ADR 0004 Vuetify 3 Adoption
- Vuetify Docs: Styles & Customization
</=======