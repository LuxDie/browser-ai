# Arquitectura de IA

## APIs integradas del navegador (Prioridad principal)

Browser AI explota las nuevas APIs de IA integrada en Chrome, siendo pionero en esta tecnología emergente. Las funciones preestablecidas como "Resumir", "Traducir", "Corregir" se mapean directamente a estas APIs nativas del navegador.

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

- **Abstracción de proveedores**: Interfaz unificada que permite alternar entre APIs integradas/en la nube
- **Mapeo directo**: Funciones preestablecidas → APIs integradas en el navegador
- **Configuración persistente**: El usuario puede guardar sus preferencias por tipo de función

## Gestión de Modelos de Traducción

### Detección de Disponibilidad
- **Detección de idioma**: Identificar automáticamente el idioma del texto seleccionado. Se requiere un mínimo de caracteres para asegurar que la detección sea precisa.
- **Verificación previa**: Comprobar disponibilidad del modelo para el par detectado antes de intentar traducción
- **Cache de estado**: Almacenar estado de disponibilidad para evitar verificaciones repetidas
- **Monitoreo de cambios**: Detectar cuando un modelo se descarga mientras la app está abierta

### Gestión de Descargas
- **Descargas en segundo plano**: Sin bloquear la interfaz de usuario
- **Persistencia de estado**: Mantener progreso de descarga entre sesiones
- **Manejo de errores**: Gestionar fallos de conectividad, espacio insuficiente, etc.
- **Integración con Chrome AI APIs**: Usar `LanguageModel.availability()` y `LanguageModel.create()` con monitoreo de progreso

### Ejecución Automática
- **Preservación de contexto**: Mantener texto original y configuración durante la descarga
- **Ejecución diferida**: Almacenar intención de traducción y ejecutarla automáticamente al completar
- **Sin re-prompting**: El usuario no necesita volver a activar la traducción

### Notificaciones No Bloqueantes
- **Tipo**: Notificación push del sistema (Chrome notifications API)
- **Duración**: 5 segundos máximo, con opción de cerrar manualmente
- **Posición**: Esquina superior derecha, no superpuesta al contenido
- **Acción**: Solo informativa, no requiere interacción del usuario

### Casos de Error Específicos
- **Sin conexión**: "Se requiere conexión a internet para descargar el modelo"
- **Espacio insuficiente**: "No hay suficiente espacio. Libera [X] MB para continuar"
- **Error de descarga**: "Error al descargar. [Reintentar] [Usar Nube]"
- **Modelo corrupto**: "El modelo está dañado. [Reinstalar]"
- **Versión incompatible**: "El modelo necesita actualización. [Actualizar]"
- **Fallo en traducción automática**: "Error al completar la traducción. [Reintentar]"


