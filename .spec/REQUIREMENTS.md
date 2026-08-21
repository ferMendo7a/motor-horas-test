# REQUIREMENTS.md — Reglas de negocio y restricciones técnicas

## Descripción
Reglas de negocio globales y restricciones técnicas de ejecución para agentes LLM en este repositorio. Contexto general y alcance del proyecto en [`PROJECT.md`](PROJECT.md).

## Fuente de verdad
- Las reglas de negocio están descritas en el bloque **"Las reglas"** de [`README.md`](../README.md): es la principal fuente de verdad. El código puede estar incorrecto — ante cualquier conflicto entre código y README, el README prevalece.
- Considerar cada regla del README con absoluta minuciosidad, **sin modificarla**, adaptando cualquier instrucción o cambio de código a lo allí indicado.
- El objetivo es resolver las tareas descritas en [`CONSIGNA.md`](../CONSIGNA.md) (ver alcance en [`PROJECT.md`](PROJECT.md)); limitar cualquier cambio a lo solicitado.

## Reglas de negocio globales (resumen normativo de README.md)
1. **Ventana nocturna** `[inicioNocturno, finNocturno)`, por defecto `[20:00, 06:00)`; cruza medianoche.
2. **Jornada ordinaria** = duración del turno programado menos intervalo (si se descuenta); el tiempo trabajado la consume en orden cronológico, el resto es hora extra.
3. **Tolerancia de entrada, todo o nada**: atraso ≤ `toleranciaEntradaMinutos` → no se descuenta nada, se computa desde el inicio del turno. Atraso > tolerancia → se descuenta el atraso completo, se computa desde la marcación real.
4. **Tolerancia de salida, todo o nada** (simétrica): exceso ≤ `toleranciaSalidaMinutos` → no se computa. Exceso > tolerancia → se computa completo.
5. **Antes del turno**: no se computa, salvo `computarAntesDelTurno` activo.
6. **Intervalo**: si `descontarIntervalo` está activo, los minutos dentro de la ventana del intervalo no se computan.
7. **Feriado**: todo el tiempo trabajado en un día feriado va a categorías de feriado (no se separan ordinarias/extras). Turnos que cruzan medianoche se resuelven según `dividirTurnoPorMedianoche` (por tramo vs. por fecha de inicio del turno).
8. **Valor de la hora**: jornal = `salarioBase / diasMes` (mensual) o `salarioBase` (jornalero). Hora diurna = `jornal / divisorDiurno` (8); hora nocturna = `jornal / divisorNocturno` (7). El divisor se decide por el bloque horario que se paga, no por el turno completo.
9. **Recargos** sobre el valor de la hora del bloque: ordinaria diurna ×1, ordinaria nocturna ×(1+`recargoNocturno`), extra diurna ×(1+`recargoExtraDiurna`), extra nocturna ×(1+`recargoExtraNocturna`), feriado diurno ×(1+`recargoFeriado`), feriado nocturno ×(1+`recargoFeriado`+`recargoNocturno`).
10. **Tope de extras**: se pagan hasta `maximoExtrasDiariasMinutos`/día; el excedente no se paga (va a `excedente`). Si `pagarExtras` es `false`, el tope es cero.
11. **Redondeo**: cada categoría se redondea al guaraní; el total es la suma de categorías ya redondeadas.

> Ante cualquier discrepancia entre este resumen y [`README.md`](../README.md), el README manda.

## Resolución 118/2026 (tarea 2 — [`REGLA-NUEVA.md`](../REGLA-NUEVA.md))
- Recargo de horas ordinarias nocturnas: **40%** (reemplaza el 30% vigente) cuando aplica.
- Vigencia: **1° de octubre de 2026**. Jornadas anteriores a esa fecha → régimen anterior, sin recálculo.
- Adhesión: **voluntaria por empleador**. Empresas no adheridas siguen liquidando con el régimen anterior, indefinidamente.
- El adicional integra la base de cálculo de horas extraordinarias.
- Modelado de adhesión/vigencia queda a criterio de implementación, siempre que ambas condiciones de retrocompatibilidad se cumplan.

## Reglas técnicas de ejecución
- Todo código nuevo o modificado debe estar escrito en TypeScript.
- No agregar dependencias nuevas; limitarse a las existentes en [`package.json`](../package.json).
- El código debe ser compatible con lo definido en [`package.json`](../package.json) y [`tsconfig.json`](../tsconfig.json).
- Tras cualquier modificación de código, ejecutar:
```
npm test
npm run typecheck
```
