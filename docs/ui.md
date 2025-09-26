La UI se presenta en un panel lateral con una única vista para facilitar el uso combinado y encadenado de las distintas funciones.

## Disparadores de la Extensión

1.  **Menú Contextual**: Al hacer clic derecho en la página o sobre un texto seleccionado, un menú ofrece las acciones disponibles. Al elegir una, se abre el panel lateral con el texto ya cargado en el "Área de Entrada" y se ejecuta la acción elegida
2.  **Icono de la Extensión**: Al hacer clic en el icono de la extensión en la barra de Chrome, se abre el panel lateral en su estado por defecto, listo para que el usuario escriba.

## Maquetación y Flujo de Trabajo

La interfaz se organiza en una sola columna vertical:

1.  **Área de Entrada**: Un área de texto principal donde se carga el texto de la página o el que el usuario escribe. Contiene 3 pestañas: página actual, selección y URL.
- Página actual: se oculta el área editable y se muestra una miniatura de la página actual.
- Entrada de usuario: el usuario puede escribir aquí o enviar texto desde una selección en la página con el menú contextual.
- URL: un campo que permite ingresar una URL para utilizar como origen de datos.
2.  **Barra de Acciones**: Una fila de botones con las funciones principales ("Corregir", "Traducir", "Resumir", "Escribir", "Reescribir", "Prompt", e "Insertar/Reemplazar"). La misma se mostrará solo cuando el área asociada tenga el foco. Las funciones podrán ejecutarse mediante **APIs integradas** o **APIs en la nube**, según preferencia y disponibilidad.
Las opciones "Insertar/Reemplazar" se activarán cuando haya un campo editable con foco en la página web cargada.
3.  **Áreas de Resultados**: Una o varias áreas de texto donde se muestra el resultado de la última acción.
Cada área tendrá asociada una barra de acciones, que mostrará el resultado de la acción en el área inmediatamente posterior.

Para encadenar acciones (ej. resumir y luego traducir), el usuario puede usar el resultado de la primera acción como entrada para la segunda.

## Comportamientos Específicos

- **Corregir**: Al usar esta función, además del resultado se mostrará un cuadro de sólo lectura con las diferencias resaltadas entre la entrada y la salida. 
- **Escribir/Reescribir**: Al pulsar estas acciones, el "Área de Entrada" mostrará un campo adicional "Instrucciones" para que el usuario escriba su "prompt" y guíe a la IA.

## Configuración

La configuración general (como el idioma de traducción predeterminado) se gestiona en la página de "Opciones" de la extensión, accesible desde el menú de extensiones de Chrome.
