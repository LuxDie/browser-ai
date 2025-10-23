# Flujos de Usuario y Estados

## Disparadores
1. **Menú Contextual**: al seleccionar texto abrir `sidePanel` con entrada precargada.
   - **Todas las acciones**: ejecuta automáticamente la acción seleccionada al abrir el panel. 
2. **Icono de la Extensión**: abre `sidePanel` en estado inicial en la ventana activa.

## Maquetación y Flujo de Trabajo
1. **Área de Entrada**: pestañas (página actual, entrada de usuario, URL)
2. **Barra de Acciones**: Corregir, Traducir, Resumir, Escribir, Reescribir, Prompt, Insertar/Reemplazar
3. **Áreas de Resultados**: resultados encadenables

## Comportamientos
- **Traducción**: 
  - Desde menú contextual:
    1. Clic en opción "Traducir"
    2. Abre el panel si está cerrado
    3. Copia texto al panel de traducción
    4. Panel detecta idioma
    5. Ejecuta traducción
    6. Muestra resultado

## Estados
- Carga: local
- Error: IA local, conectividad, API, texto inválido
- Éxito: insertado, reemplazado, configuración guardada

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
- **Descripción**: El modelo no está disponible o hubo un error en el flujo (descarga, error del navegador)
- **Comportamiento**: 
  - Mostrar mensaje informativo en el área de resultados
  - Ofrecer opciones: intentar de nuevo, reportar error
  - Mantener funcionalidad de otras acciones disponibles

### Flujos Específicos de Modelos

#### Flujo: Descarga en Progreso
1. Modelo inicia descarga (después de iniciar traducción de texto)
2. UI muestra indicador de progreso con porcentaje
   - **Ejecución automática al completar la descarga** de la traducción del texto seleccionado
   - Actualización de UI con resultado traducido
   - Notificación push: "Traducción completada"

#### Flujo: Cambio de Idioma Destino
1. Usuario selecciona nuevo idioma del selector desplegable
2. Se cancela traducción previa si la hubiese

#### Flujo: Modelo No Disponible
1. Si no disponible o error: muestra información
2. Ofrecer opciones: intentar de nuevo, reportar error

Ver también: `../ui.md`, `../ux.md`
