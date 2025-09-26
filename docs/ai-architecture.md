# Arquitectura de IA

## APIs integradas del navegador (Prioridad principal)

Browser AI explota las nuevas APIs de IA integrada en Chrome, siendo pionero en esta tecnología emergente. Las funciones preestablecidas como "Resumir", "Traducir", "Corregir" se mapean directamente a estas APIs nativas del navegador.

### Ventajas de las APIs integradas:
- **Rendimiento nativo**: Optimizado por el navegador
- **Privacidad total**: Los datos nunca salen del dispositivo
- **Sin costos**: No hay límites de API ni tarifas
- **Sin dependencias**: Funciona sin servicios externos

## Enfoque híbrido (elección del usuario)

El proyecto ofrece un enfoque híbrido donde el usuario tiene **libertad total** para elegir entre:

1. **APIs integradas del navegador** (recomendado)
2. **APIs en la nube** (opcional, incluso cuando las integradas están disponibles)

### Implementación
- **Toggle en la UI**: El usuario puede cambiar su preferencia por función
- **Información clara**: La interfaz informa cuando un método no está disponible
- **Fallback inteligente**: Si las APIs integradas fallan, se puede ofrecer la nube como alternativa

## Arquitectura técnica

- **Abstracción de proveedores**: Interfaz unificada que permite alternar entre APIs integradas/en la nube
- **Mapeo directo**: Funciones preestablecidas → APIs integradas en el navegador
- **Configuración persistente**: El usuario puede guardar sus preferencias por tipo de función


