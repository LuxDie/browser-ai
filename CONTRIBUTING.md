# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir al proyecto **Browser AI**! Esta guía te ayudará a entender cómo colaborar efectivamente siguiendo nuestras reglas y estándares.

## 📋 Tabla de Contenidos

- [Flujo de Trabajo](#-flujo-de-trabajo)
- [Requisitos Previos](#-requisitos-previos)
- [Proceso de Contribución](#-proceso-de-contribución)
- [Reglas de Código](#-reglas-de-código)
- [Pruebas](#-pruebas)
- [Mensajes de Commit](#-mensajes-de-commit)
- [Pull Requests](#-pull-requests)
- [Reportar Issues](#-reportar-issues)

## 🚀 Flujo de Trabajo

Seguimos un enfoque **Specification-First** donde todos los cambios deben basarse en la especificación técnica documentada en `docs/`.

### Pasos para contribuir:

1. **Revisar documentación** - Lee los documentos en `docs/` antes de comenzar
2. **Crear issue** - Si no existe, crea un issue describiendo la tarea
3. **Desarrollar** - Implementa siguiendo las reglas del proyecto
4. **Probar** - Asegúrate de que todas las pruebas pasen
5. **Crear PR** - Envía un Pull Request usando la plantilla proporcionada

## 📋 Requisitos Previos

Antes de contribuir, asegúrate de tener instalado:

- **Node.js** (versión LTS recomendada)
- **npm** o **yarn**
- **Git**

### Configuración inicial:

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/browser-ia-repo.git
cd browser-ia-repo

# Instalar dependencias
npm install

# Verificar instalación
npm run lint
npm run type-check
npm run test
npm run build
```

## 🔄 Proceso de Contribución

### 1. Preparar el entorno

```bash
# Crear rama para tu contribución
git checkout -b feature/nombre-descriptivo
```

### 2. Desarrollo

- Sigue las reglas de internacionalización
- Mantén la arquitectura del proyecto
- Agrega pruebas para nueva funcionalidad

### 3. Verificación

Antes de enviar cambios, ejecuta:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

### 4. Commit

Usa mensajes de commit en inglés siguiendo [Conventional Commits](https://conventionalcommits.org/):

```bash
# Ejemplos válidos
git commit -m "feat: add user authentication"
git commit -m "fix: resolve memory leak in service worker"
git commit -m "docs: update API documentation"
```

### 5. Pull Request

- Usa la plantilla de PR proporcionada
- Describe claramente los cambios
- Incluye capturas de pantalla si aplica
- Marca todos los checkboxes relevantes

## 📝 Reglas de Código

### Internacionalización

**Código y estructura: INGLÉS**
- Nombres de archivos: `user-service.ts`
- Variables y funciones: `getUserData()`
- Clases: `UserService`
- Mensajes de confirmación: `feat: add new options`

**Documentación: CASTELLANO**
- Comentarios en código
- Archivos README.md
- Documentación en `docs/`

### Nomenclatura de Archivos

- **Especiales**: `README.md`, `LICENSE.md` (MAYÚSCULAS)
- **Documentación**: `kebab-case.md`
- **Código**: Según convención del lenguaje

## 🧪 Pruebas

**Obligatorio:** Toda nueva funcionalidad debe incluir pruebas unitarias.

### Requisitos:

- ✅ Pruebas unitarias para nueva funcionalidad
- ✅ Actualización de pruebas existentes si aplica
- ✅ Cobertura mantenida o mejorada
- ✅ Pruebas pasan en CI

### Ejecutar pruebas:

```bash
# Ejecutar todas las pruebas
npm run test

# Ejecutar pruebas con cobertura
npm run test:coverage

# Ejecutar pruebas en modo watch
npm run test:watch
```

## 📝 Mensajes de Commit

Seguimos el estándar [Conventional Commits](https://conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Tipos permitidos:

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bugs
- `docs`: Cambios en documentación
- `style`: Cambios de formato/estilo
- `refactor`: Reestructuración de código
- `test`: Agregar o actualizar pruebas
- `chore`: Cambios en herramientas/configuración

### Ejemplos:

```bash
feat: add dark mode toggle
fix: resolve extension popup positioning
docs: update installation guide
refactor: simplify authentication flow
test: add unit tests for user preferences
```

## 🔄 Pull Requests

### Plantilla

Usa la plantilla `.github/pull_request_template.md` que incluye:

- Descripción del cambio
- Issues relacionados
- Tipo de cambio
- Checklist de pruebas
- Checklist de calidad
- Información adicional

### Revisión

Los PRs requieren:

- ✅ Aprobación de al menos un revisor
- ✅ Todas las verificaciones de CI pasan
- ✅ Checklist completo
- ✅ Pruebas incluidas (si aplica)

## 🐛 Reportar Issues

### Tipos de Issues

- **🐛 Bug**: Problemas o errores
- **✨ Feature**: Nuevas funcionalidades
- **📚 Documentation**: Mejoras en documentación
- **🔧 Enhancement**: Mejoras en funcionalidad existente
- **❓ Question**: Preguntas o aclaraciones

### Plantilla de Issue

Usa las plantillas proporcionadas en `.github/ISSUE_TEMPLATE/` para:

- Describir claramente el problema
- Proporcionar pasos para reproducir
- Incluir información del entorno
- Agregar etiquetas apropiadas

### Convenciones para Issues, Pull Requests, Tags y Milestones

Para mantener orden, profesionalismo y facilitar la colaboración y el filtrado en GitHub, se deben cumplir las siguientes convenciones:

#### Título y Etiquetas para Issues

- Cada issue debe comenzar con un prefijo según su tipo:
    - `✨ [FEATURE]:` para nuevas funcionalidades
    - `🐛 [BUG]:` para reporte de errores
    - `📚 [DOCS]:` para documentación o estándares
    - `♻️ [REFACTOR]:` para refactorizaciones/reorganización de código
    - `🛠️ [CHORE]:` para tareas de mantenimiento, configuración o build
- El título en inglés, claro y conciso, siguiendo la plantilla correspondiente.
- Etiquetas mínimas requeridas:
    - Feature: `enhancement`
    - Bug: `bug`
    - Docs: `documentation`
    - Refactor: `refactor`
    - Chore: `chore`
- Puedes agregar etiquetas secundarias según corresponda (ej: `ui`, `testing`, `typescript`).

#### Idioma en Issues, Pull Requests, Tags y Milestones

- **Títulos**: Siempre en inglés, incluyendo el prefijo.
- **Contenido/descripciones**: En castellano. Explica el contexto y los detalles técnicos en español.
- **Tags (etiquetas)**: En inglés.
- **Milestones**: El nombre principal en inglés; la descripción puede estar en castellano.
- **Pull Requests**:
    - Título en inglés (con tipo de cambio, por ejemplo, “✨ [FEATURE]: Add new settings page”).
    - Descripción en castellano, incluyendo contexto, motivación y cambios principales.
- **Commits**: Mensajes en inglés siguiendo [Conventional Commits](https://www.conventionalcommits.org/).

Esto asegura máxima claridad, internacionalización y coherencia con el resto del código y documentación.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

1. Revisa la documentación en `docs/`
2. Busca issues existentes
3. Crea un nuevo issue con la etiqueta `question`
4. Contacta al equipo de mantenimiento

## 🙏 Código de Conducta

Este proyecto sigue un [Código de Conducta](CODE_OF_CONDUCT.md) para mantener un ambiente colaborativo e inclusivo. Al participar, aceptas:

- Ser respetuoso con todos los colaboradores
- Mantener un lenguaje profesional
- Aceptar constructivamente la retroalimentación
- Contribuir de manera positiva al proyecto

---

¡Gracias por contribuir y ayudar a mejorar **Browser AI**! 🚀
