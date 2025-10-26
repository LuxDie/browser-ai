# Funcionalidad de Resumir

## Descripción Funcional
La funcionalidad "Resumir" permite al usuario generar un resumen conciso del texto seleccionado o proporcionado, utilizando modelos de IA locales integrados en el navegador. Esta acción se activa desde el panel lateral mediante un botón dedicado en la barra de acciones, o desde un menú contextual en la página web activa. Posee soporte para descargas de modelos bajo demanda.

## Requisitos Técnicos
- **Modelos de IA**: Utiliza modelos de resumen basados en APIs del navegador (como Chrome AI APIs).
- **Servicio de Backend**: Crea un `SummarizationService` en el `background`, basado en `TranslationService`, manejando abstracción de proveedores y ejecución diferida.
- **Gestión de Modelos**: Integrado con `ModelManager` para detección, descarga y monitoreo del modelo de resumen.
- **UI**: Se utilizará la misma UI que se utiliza para la traducción.

## Flujos de Usuario

### Desde Menú Contextual 'Browser AI > Resumir'
1. Seleccionar texto y clic en opción "Browser AI > Resumir".
2. Abre el panel lateral si está cerrado
3. Precarga el texto seleccionado en el área de entrada.
4. Ejecuta el resumen automáticamente.
5. Muestra el resultado en el área de resultados.
6. Si el modelo está disponible: procesa y muestra el resultado.
7. Si el modelo está descargándose: muestra el progreso y realiza el resumen al completar.
8. Si el modelo no está disponible: muestra el error y los pasos para solucionarlo (cambiar o actualizar el navegador, etc.).

### Desde Panel
1. El usuario selecciona texto y abre el panel (icono o menú sin subopción).
2. El texto es precargado en el área de entrada.
3. Hace clic en el botón "Resumir".
4. Continúa desde el punto 5 del flujo desde el menú contextual.

## Estados de la Funcionalidad

### Estados Generales
- **Carga**: Procesando resumen localmente.
- **Error**: Modelo no disponible, conectividad, texto inválido.
- **Éxito**: Resumen generado y mostrado.

### Estados de Modelos

#### Modelo Disponible o Descargable
- **Descripción**: El modelo está listo o se descargará bajo demanda.
- **Comportamiento**: Ejecutar resumen normalmente.

#### Modelo Descargándose
- **Descripción**: Descarga iniciada tras solicitar resumen.
- **Comportamiento**:
  - Mostrar indicador de progreso en el área de resultados.
  - Ejecutar automáticamente al completar la descarga.
  - Notificación push cuando listo.

#### Modelo No Disponible
- **Descripción**: Modelo inaccesible o error.
- **Comportamiento**: Mostrar error y pasos para solucionarlo (cambiar o actualizar navegador, etc.).

A futuro se incorporará la capacidad de aprovechar las opciones de resumen de la API (tipo, formato, logitud, etc.).

Ver también: `../ui.md`, `../ux.md`, `user-flows.md`
