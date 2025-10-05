# Flujos de Usuario y Estados

## Disparadores
1. **Menú Contextual**: al seleccionar texto → mostrar notificación elegante → clic en "Abrir Traductor" → abrir `sidePanel` con entrada precargada.
   - **Workaround implementado**: Debido a restricciones de user gesture en Chrome, se muestra una notificación intermedia
   - **Todas las acciones**: ejecuta automáticamente la acción seleccionada al abrir el panel
   - **Sin duplicados**: Si el panel ya está abierto, solo actualiza el texto sin mostrar notificación
2. **Icono de la Extensión**: abre `sidePanel` en estado inicial en la ventana activa.

## Maquetación y Flujo de Trabajo
1. **Área de Entrada**: pestañas (página actual, entrada de usuario, URL)
2. **Barra de Acciones**: Corregir, Traducir, Resumir, Escribir, Reescribir, Prompt, Insertar/Reemplazar
3. **Áreas de Resultados**: resultados encadenables

## Comportamientos
- **Todas las acciones**: 
  - Desde menú contextual: notificación → clic en botón → ejecución automática al abrir el panel
  - Desde icono de extensión: requiere clic manual en el botón correspondiente
  - **Panel ya abierto**: actualización directa del texto sin notificación
- Corregir: mostrar diff de entrada/salida
- Escribir/Reescribir: mostrar campo "Instrucciones"

## Encadenamiento
- Usar el resultado como nueva entrada para acciones posteriores

## Configuración
- Preferencias en página de Opciones (idioma, proveedor IA)

## Estados
- Carga: local vs nube
- Error: IA local, conectividad, API, texto inválido
- Éxito: insertado, reemplazado, configuración guardada

## Estados de Modelos de Traducción

### Modelo No Disponible
- **Descripción**: El par de idiomas solicitado no está descargado localmente
- **Comportamiento**: 
  - Mostrar mensaje informativo en el área de resultados
  - Ofrecer opciones: descargar modelo, usar nube, cambiar idiomas
  - Mantener funcionalidad de otras acciones disponibles

### Modelo Descargándose
- **Descripción**: El modelo está siendo descargado en segundo plano
- **Comportamiento**:
  - Mostrar indicador de progreso en el área de resultados
  - Permitir cancelar la descarga
  - **Ejecutar automáticamente la traducción** cuando la descarga se complete
  - **Notificación push no bloqueante** cuando esté listo

### Modelo Disponible
- **Descripción**: El modelo está listo para usar
- **Comportamiento**: Ejecutar traducción normalmente

### Flujos Específicos de Modelos

#### Flujo: Modelo No Disponible
1. Usuario selecciona texto para traducir
2. Sistema detecta idioma del texto y determina par de idiomas (origen → destino)
3. Sistema detecta que el modelo para ese par no está descargado
4. UI muestra opciones: "Descargar Modelo", "Usar Nube"
5. Usuario elige una opción

#### Flujo: Descarga en Progreso
1. Usuario inicia descarga de modelo (después de seleccionar texto)
2. UI muestra indicador de progreso con porcentaje
3. **Al completar descarga**:
   - Notificación push no bloqueante: "Modelo ES→EN listo"
   - **Ejecución automática** de la traducción del texto seleccionado
   - Actualización de UI con resultado traducido

#### Flujo: Cambio de Idioma Destino
1. Usuario selecciona nuevo idioma del selector desplegable (siempre visible)
2. Sistema verifica disponibilidad del modelo para el nuevo par de idiomas
3. Si disponible: ejecuta traducción automáticamente
4. Si no disponible: muestra opciones de descarga o nube en el área de resultados

#### Flujo: Fallback a Nube
1. Usuario elige usar traducción en nube
2. Sistema verifica configuración de API en nube
3. Si configurada: ejecuta traducción normalmente
4. Si no configurada: muestra mensaje para configurar API

Ver también: `../ui.md`, `../ux.md`
