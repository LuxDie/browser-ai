# Estrategia de Pruebas

## Principios
- Toda funcionalidad nueva requiere pruebas unitarias
- Casos felices y casos borde relevantes
- Mantener o aumentar cobertura global; justificar reducciones
- Pruebas deben correr y pasar en CI antes de merge

## Niveles
- Unitarias: lógica pura (transformaciones, selección de proveedor)
- Integración ligera: comunicación panel ↔ background (mock de APIs de navegador)
- E2E manuales mínimos: checklist en `docs/roadmap.md`

## Alcance mínimo por feature
- Captura de texto (content → panel)
- Transformación/normalización de entrada
- Selección de proveedor IA (local/nube/fallback)
- Mapeo de acciones a comandos de IA
- Presentación de estados (carga, error, éxito)

## Herramientas sugeridas
- Vitest/Jest para unitarias
- ts-mockito o sinon para mocks
- `webextension-polyfill` para tipos de Chrome (si aplica)

## Ejemplo (pseudo)
```ts
import { selectProvider } from './provider';

test('fallback a nube cuando local falla', async () => {
  const result = await selectProvider({ localAvailable: true, localFails: true });
  expect(result.provider).toBe('cloud');
});
```
