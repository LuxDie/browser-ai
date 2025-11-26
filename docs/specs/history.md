# Funcionalidad de Historial

**Versión:** v0.1.0
**Última modificación:** 2025-11-26

## Descripción Funcional
La funcionalidad de "Historial" permite almacenar y recuperar los registros de las operaciones de procesamiento de texto (como Resumir y Traducir) realizadas por el usuario. Esto dota a la extensión de una memoria persistente, permitiendo al usuario consultar resultados anteriores sin necesidad de volver a procesar el texto.

## Requisitos Técnicos
- **Almacenamiento Local**: Utiliza la API `browser.storage.local` para persistir los datos en el navegador del usuario.
- **Servicio de Almacenamiento**: Un `StorageService` genérico abstrae las operaciones de lectura y escritura.
- **Servicio de Historial**: Un `HistoryService` en el `background` gestiona la lógica de negocio, incluyendo la estructura de los datos y las políticas de retención.
- **Límite de Almacenamiento**: Se mantiene un máximo de **50 registros** recientes para optimizar el espacio y rendimiento.

## Estructura de Datos
Cada entrada en el historial (`HistoryRecord`) contiene:
- **ID**: Identificador único (UUID).
- **Timestamp**: Fecha y hora del procesamiento.
- **Tipo**: Tipo de operación (`summarize` | `translate`).
- **Input**: Texto original proporcionado por el usuario.
- **Output**: Resultado generado por la IA.
- **Metadatos**: Información adicional como idiomas de origen/destino.

## Flujos de Usuario (Backend)
*Nota: Esta especificación cubre actualmente la capa de datos y servicio. La integración en UI se definirá en futuras iteraciones.*

### Registro de Operación
1. El usuario completa exitosamente una operación de IA (ej. traducir).
2. El sistema invoca automáticamente al `HistoryService` para guardar el resultado.
3. Se genera un nuevo registro con ID y timestamp.
4. El registro se añade al inicio de la lista.
5. Si la lista excede los 50 elementos, se eliminan los más antiguos.
6. La lista actualizada se persiste en `browser.storage`.

### Consulta de Historial
1. La interfaz solicita el historial al `HistoryService`.
2. El servicio recupera los datos crudos del almacenamiento.
3. Se devuelve la lista ordenada cronológicamente (más reciente primero).

### Limpieza de Historial
1. El usuario solicita borrar el historial.
2. El servicio elimina la clave correspondiente del almacenamiento.
3. El historial queda vacío.

## Estados del Sistema
- **Persistido**: Datos guardados correctamente en local storage.
- **Límite Alcanzado**: El historial ha llegado a 50 elementos; los nuevos registros desplazan a los antiguos.
- **Vacío**: No hay registros almacenados.

Ver también: `extension-architecture.md`
