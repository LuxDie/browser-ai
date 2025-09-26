# Flujos de Usuario y Estados

## Disparadores
1. **Menú Contextual**: al seleccionar texto → abrir `sidePanel` con entrada precargada
2. **Icono de la Extensión**: abre `sidePanel` en estado inicial

## Maquetación y Flujo de Trabajo
1. **Área de Entrada**: pestañas (página actual, entrada de usuario, URL)
2. **Barra de Acciones**: Corregir, Traducir, Resumir, Escribir, Reescribir, Prompt, Insertar/Reemplazar
3. **Áreas de Resultados**: resultados encadenables

## Comportamientos
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

Ver también: `../ui.md`, `../ux.md`
