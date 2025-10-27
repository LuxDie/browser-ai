# Funcionalidad de Resumir

**Versión:** v0.3.0  
**Última modificación:** 2025-10-27

## Descripción Funcional
La funcionalidad "Resumir" permite al usuario generar un resumen conciso del texto seleccionado o proporcionado, utilizando modelos de IA locales integrados en el navegador. Esta acción se activa desde el panel lateral mediante una pestaña "Procesar" que incluye una casilla para activar el resumen, o desde un menú contextual en la página web activa. El resumen se ejecutará como parte del procesamiento de texto, generando una versión condensada del contenido original. Posee soporte para descargas de modelos bajo demanda.

## Requisitos Técnicos
- **Modelos de IA**: Utiliza modelos de resumen basados en APIs del navegador (como Chrome AI APIs).
- **Servicio de Backend**: Crea un `SummarizationService` en el `background` para manejar abstracción de proveedores de IA y ejecución diferida de resúmenes.
- **Gestión de Modelos**: Integrado con `ModelManager` para detección, descarga y monitoreo del modelo de resumen.
- **UI**: Incluye una pestaña "Procesar" con una casilla para activar el resumen. Cuando está activado, el resumen se genera junto con otras operaciones de procesamiento de texto seleccionadas por el usuario.

## Flujos de Usuario

### Desde Menú Contextual 'Browser AI > Resumir'
1. Seleccionar texto y clic en opción "Browser AI > Resumir".
2. Abre el panel lateral si está cerrado
3. Precarga el texto seleccionado en el área de entrada.
4. Marca automáticamente la opción "Resumir" en la pestaña "Procesar".
5. Ejecuta el resumen automáticamente.
6. Muestra el resultado del resumen en el área de salida.
7. Si el modelo está disponible: procesa y muestra el resultado.
8. Si el modelo está descargándose: muestra el progreso y realiza el resumen al completar.
9. Si el modelo no está disponible: muestra el error y los pasos para solucionarlo (cambiar o actualizar el navegador, etc.).

### Desde Panel
1. El usuario selecciona texto y abre el panel (icono o menú sin subopción).
2. El texto es precargado en el área de entrada.
3. El usuario marca la casilla "Resumir" si desea generar un resumen.
4. El usuario configura otras opciones de procesamiento según sea necesario.
5. Hace clic en el botón "Procesar".
6. Se ejecuta el resumen junto con otras operaciones seleccionadas.
7. Los resultados se muestran en el área de salida.
8. Si el modelo de resumen está descargándose: muestra el progreso y realiza el resumen al completar.
9. Si el modelo de resumen no está disponible: muestra el error correspondiente.

## Estados de la Funcionalidad

### Estados Generales
- **Carga**: Procesando resumen localmente.
- **Error**: Modelo de resumen no disponible, conectividad, texto inválido.
- **Éxito**: Resumen generado y mostrado.

### Estados de Modelos

#### Modelo Disponible o Descargable
- **Descripción**: El modelo de resumen está listo o se descargará bajo demanda.
- **Comportamiento**: Ejecutar resumen normalmente.

#### Modelo Descargándose
- **Descripción**: Descarga iniciada tras solicitar resumen.
- **Comportamiento**:
  - Mostrar indicador de progreso en el área de resultados.
  - Ejecutar automáticamente al completar la descarga.
  - Notificación push cuando listo.

#### Modelo No Disponible
- **Descripción**: Modelo de resumen inaccesible o error.
- **Comportamiento**: Mostrar error y pasos para solucionarlo (cambiar o actualizar navegador, etc.).

A futuro se incorporará la capacidad de aprovechar las opciones de resumen de la API (tipo, formato, logitud, etc.).

Ver también: `../ui.md`, `../ux.md`, `user-flows.md`
