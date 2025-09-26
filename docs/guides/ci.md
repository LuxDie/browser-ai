# Integración Continua (CI)

## Objetivo
Garantizar que todas las pruebas pasen antes de fusionar cambios y que la documentación Specification-First esté actualizada.

## Requisitos de merge
- Pruebas unitarias en verde
- Sin reducción de cobertura (o con justificación aprobada)
- Especificaciones actualizadas si cambió el comportamiento

## Pasos típicos de pipeline
1. Instalar dependencias
2. Lint + Typecheck
3. Ejecutar pruebas con cobertura
4. Verificar enlaces de documentación (opcional)

## Ejemplo (GitHub Actions)
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck --if-present
      - run: npm test -- --coverage
```
