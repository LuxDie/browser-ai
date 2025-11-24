# 0002 — Diseño Simplificado de la UI de Descarga de Modelos

## Estado
**Anulado**

**Nota:** La decisión tomada en este ADR ha sido anulada y reemplazada por [ADR 0005 — Soporte para Cancelación y Progreso de Descarga de Modelos](0005-model-download-cancellation-support.md).

## Contexto
Durante el diseño de la interfaz de descarga de modelos de traducción para el panel lateral, se evaluaron varias opciones para mostrar el progreso de descarga. Sin embargo, la API de Chrome AI presenta limitaciones significativas:

1. **No hay soporte para cancelar descargas**: La API no expone métodos para interrumpir descargas de modelos una vez iniciadas
2. **No hay información de tamaño total**: No se puede determinar el tamaño total del paquete de lenguaje antes de la descarga
3. **No hay estimación de duración**: No se puede calcular el tiempo estimado de descarga

Inicialmente se consideró incluir un botón "Cancelar Descarga", información de tamaño y tiempo estimado, y una barra de progreso porcentual. Sin embargo, estas funcionalidades no pueden implementarse debido a las limitaciones de la plataforma.

## Decisión
Implementar una interfaz de descarga simplificada que:

1. **No incluye botón "Cancelar Descarga"**: Ya que Chrome no proporciona la funcionalidad necesaria
2. **No muestra información de tamaño ni tiempo estimado**: Ya que esta información no está disponible en la API
3. **Usa barra de progreso indeterminada**: Una animación continua que indica actividad sin porcentajes específicos

Esta decisión se toma de manera preventiva durante la fase de diseño para evitar implementar elementos de UI que no puedan ser funcionalmente soportados por la plataforma.

## Consecuencias
- Diseño de UI más simple y consistente con las capacidades reales de la plataforma
- Evita la implementación de elementos no funcionales que generarían expectativas falsas en los usuarios
- Reduce la complejidad del código y mantenimiento futuro
- Los usuarios comprenderán desde el inicio que las descargas siguen un proceso natural, alineando sus expectativas con las limitaciones técnicas
- La barra indeterminada proporciona feedback visual de que la descarga está en progreso sin hacer promesas específicas sobre tiempo o tamaño
