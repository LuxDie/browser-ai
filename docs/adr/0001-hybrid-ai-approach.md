# 0001 — Enfoque Híbrido de IA (Local + Nube)

## Contexto
Chrome introduce APIs de IA integradas con ventajas de rendimiento y privacidad. Sin embargo, algunas funciones avanzadas o disponibilidad pueden requerir servicios en la nube.

## Decisión
Adoptar un enfoque híbrido: priorizar IA integrada del navegador y ofrecer alternativa en la nube conmutables por el usuario y con fallback automático cuando corresponda.

## Consecuencias
- Necesidad de una capa de abstracción de proveedores
- Preferencias persistentes por función (local/nube)
- Mensajería clara en UI sobre el método utilizado y sus limitaciones
