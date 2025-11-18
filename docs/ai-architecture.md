# Arquitectura de IA

**Versión:** v0.2.1
**Última modificación:** 2025-11-07

## APIs integradas del navegador (Prioridad principal)

Browser AI explota las nuevas APIs de IA integrada en el navegador, siendo pionero en esta tecnología emergente.

### APIs Soportadas
- **Language Detector**: Identificación automática del idioma del texto.
- **Translator**: Traducción de texto entre diferentes idiomas.
- **Summarizer**: Generación de resúmenes de texto.
- **Writer**: Generación de nuevo contenido de texto.
- **Rewriter**: Reescritura de texto existente manteniendo el significado original.
- **Proofreader**: Corrección de errores gramaticales, ortográficos y de estilo.
- **Prompt**: Interacción con modelos de IA para prompts personalizados.

Todas estas APIs se mapean directamente a las funcionalidades nativas del navegador.

### Versión Objetivo

- **Language Detector**: N/A
- **Translator**: N/A
- **Summarizer**: N/A
- **Writer**: N/A
- **Rewriter**: N/A
- **Proofreader**: N/A
- **Prompt**: N/A

### Ventajas de las APIs integradas:
- **Rendimiento nativo**: Optimizado por el navegador
- **Privacidad total**: Los datos nunca salen del dispositivo
- **Sin costos**: No hay límites de API ni tarifas
- **Sin dependencias**: Funciona sin servicios externos

## Enfoque híbrido (elección del usuario)

El proyecto ofrece un enfoque híbrido donde el usuario tiene **libertad total** para elegir entre:

1. **APIs integradas del navegador** (recomendado)
2. **APIs en la nube** (opcional, incluso cuando las integradas están disponibles)

### Implementación
- **Toggle en la UI**: El usuario puede cambiar su preferencia por función
- **Información clara**: La interfaz informa cuando un método no está disponible
- **Fallback inteligente**: Si las APIs integradas fallan, se puede ofrecer la nube como alternativa

## Arquitectura técnica

- **Servicio de Orquestación de IA**: Un componente central que dirige las operaciones de IA (traducción, resumen, etc.) y aplica la lógica de negocio de alto nivel.
- **Capa de Gestión de Modelos**: Una capa de abstracción sobre las APIs de IA del navegador. Se encarga de verificar la disponibilidad, descargar y ejecutar los modelos de IA.
- **Configuración persistente**: El usuario puede guardar sus preferencias por tipo de función.

## Gestión de Modelos de IA

### Detección de Disponibilidad
- **Detección de idioma**: Identificar automáticamente el idioma del texto seleccionado.
- **Verificación previa**: Comprobar la disponibilidad del modelo (traducción, resumen, etc.) antes de intentar una operación.
- **Cache de estado**: Almacenar el estado de disponibilidad para evitar verificaciones repetidas.
- **Monitoreo de cambios**: Detectar cuándo un modelo se descarga mientras la aplicación está abierta.

### Gestión de Descargas
- **Descargas en segundo plano**: Sin bloquear la interfaz de usuario.
- **Persistencia de estado**: Mantener el progreso de la descarga entre sesiones.
- **Manejo de errores**: Gestionar fallos de conectividad, espacio insuficiente, etc.
- **Integración con APIs de IA del navegador**: Usar las APIs nativas para la descarga y gestión de modelos.

### Ejecución Automática
- **Preservación de contexto**: Mantener el texto original y la configuración durante la descarga.
- **Ejecución diferida**: Almacenar la intención de la operación y ejecutarla automáticamente al completar la descarga.
- **Sin re-prompting**: El usuario no necesita volver a activar la operación.

### Notificaciones No Bloqueantes
- **Tipo**: Notificación push del sistema.
- **Duración**: Corta y con opción de cierre manual.
- **Posición**: No superpuesta al contenido principal.
- **Acción**: Solo informativa, no requiere interacción del usuario.

### Casos de Error Específicos
- **Sin conexión**: "Se requiere conexión a internet para descargar el modelo"
- **Espacio insuficiente**: "No hay suficiente espacio. Libera [X] MB para continuar"
- **Error de descarga**: "Error al descargar. [Reintentar] [Usar Nube]"
- **Modelo corrupto**: "El modelo está dañado. [Reinstalar]"
- **Versión incompatible**: "El modelo necesita actualización. [Actualizar]"
- **Fallo en operación automática**: "Error al completar la operación. [Reintentar]"
