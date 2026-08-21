# PROJECT.md — Motor de horas (contexto general y alcance)

## Propósito de este documento
Contexto global del proyecto para guiar agentes LLM bajo un enfoque *spec-driven*. Junto con [`REQUIREMENTS.md`](REQUIREMENTS.md) (reglas de negocio y técnicas), son los **únicos** archivos de referencia para ejecutar instrucciones en este repositorio.

## Qué es este proyecto
Motor simplificado de cálculo de horas trabajadas (TypeScript) y su suite de tests. Código sintético, escrito para un caso práctico de evaluación técnica — no es código de producción.

> La suite de tests pasa entera, pero el motor **no** cumple todas las reglas de negocio. Ese desajuste es intencional: es el objeto de la tarea 1.

## Alcance del ejercicio (3 tareas)
Definidas con detalle en [`CONSIGNA.md`](../CONSIGNA.md):

1. **Encontrar defectos** — el motor viola al menos tres reglas de [`README.md`](../README.md) aunque los tests pasen. Identificarlos, explicar la causa raíz y escribir un test que exponga cada uno (el test en rojo, antes del arreglo, es lo que más vale).
2. **Implementar la Resolución 118/2026** — descrita en [`REGLA-NUEVA.md`](../REGLA-NUEVA.md). Debe ser retrocompatible: empresas no adheridas y jornadas previas a la vigencia deben dar el mismo resultado que antes.
3. **Completar la bitácora** — [`BITACORA.md`](../BITACORA.md), cuatro preguntas cortas sobre el proceso de trabajo.

Fuera de alcance (opcional, no obligatorio): mejoras de diseño en `calcularJornada`, casos borde adicionales, validación de combinaciones inconsistentes de `ConfigEmpresa`, optimización de `partirEnBloques`. Si se toca algo de esto, documentarlo en la bitácora.

## Criterio de trabajo
- Cambios mínimos y quirúrgicos, priorizando retrocompatibilidad sobre reescritura.
- Priorizar tests que expongan el defecto por sobre el arreglo en sí.
- Ante ambigüedad de dominio, resolverla explícitamente y dejar constancia de la decisión (comentario breve o nota en bitácora), sin inventar reglas no escritas.

## Mapa de archivos del repositorio
```
CONSIGNA.md              enunciado completo del ejercicio
README.md                mapa del dominio + reglas de negocio (fuente de verdad)
REGLA-NUEVA.md           Resolución 118/2026 (tarea 2, documento ficticio)
BITACORA.md              entregable escrito (tarea 3)
package.json             dependencias y scripts (npm test, npm run typecheck, npm run caso)
tsconfig.json            configuración TypeScript del proyecto
src/
  calcular-horas.ts      motor de cálculo (núcleo del ejercicio, ~180 líneas en calcularJornada)
  config-empresa.ts      configuración por empresa (18 campos)
  feriados.ts            calendario de feriados
  tiempo.ts              aritmética de tiempo en minutos absolutos
  tipos.ts               tipos y vocabulario del dominio
  cli.ts                 CLI exploratorio (no forma parte del ejercicio)
test/
  calcular-horas.test.ts suite de tests (15 tests)
.spec/
  PROJECT.md             este archivo — contexto y alcance general
  REQUIREMENTS.md        reglas de negocio globales y reglas técnicas de ejecución
```

## Dominio en breve
Una **jornada** combina el **turno** programado con la **marcación** real de una persona. El motor devuelve minutos y guaraníes (G$) por categoría: seis pagables (ordinarias/extras/feriado × diurna/nocturna) y tres informativas (`intervalo`, `descuento`, `excedente`). Detalle completo de reglas en [`REQUIREMENTS.md`](REQUIREMENTS.md).

## Entregables esperados
- Repositorio (público o con acceso) con los cambios de código y tests.
- [`BITACORA.md`](../BITACORA.md) completada.
- Opcional: historial de la sesión con la IA.

## Referencia
Ver [`REQUIREMENTS.md`](REQUIREMENTS.md) para reglas de negocio y restricciones técnicas de ejecución.
