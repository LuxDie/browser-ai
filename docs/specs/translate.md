# Funcionalidad de Traducir

## Descripción Funcional
La funcionalidad "Traducir" permite al usuario traducir texto seleccionado o proporcionado a un idioma destino, utilizando modelos de IA locales integrados en el navegador. Esta acción se activa desde el panel lateral mediante un botón dedicado en la barra de acciones, o desde un menú contextual en la página web activa. Se ejecuta de manera asíncrona, con soporte para descargas de modelos bajo demanda.

## Requisitos Técnicos
- **Modelos de IA**: Utiliza modelos de traducción basados en APIs del navegador (como Chrome AI APIs), con soporte para múltiples idiomas destino.
- **Servicio de Backend**: `TranslationService` en el `background`, manejando abstracción de proveedores y ejecución diferida.
- **Gestión de Modelos**: Integrado con `ModelManager` para detección, descarga y monitoreo de modelos de traducción por idioma.
- **UI**: Componentes en `sidePanel` como `LanguageSelector`, `DownloadProgress`, etc.

## Flujos de Usuario

### Desde Menú Contextual 'Browser AI > Traducir'
1. Seleccionar texto y clic en opción "Browser AI > Traducir".
2. Abre el panel lateral si está cerrado.
3. Precarga el texto seleccionado en el área de entrada.
4. Ejecuta traducción automáticamente al idioma predeterminado.
5. Si el modelo está disponible: procesa y muestra el resultado.
6. Si el modelo está descargándose: muestra el progreso y realiza la traducción al completar.
7. Si el modelo no está disponible: muestra el error y los pasos para solucionarlo (cambiar o actualizar el navegador, etc.).

### Desde Panel
1. El usuario selecciona texto y abre el panel (icono).
2. El texto es precargado en el área de entrada.
3. Hace clic en el botón "Traducir".
4. Continúa el flujo desde el punto 5 del menú contextual.

## Estados de Modelos de Traducción

### Modelo Disponible o Descargable
- **Descripción**: El modelo está listo para usar o estará listo luego de descargarlo
- **Comportamiento**: Ejecutar traducción normalmente

### Modelo Descargándose
- **Descripción**: El modelo está siendo descargado luego de iniciar la traducción
- **Comportamiento**:
  - Mostrar indicador de progreso en el área de resultados
  - **Ejecutar automáticamente la traducción** cuando la descarga se complete
  - **Notificación push** cuando esté listo

### Modelo No Disponible
- **Descripción**: El modelo no está disponible o hubo un error en el flujo (descarga, error del navegador).
- **Comportamiento**:
  - Mostrar mensaje informativo en el área de resultados.
  - Ofrecer opciones: intentar de nuevo, reportar error, cambiar o actualizar navegador.

## Estados de la Funcionalidad

### Estados Generales
- **Carga**: Procesando traducción localmente.
- **Error**: Modelo no disponible, conectividad.
- **Éxito**: Traducción generada y mostrada.

## Flujos Específicos

#### Flujo: Cambio de Idioma Destino
1. Usuario selecciona nuevo idioma del selector desplegable.
2. Se cancela traducción previa si la hubiese.

Ver también: `../ui.md`, `../ux.md`, `user-flows.md`
