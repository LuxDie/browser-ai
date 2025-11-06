# Documentación de UI

**Versión:** v0.2.1
**Última modificación:** 2025-11-06

La UI se presenta en un panel lateral con una única vista para facilitar el uso combinado y encadenado de las distintas funciones.

## Disparadores de la Extensión

1.  **Menú Contextual**: Al hacer clic derecho en la página o sobre un texto seleccionado, un menú ofrece las acciones disponibles. Al elegir cualquier acción (Traducir, Corregir, Resumir, etc.), se abre el panel lateral con el texto ya cargado en el "Área de Entrada" y se ejecuta automáticamente la acción seleccionada.

2.  **Icono de la Extensión**: Al hacer clic en el icono de la extensión en la barra del navegador, se abre el panel lateral en su estado por defecto, listo para que el usuario escriba.

## Maquetación y Flujo de Trabajo

La interfaz se organiza en una sola columna vertical:

1.  **Área de Entrada**: Un área de texto principal donde se carga el texto de la página o el que el usuario escribe. Contiene 3 pestañas: página actual, selección y URL.
- Página actual: se oculta el área editable y se muestra una miniatura de la página actual.
- Entrada de usuario: el usuario puede escribir aquí o enviar texto desde una selección en la página con el menú contextual.
- URL: un campo que permite ingresar una URL para utilizar como origen de datos.
2.  **Idioma detectado**: Un cuadro donde figura el idioma detectado en el Área de Entrada cuando hay suficiente texto en ella. Cuando no hay suficiente texto, se muestra un mensaje indicándolo.
3.  **Controles de Procesamiento**: Un componente que agrupa los controles para las operaciones de IA, como la casilla "Resumir" y el selector de idioma de destino.
4.  **Barra de Acciones**: Una fila de botones con las funciones principales ("Corregir", "Traducir", "Resumir", "Escribir", "Reescribir", "Prompt", e "Insertar/Reemplazar"). La misma se mostrará solo cuando el área asociada tenga el foco. Las funciones podrán ejecutarse mediante **APIs integradas** o **APIs en la nube**, según preferencia y disponibilidad.
Las opciones "Insertar/Reemplazar" se activarán cuando haya un campo editable con foco en la página web cargada.
5.  **Áreas de Resultados**: Una o varias áreas de texto editable donde se muestra el resultado de la última acción.
Cada área tendrá asociada una barra de acciones, que mostrará el resultado de la acción en el área inmediatamente posterior.

Para encadenar acciones (ej. resumir y luego traducir), el usuario puede usar el resultado de la primera acción como entrada para la segunda.

## Controles de Procesamiento

Este componente agrupa los controles para las operaciones de IA.

```
┌─────────────────────────────────────┐
│ ☐ Resumir                           │
│ Idioma destino: [Español        ▼] │
└─────────────────────────────────────┘
```

- **Ubicación**: Entre el área de entrada y la barra de acciones
- **Visibilidad**: Se muestra cuando hay texto cargado.
- **Comportamiento**: 
  - Casilla para activar el resumen.
  - Lista desplegable con todos los idiomas disponibles para la traducción.
  - El botón "Procesar" inicia la operación seleccionada (traducción o resumen).

## Comportamientos Específicos

- **Todas las acciones**: Al usar cualquier función desde el menú contextual, se ejecuta automáticamente la acción al abrir el panel lateral. El usuario ve inmediatamente el resultado sin necesidad de hacer clic adicional. Si se accede desde el icono de la extensión, se requiere hacer clic en el botón correspondiente para ejecutar la acción.
- **Corregir**: Al usar esta función, además del resultado se mostrará un cuadro de sólo lectura con las diferencias resaltadas entre la entrada y la salida. 
- **Escribir/Reescribir**: Al pulsar estas acciones, el "Área de Entrada" mostrará un campo adicional "Instrucciones" para que el usuario escriba su "prompt" y guíe a la IA.

## Indicadores de Disponibilidad

### Advertencia de Indisponibilidad de Funcionalidad
Cuando las APIs principales para IA no están disponibles y no hay alternativas funcionales, se muestra una advertencia amarilla en la parte superior del panel:

```
┌─────────────────────────────────────┐
│ Browser AI                          │
│ IA integrada                        │
│ ⚠️ Las APIs nativas del navegador no │
│ están disponibles. Asegúrate de     │
│ usar una versión compatible con     │
│ características de IA habilitadas.  │
└─────────────────────────────────────┘
```

**Comportamiento:**
- Se muestra únicamente cuando no hay ninguna funcionalidad de procesamiento de texto disponible

## Indicador de Origen de Procesamiento

Después de completar una operación, se muestra un indicador visual que informa al usuario qué tipo de procesamiento se utilizó:

### Procesamiento Local (API Integrada)
```
┌─────────────────────────────────────┐
│ Resultado                           │
│                                     │
│ 🔒 Procesado localmente             │
│ [Texto resultado]                   │
│                                     │
│ [Copiar]                            │
└─────────────────────────────────────┘
```

### Procesamiento en la Nube (API Externa)
```
┌─────────────────────────────────────┐
│ Resultado                           │
│                                     │
│ ☁️ Procesado en la nube             │
│ [Texto resultado]                   │
│                                     │
│ [Copiar]                            │
└─────────────────────────────────────┘
```

**Indicadores:**
- 🔒 **Local**: Procesamiento realizado localmente usando APIs integradas del navegador
- ☁️ **Nube**: Procesamiento realizado en la nube usando servicios externos

**Comportamiento:**
- El indicador aparece automáticamente después de cada operación
- Se actualiza dinámicamente según el método de procesamiento utilizado
- Permite al usuario identificar la privacidad y velocidad del procesamiento

## Estados de Modelos de IA

### Modelo Descargándose
Durante la descarga del modelo:

```
┌─────────────────────────────────────┐
│ 📥 Descargando modelo (es-en) por   |
| única vez...                        │
│                                     │
│ ████████████░░░░░░░░░░░░░░░░░░      │
│                                     │
│ La descarga puede tomar algunos     │
│ minutos. Por favor, espere...       │
└─────────────────────────────────────┘
```

**Nota**: La barra de progreso es indeterminada ya que la API de IA del navegador no proporciona información específica sobre el progreso porcentual, tamaño total del paquete o tiempo estimado de descarga.
No se incluye un botón para cancelar la descarga ya que el navegador no expone esa funcionalidad.
Ver [ADR 0002](/docs/adr/0002-removal-cancel-download-button.md).

### Notificación Push (No Bloqueante)
Cuando el modelo está listo:

```
┌─────────────────────────────────────┐
│ ✅ Modelo ES→EN listo               │
└─────────────────────────────────────┘
```

### Resultado Final
Después de la operación automática:

```
┌─────────────────────────────────────┐
│ [Texto resultado aparece aquí]      │
│                                     │
│ [Copiar] [Insertar] [Reemplazar]    │
└─────────────────────────────────────┘
```

## Configuración

La configuración general (como el idioma de traducción predeterminado) se gestiona en la página de "Opciones" de la extensión, accesible desde el menú de extensiones del navegador.

### Opciones de Modelos de IA
- **Descarga automática**: Descargar modelos de idiomas más usados
- **Tamaño de descarga**: Límite de espacio para modelos
- **Fallback automático**: Usar nube si modelo local no está disponible
- **Notificaciones**: Habilitar/deshabilitar notificaciones push
- **Ejecución automática**: Habilitar/deshabilitar operación automática al completar descarga

## Separación de Conceptos: APIs vs Modelos

### Disponibilidad de Funcionalidad (Advertencia)
- **Propósito**: Alertar cuando no hay ninguna funcionalidad de procesamiento de texto disponible
- **Ubicación**: Parte superior del panel (solo cuando hay problemas)
- **Estados**: Oculta (cuando funciona), Visible (cuando no hay funcionalidad disponible)
- **Alcance**: General para todas las funciones de procesamiento de texto

### Disponibilidad de Modelos (Sección Específica)
- **Propósito**: Indicar si el modelo específico para la operación está descargado
- **Ubicación**: En la sección de controles de procesamiento
- **Estados**: Disponible, No disponible, Descargándose
- **Alcance**: Específico para la operación actual (ej: traducción ES→EN)

Esta separación permite al usuario entender claramente:
1. Si hay funcionalidad básica disponible (presencia/ausencia de advertencia)
2. Si el modelo específico para su operación está listo (sección de modelo)
