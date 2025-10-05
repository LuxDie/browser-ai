La UI se presenta en un panel lateral con una única vista para facilitar el uso combinado y encadenado de las distintas funciones.

## Disparadores de la Extensión

1.  **Menú Contextual**: Al hacer clic derecho en la página o sobre un texto seleccionado, un menú ofrece las acciones disponibles. Al elegir cualquier acción (Traducir, Corregir, Resumir, etc.), se abre el panel lateral con el texto ya cargado en el "Área de Entrada" y se ejecuta automáticamente la acción seleccionada.

2.  **Icono de la Extensión**: Al hacer clic en el icono de la extensión en la barra de Chrome, se abre el panel lateral en su estado por defecto, listo para que el usuario escriba.

## Maquetación y Flujo de Trabajo

La interfaz se organiza en una sola columna vertical:

1.  **Área de Entrada**: Un área de texto principal donde se carga el texto de la página o el que el usuario escribe. Contiene 3 pestañas: página actual, selección y URL.
- Página actual: se oculta el área editable y se muestra una miniatura de la página actual.
- Entrada de usuario: el usuario puede escribir aquí o enviar texto desde una selección en la página con el menú contextual.
- URL: un campo que permite ingresar una URL para utilizar como origen de datos.
2.  **Idioma detectado**: Un cuadro donde figura el idioma detectado en el Área de Entrada cuando hay suficiente texto en ella. Cuando no hay suficiente texto, se muestra un mensaje indicándolo.
3.  **Controles de Traducción**: Un selector de idioma destino que permite al usuario elegir el idioma al que desea traducir el texto. Se muestra cuando la función de traducción está activa o cuando hay texto cargado.
4.  **Barra de Acciones**: Una fila de botones con las funciones principales ("Corregir", "Traducir", "Resumir", "Escribir", "Reescribir", "Prompt", e "Insertar/Reemplazar"). La misma se mostrará solo cuando el área asociada tenga el foco. Las funciones podrán ejecutarse mediante **APIs integradas** o **APIs en la nube**, según preferencia y disponibilidad.
Las opciones "Insertar/Reemplazar" se activarán cuando haya un campo editable con foco en la página web cargada.
5.  **Áreas de Resultados**: Una o varias áreas de texto editable donde se muestra el resultado de la última acción.
Cada área tendrá asociada una barra de acciones, que mostrará el resultado de la acción en el área inmediatamente posterior.

Para encadenar acciones (ej. resumir y luego traducir), el usuario puede usar el resultado de la primera acción como entrada para la segunda.

## Controles de Traducción

### Selector de Idioma Destino
```
┌─────────────────────────────────────┐
│ Idioma destino: [Español        ▼] │
└─────────────────────────────────────┘
```

- **Ubicación**: Entre el área de entrada y la barra de acciones
- **Visibilidad**: Se muestra cuando hay texto cargado o cuando la función de traducción está activa
- **Comportamiento**: 
  - Lista desplegable con todos los idiomas disponibles
  - Valor por defecto: idioma configurado en Opciones
  - Cambio dinámico: actualiza el par de idiomas para verificación de modelo

## Comportamientos Específicos

- **Todas las acciones**: Al usar cualquier función desde el menú contextual, se ejecuta automáticamente la acción al abrir el panel lateral. El usuario ve inmediatamente el resultado sin necesidad de hacer clic adicional. Si se accede desde el icono de la extensión, se requiere hacer clic en el botón correspondiente para ejecutar la acción.
- **Corregir**: Al usar esta función, además del resultado se mostrará un cuadro de sólo lectura con las diferencias resaltadas entre la entrada y la salida. 
- **Escribir/Reescribir**: Al pulsar estas acciones, el "Área de Entrada" mostrará un campo adicional "Instrucciones" para que el usuario escriba su "prompt" y guíe a la IA.

## Indicadores de Disponibilidad

### Píldoras de Estado de APIs (Solo Disponibilidad de APIs)
En la parte superior del panel se muestran píldoras que indican únicamente si las APIs nativas de Chrome están disponibles en el entorno:

