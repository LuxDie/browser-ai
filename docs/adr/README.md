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
**Nota**: Esta decisión fue posteriormente corregida por el ADR 0005.

### 0003 — Adopción de Vue 3
**Decisión**: Adoptar Vue 3 como framework frontend principal.
**Impacto**: Componentes reactivos, Composition API, mejores herramientas de desarrollo.

### 0004 — Adopción de Vuetify 3
**Decisión**: Adoptar Vuetify 3 como biblioteca de componentes UI.
**Impacto**: Componentes Material Design, theming consistente, accesibilidad integrada.

### 0005 — Soporte para Cancelación y Progreso de Descarga de Modelos
**Decisión**: Revisar y corregir las limitaciones del ADR 0002 para permitir la cancelación y la implementación de una barra de progreso determinada para las descargas de modelos.
**Impacto**: Funcionalidad de cancelación y feedback de progreso mejorados, mejor UX, y alineación con las capacidades reales de la API.
**Estado**: Anula y reemplaza las decisiones del ADR 0002.

## Plantilla
```
# Título

## Contexto

## Decisión

## Consecuencias
```
