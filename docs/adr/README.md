# Architecture Decision Records (ADRs)

Mantén un registro versionado de decisiones de arquitectura.

## Convenciones
- Formato: `NNNN-titulo-decision.md`
- Idioma: castellano
- Contenido mínimo: contexto, decisión, consecuencias

## ADRs Registradas

### 0001 — Enfoque Híbrido de IA (Local + Nube)
**Decisión**: Adoptar un enfoque híbrido priorizando IA integrada del navegador con alternativa en la nube.
**Impacto**: Arquitectura de abstracción de proveedores, preferencias persistentes, mensajería clara en UI.

### 0002 — Diseño Simplificado de la UI de Descarga de Modelos
**Decisión**: Implementar UI de descarga simplificada sin botón cancelar, info de tamaño/tiempo, ni progreso porcentual.
**Impacto**: Diseño consistente con limitaciones de Chrome AI, evita expectativas falsas, reduce complejidad.

## Plantilla
```
# Título

## Contexto

## Decisión

## Consecuencias
```
