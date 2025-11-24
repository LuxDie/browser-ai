# 0005 — Mejora de UI para Descarga de Modelos: Cancelación y Progreso Determinado

## Estado
**Aceptado**

Este ADR anula y reemplaza la decisión tomada en [ADR 0002](0002-removal-cancel-download-button.md).

## Contexto
La API de Chrome AI soporta cancelación (`AbortController`) y monitoreo de progreso en descargas de modelos, capacidades subestimadas en ADR 0002. El `AIService` actual ya usa `AbortController`.

## Decisión
Revertir las restricciones de ADR 0002 para:
1. Mantener la funcionalidad de "Cancelar Descarga" (via `AbortController`).
2. Implementar una barra de progreso determinada (porcentual) en la UI, aprovechando la API.

### Cambio de Arquitectura
- **Antes:** UI sin cancelación y progreso indeterminado por supuestas limitaciones de API.
- **Después:** UI con cancelación y progreso determinado, aprovechando las capacidades reales de la API.

## Consecuencias
- **Mejor UX:** Mayor control y feedback visual para el usuario.
- **Funcionalidad Mejorada:** Los usuarios pueden cancelar y ver el progreso real.
- **Alineación Técnica:** Implementación coherente con las capacidades de la API.
- **Impacto en UI:** La UI será ligeramente más compleja, justificado por el beneficio.

### Consideraciones de Implementación
- Utilizar listeners de progreso de la API para actualizar la UI.
- Asegurar manejo cuidadoso de `cancelProcessing()` para evitar *race conditions*.
- La UI debe mostrar porcentaje de descarga y el botón de cancelar.

## Referencias
- `src/entrypoints/background/ai/ai.service.ts` (implementación)
- `cancelProcessing()` y `abortController.signal.aborted`
- Mensaje `modelDownloadCancelled`