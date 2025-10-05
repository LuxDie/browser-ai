# Experiencia de Usuario (UX)

## Principios de Diseño

### Filosofía General
- **Simplicidad**: Una sola vista, flujo lineal sin complejidad innecesaria
- **Eficiencia**: Acceso rápido desde cualquier página web
- **Privacidad**: Transparencia sobre dónde se procesa la información
- **Flexibilidad**: Libertad para elegir entre IA local y nube

### Patrones de Interacción
- **Consistencia con Chrome**: Seguir las convenciones de extensiones de Chrome
- **Contextual**: Las acciones aparecen cuando son relevantes
- **No intrusivo**: No interrumpe el flujo de trabajo del usuario
- **Progresivo**: Funcionalidad básica accesible, avanzada opcional

## Flujos de Usuario

### Onboarding (Primera vez)
1. **Instalación**: Mensaje de bienvenida explicando las capacidades
2. **Configuración inicial**: Elegir preferencias de IA (local/nube por defecto)
3. **Tutorial rápido**: Mostrar cómo seleccionar texto y usar el menú contextual
4. **Primera acción**: Guiar al usuario a probar una función básica

### Flujo Principal
1. **Selección**: Usuario selecciona texto en cualquier página web
2. **Acceso**: Clic derecho → menú contextual o clic en icono de extensión
3. **Elección**: Seleccionar acción (Corregir, Traducir, Resumir, etc.)
4. **Procesamiento**: Panel lateral se abre con indicador de progreso
5. **Resultado**: Mostrar resultado con opciones de acción adicional
6. **Encadenamiento**: Usar resultado como entrada para siguiente acción

### Flujo de Acciones Automáticas desde Menú Contextual
1. **Selección**: Usuario selecciona texto en cualquier página web
2. **Menú Contextual**: Clic derecho → seleccionar acción específica (Traducir, Corregir, Resumir, etc.)
3. **Apertura Automática**: Panel lateral se abre automáticamente con el texto cargado
4. **Ejecución Automática**: La acción seleccionada se ejecuta automáticamente sin intervención del usuario
5. **Resultado Inmediato**: El usuario ve el resultado completado automáticamente

### Flujos de Error
- **IA local no disponible**: Explicar por qué y ofrecer nube como alternativa
- **Sin conectividad**: Informar que solo IA local está disponible
- **Error de procesamiento**: Mensaje claro con opción de reintentar
- **Texto muy largo**: Sugerir dividir en partes más pequeñas

## Estados de la Interfaz

### Estados de Carga
- **Procesando local**: Indicador con mensaje "Procesando con IA del navegador..."
- **Procesando nube**: Indicador con mensaje "Enviando a servicio de IA..."
- **Descargando modelo**: Barra de progreso para modelos grandes

### Estados de Error
- **Error de IA local**: "No pude procesar esto localmente. ¿Quieres intentar con IA en la nube?"
- **Error de conectividad**: "Sin conexión. Solo IA local disponible."
- **Error de API**: "Servicio temporalmente no disponible. Reintentar en unos minutos."
- **Texto inválido**: "Por favor selecciona texto válido para procesar."

### Estados de Éxito
- **Texto insertado**: "Texto insertado en la página"
- **Texto reemplazado**: "Texto reenmplazado en la página"
- **Configuración guardada**: "Preferencias actualizadas"

## Comunicación y Feedback

### Tono de conversación
- El texto en la IU deberá utilizar primera persona, como si el navegador estuviese conversando con el usuario.
- **Ejemplos**:
  - "He corregido tu texto"
  - "No pude procesar esto localmente"
  - "¿Quieres que traduzca esto?"

### Atajos de Teclado
- Se deben poder configurar atajos de teclado para acceder a las funciones más utilizadas.
- **Atajos por defecto sugeridos**:
  - `Ctrl+Shift+C`: Corregir texto seleccionado
  - `Ctrl+Shift+T`: Traducir texto seleccionado
  - `Ctrl+Shift+R`: Resumir texto seleccionado