```
┌─────────────────────────────────────┐
│ Browser AI                          │
│ Traducción con IA integrada         │
│                                     │
│ ✅ Traductor    ✅ Detector de Idioma│
└─────────────────────────────────────┘
```

**Estados de las píldoras:**
- ✅ **Verde**: API disponible en el entorno
- ❌ **Rojo**: API no disponible en este entorno

**Importante**: Estas píldoras indican únicamente si las APIs nativas de Chrome están disponibles en el entorno. NO muestran información sobre descarga de modelos específicos.

## Indicador de Origen de Traducción

Después de completar una traducción, se muestra un indicador visual que informa al usuario qué tipo de procesamiento se utilizó:

### Traducción Local (API Integrada)
```
┌─────────────────────────────────────┐
│ Traducción                          │
│                                     │
│ 🔒 Traducido localmente             │
│ [Texto traducido]                   │
│                                     │
│ [Copiar]                            │
└─────────────────────────────────────┘
```

### Traducción en la Nube (API Externa)
```
┌─────────────────────────────────────┐
│ Traducción                          │
│                                     │
│ ☁️ Traducido en la nube             │
│ [Texto traducido]                   │
│                                     │
│ [Copiar]                            │
└─────────────────────────────────────┘
```

**Indicadores:**
- 🔒 **Local**: Procesamiento realizado localmente usando APIs integradas de Chrome
- ☁️ **Nube**: Procesamiento realizado en la nube usando servicios externos

**Comportamiento:**
- El indicador aparece automáticamente después de cada traducción
- Se actualiza dinámicamente según el método de procesamiento utilizado
- Permite al usuario identificar la privacidad y velocidad del procesamiento

## Estados de Modelos de Traducción

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

**Nota**: La barra de progreso es indeterminada ya que Chrome AI no proporciona información específica sobre el progreso porcentual, tamaño total del paquete o tiempo estimado de descarga.
No se incluye un botón para cancelar la descarga ya que Chrome no expone esa funcionalidad.
Ver [ADR 0002](/docs/adr/0002-removal-cancel-download-button.md).

### Notificación Push (No Bloqueante)
Cuando el modelo está listo:

```
┌─────────────────────────────────────┐
│ ✅ Modelo ES→EN listo               │
└─────────────────────────────────────┘
```

### Resultado Final
Después de la traducción automática:

```
┌─────────────────────────────────────┐
│ [Texto traducido aparece aquí]      │
│                                     │
│ [Copiar] [Insertar] [Reemplazar]    │
└─────────────────────────────────────┘
```

## Configuración

La configuración general (como el idioma de traducción predeterminado) se gestiona en la página de "Opciones" de la extensión, accesible desde el menú de extensiones de Chrome.

### Opciones de Modelos de Traducción
- **Descarga automática**: Descargar modelos de idiomas más usados
- **Tamaño de descarga**: Límite de espacio para modelos
- **Fallback automático**: Usar nube si modelo local no está disponible
- **Notificaciones**: Habilitar/deshabilitar notificaciones push
- **Ejecución automática**: Habilitar/deshabilitar traducción automática al completar descarga

## Separación de Conceptos: APIs vs Modelos

### Disponibilidad de APIs (Píldoras Superiores)
- **Propósito**: Indicar si las APIs nativas de Chrome están disponibles en el entorno
- **Ubicación**: Parte superior del panel, junto al título
- **Estados**: Disponible, No disponible
- **Alcance**: General para todas las funciones (traducción, detección de idioma)

### Disponibilidad de Modelos (Sección Específica)
- **Propósito**: Indicar si el modelo específico para el par de idiomas está descargado
- **Ubicación**: Entre el selector de idioma y el botón de traducción
- **Estados**: Disponible, No disponible, Descargándose
- **Alcance**: Específico para el par de idiomas actual (ej: ES→EN)

Esta separación permite al usuario entender claramente:
1. Si su entorno soporta las APIs nativas (píldoras)
2. Si el modelo específico para su traducción está listo (sección de modelo)

