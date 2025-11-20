# Pruebas E2E con Playwright

Este directorio contiene las pruebas end-to-end (E2E) para la extensión Browser AI, utilizando Playwright.

## Estructura

```
e2e/
├── fixtures.ts           # Fixtures personalizados para cargar la extensión y mockear APIs
├── mocks/
│   └── ai-api.mocks.ts  # Mocks de las APIs de Chrome AI
├── smoke.spec.ts        # Pruebas de humo (carga básica)
├── translation.spec.ts  # Pruebas del flujo de traducción
├── summarization.spec.ts # Pruebas del flujo de resumen
└── README.md            # Este archivo
```

## Requisitos previos

1. **Compilar la extensión**: Las pruebas E2E requieren que la extensión esté compilada.

```bash
npm run build
```

2. **Instalar navegadores de Playwright** (solo la primera vez):

```bash
npx playwright install chromium
```

## Ejecutar las pruebas

### Todas las pruebas en modo headless (por defecto)

```bash
npm run test:e2e
```

### Con interfaz gráfica de Playwright

```bash
npm run test:e2e:ui
```

### Con navegador visible (headed mode)

```bash
npm run test:e2e:headed
```

### Modo debug (paso a paso)

```bash
npm run test:e2e:debug
```

### Ejecutar una prueba específica

```bash
npx playwright test smoke.spec.ts
```

## Estrategia de mocking

Las pruebas E2E mockean las APIs de Chrome AI (`Translator`, `Summarizer`, `LanguageDetector`) para:

1. **Independencia del entorno**: Las pruebas no dependen de que las APIs reales estén disponibles
2. **Velocidad**: Los mocks responden instantáneamente
3. **Confiabilidad**: Comportamiento predecible en CI/CD
4. **Control**: Podemos simular diferentes estados (disponible, descargando, error)

### Cómo funcionan los mocks

1. **Inyección en el Service Worker**: Los mocks se inyectan usando `ModelManager.setMockAPIs()`
2. **Fixtures personalizados**: `fixtures.ts` proporciona un helper `mockAIAPIs()` para facilitar la inyección
3. **Mocks reutilizables**: `ai-api.mocks.ts` contiene implementaciones mock estándar

## Tipos de pruebas

### Smoke Tests (`smoke.spec.ts`)

Verifican que la extensión se carga correctamente:
- ID de extensión válido
- Service Worker activo
- Extensión visible en chrome://extensions
- Panel lateral puede abrirse

### Translation Tests (`translation.spec.ts`)

Prueban el flujo de traducción:
- Disponibilidad del modelo
- Traducción básica
- Manejo de errores

### Summarization Tests (`summarization.spec.ts`)

Prueban el flujo de resumen:
- Disponibilidad del modelo
- Resumen con opciones por defecto
- Resumen con opciones personalizadas
- Flujo combinado (resumir + traducir)

## Reportes

Después de ejecutar las pruebas:

- **Reporte HTML**: `e2e-report/index.html`
- **Artefactos**: `e2e-results/` (screenshots, videos en caso de fallos)

Para ver el reporte HTML:

```bash
npx playwright show-report e2e-report
```

## CI/CD

Las pruebas E2E están configuradas para ejecutarse en GitHub Actions. En CI:
- Se ejecutan en modo headless
- Se genera un reporte HTML como artefacto
- Los screenshots y videos se guardan solo en caso de fallo

## Troubleshooting

### Error: "Extension not loaded"

Asegúrate de compilar la extensión antes de ejecutar las pruebas:

```bash
npm run build
npm run test:e2e
```

### Error: "ModelManager not available"

Verifica que el Service Worker de la extensión esté activo. Puedes usar el modo headed para depurar:

```bash
npm run test:e2e:headed
```

### Pruebas lentas o timeout

Aumenta el timeout en `playwright.config.ts` si las pruebas necesitan más tiempo:

```typescript
timeout: 60000, // 60 segundos
```

## Mejoras futuras

- [ ] Pruebas de interacción con el sidepanel
- [ ] Pruebas de menú contextual
- [ ] Pruebas de notificaciones
- [ ] Pruebas de estados de descarga de modelos
- [ ] Integración con visual regression testing