---
description: Revisión de Código
---

## Alcance de la tarea

Cambios a revisar:
- Archivos preparados en Git (stage) o,
si el área de preparación está vacía, archivos con modificaciones pendientes en el árbol de trabajo o,
si el área de preparación y el árbol de trabajo están vacíos, la diferencia entre la última confirmación (HEAD) y la anterior (HEAD~1)

Sobre esos cambios harás una revisión de código como se detalla a continuación.

## Objetivo

Revisar código para garantizar: calidad, corrección, optimización y cobertura de pruebas.

## Archivos Principales

- `src/entrypoints/background/` - Servicios backend
- `src/entrypoints/sidepanel/` - UI (Vanilla + Vue)
- `src/components/` - Componentes Vue
- `*.test.ts` - Pruebas

## Reglas

Sigue todas las especificaciones y buenas prácticas en [docs/guides/](docs/guides/).

### 1. Verificaciones Automáticas
[Calidad de código](/.agents/cc.md)

**Deben pasar todas.** Reportar errores críticos si fallan.

### 2. Revisión Manual

Por cada archivo verificar:
- ✅ Cumple reglas críticas arriba
- ❌ Anti-patrones detectados
- 🔄 Código duplicado
- ⚠️ Falta validación/manejo errores
- 📊 Cobertura de pruebas

### 3. Cobertura de Pruebas

Reportar:
- Archivos sin tests
- Archivos <70% cobertura
- Archivos >800 líneas (dividir)
- Tests críticos faltantes

## Categorías de Problemas

1. **Crítico**: Bugs, violaciones arquitectura, `any`, `setTimeout` async,
2. **Alto**: Anti-patrones TS, código duplicado (>3), falta validación, tests faltantes
3. **Medio**: Optimizaciones, cobertura <70%
4. **Bajo**: Naming, formateo, comentarios

## Formato de Entrega

```markdown
# Reporte de Revisión - [Fecha]

## Resumen
- Archivos: [N] | Problemas: [Críticos: X, Altos: Y, Medios: Z]
- Cobertura: [X]% | Archivos >800 líneas: [N]

## Verificaciones Automáticas
- lint: [✅/❌] | type-check: [✅/❌] | test: [✅/❌] | build: [✅/❌]

## Problemas Críticos
### [Archivo]:[Línea] - [Título]
**Problema:** [Descripción]
**Actual:** ```ts [código] ```
**Sugerido:** ```ts [código] ```
**Justificación:** docs/guides/[X].md - [razón]
**Impacto:** [Bajo/Medio/Alto]

## Problemas Altos
[Mismo formato, más resumido]

## Cobertura
- Sin tests: [archivos]
- <70%: [archivos + qué falta]
- >800 líneas: [archivos + propuesta división]
- Tests críticos faltantes: [lista]

## Recomendaciones Top 3
1. [Acción prioritaria]
2. [Segunda acción]
3. [Tercera acción]
```

## Criterios de Aceptación

- [ ] 4 verificaciones automáticas ejecutadas
- [ ] 100% archivos `src/entrypoints/` y `src/components/` revisados
- [ ] Mínimo 5 problemas identificados (si existen)
- [ ] Propuestas con código específico
- [ ] Análisis cobertura completo
- [ ] Referencias a `docs/guides/`
- [ ] Priorización por impacto

**Objetivo:** Mejorar calidad sin paralizar desarrollo. Enfoque en problemas reales de mantenibilidad, rendimiento y corrección.
