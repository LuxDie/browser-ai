## Documentación de Browser AI

Este directorio organiza la documentación siguiendo un enfoque Specification-First. Las especificaciones definen el comportamiento antes de implementar código.

### Índice
- Fundamentos: estos documentos señalan la dirección general y a futuro del proyecto. Su utilidad es servir de norte para la toma de desiciones más puntuales.
  - `general-description.md`
  - `roadmap.md`
  - `ai-architecture.md`
  - `ui.md`
  - `ux.md`
- Especificaciones: estos documentos detallan el comportamiento esperado de funcionalidades específicas o componentes. La implementación debe adherir estrictamente a ellas.
  - `specs/**`
- Guías de implementación: mejores prácticas y patrones para contribuir al código.
  - `guides/**`
- Decisiones (ADR): decisiones arquitectónicas importantes registradas para referencia futura.
  - `adr/**`

### Convenciones
- Estructura y nombres en inglés para código; documentación en castellano.
- Nombres de archivos de documentación en kebab-case.

### Versionado

Todos los documentos incluyen un encabezado como el siuiente:

```
**Versión:** v0.2.1
**Última modificación:** 2025-11-07
```

- El número de versión corresponde a la versión del proyecto en la cual se incorporarán las características descritas (generalmente la siguiente versión).
- Los `README.md` no tienen versión.
