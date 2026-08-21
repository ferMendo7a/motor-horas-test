# Casos de prueba — Motor de horas

Casos ejecutados con `npm run caso` para comparar el resultado del motor contra lo que exige cada regla de [`README.md`](../README.md), sección "Las reglas". Empresa por defecto: **Frigorífico del Este S.A.** (`--empresa frigorifico`, implícita si se omite `--empresa`); salario mensual de referencia 3.000.000 G$ salvo indicación contraria.

Convención de esta tabla:
- **Resultado obtenido**: salida real de `npm run caso`.
- **Resultado esperado**: valor que exige la regla de README.md citada, calculado a mano.
- **Comparación**: `✅ Coincide` o `❌ Difiere` (con la causa raíz si difiere).

---

## 1 · Horario diurno

### Caso Diurno #1 — Jornada ordinaria diurna simple (Regla 2, Regla 8)

```
npm run caso -- --turno 08:00-17:00 --intervalo 12:00-13:00 --entrada 08:00 --salida 17:00 --fecha 2026-08-20
```

**Descripción:** turno administrativo 08:00-17:00 con intervalo 12:00-13:00, marcación exacta, día no feriado. Es el ejemplo numérico del propio README.

**Resultado esperado:** 480 min ordinarios diurnos (8h), jornal 100.000 G$, hora diurna 12.500 G$ → **100.000 G$** de total. 60 min de intervalo no computados.

**Resultado obtenido:**
```
Ordinarias diurnas   8h 00m   100.000 G$
Intervalo            1h 00m         —
TOTAL                8h 00m   100.000 G$
```

**Comparación:** ✅ Coincide.

---

### Caso Diurno #2 — Borde de tolerancia de entrada (Regla 3)

```
npm run caso -- --turno 08:00-17:00 --intervalo 12:00-13:00 --entrada 08:10 --salida 17:00 --fecha 2026-08-20
```

**Descripción:** entrada con atraso de exactamente 10 minutos, igual a `toleranciaEntradaMinutos` (10) del Frigorífico. Regla 3: *"si el atraso es **menor o igual** a la tolerancia, no se descuenta nada y la jornada se computa desde el inicio del turno"*.

**Resultado esperado:** atraso de 10 min está dentro de la tolerancia (10 ≤ 10) → sin descuento, jornada computada desde 08:00 → 480 min ordinarios diurnos → **100.000 G$**, igual que el Caso Diurno #1.

**Resultado obtenido:**
```
Ordinarias diurnas   7h 50m    97.917 G$
Intervalo            1h 00m         —
Descuento por atraso 0h 10m         —
TOTAL                7h 50m    97.917 G$
· Atraso de 10 min: se pierde la tolerancia y se descuenta completo.
```

**Comparación:** ❌ Difiere. El motor descuenta 10 min y computa desde la marcación real, como si el atraso **superara** la tolerancia. Causa raíz en [`src/calcular-horas.ts`](../src/calcular-horas.ts): la condición `atraso < cfg.toleranciaEntradaMinutos` usa comparación estricta; con atraso exactamente igual a la tolerancia, cae en la rama de "se pierde la tolerancia" en lugar de la rama de "dentro de tolerancia". Debería ser `atraso <= cfg.toleranciaEntradaMinutos`. Impacto: 97.917 G$ obtenidos vs. 100.000 G$ esperados (-2.083 G$).

---

## 2 · Horario nocturno

### Caso Nocturno #1 — Jornada ordinaria nocturna simple (Regla 1, Regla 8, Regla 9)

```
npm run caso -- --turno 22:00-06:00 --entrada 22:00 --salida 06:00 --fecha 2026-08-20
```

**Descripción:** turno íntegramente contenido en la ventana nocturna `[20:00, 06:00)`, marcación exacta, sin intervalo, día no feriado.

**Resultado esperado:** 480 min ordinarios nocturnos. Hora nocturna = 100.000 / 7 = 14.285,71 G$; con recargo nocturno (+30%) = 18.571,43 G$/hora × 8h = **148.571 G$** (redondeado).

**Resultado obtenido:**
```
Ordinarias nocturnas  8h 00m   148.571 G$
TOTAL                 8h 00m   148.571 G$
```

**Comparación:** ✅ Coincide.

---

### Caso Nocturno #2 — Borde de tolerancia de salida con extra nocturna (Regla 4, Regla 9)

```
npm run caso -- --turno 20:00-04:00 --entrada 20:00 --salida 04:20 --fecha 2026-08-20
```

**Descripción:** turno nocturno de 8h (20:00-04:00), salida 20 minutos después del fin de turno, superando `toleranciaSalidaMinutos` (5). Regla 4: si el exceso supera la tolerancia, **se computan todos** los minutos de más.

**Resultado esperado:** 480 min ordinarios nocturnos (148.571 G$, igual que Nocturno #1) + 20 min de extra nocturna. Extra nocturna con recargo `recargoExtraNocturna` (+100%) → valor hora nocturna × 2 = 28.571,43 G$/hora × (20/60)h = 9.523,81 → 9.524 G$. **Total esperado: 158.095 G$.**

**Resultado obtenido:**
```
Ordinarias nocturnas  8h 00m   148.571 G$
Extras nocturnas      0h 20m     9.524 G$
TOTAL                 8h 20m   158.095 G$
```

**Comparación:** ✅ Coincide.

---

## 3 · Horario mixto (diurno + nocturno)

### Caso Mixto #1 — Turno que cruza diurno→nocturno, divisor por bloque (Regla 8)

```
npm run caso -- --turno 18:00-06:00 --entrada 18:00 --salida 06:00 --fecha 2026-08-20
```

**Descripción:** turno de 12h (18:00-06:00): 2h diurnas (18:00-20:00) + 10h nocturnas (20:00-06:00), marcación exacta, sin intervalo, día no feriado. Regla 8 es explícita: *"el divisor se decide por el bloque que se está pagando, no por el turno: en un turno mixto, los minutos diurnos se pagan con el divisor diurno y los nocturnos con el nocturno"*.

**Resultado esperado:**
- Bloque diurno 120 min: valor minuto = 100.000/8/60 = 208,33 → 120 × 208,33 = **25.000 G$**.
- Bloque nocturno 600 min: valor minuto = 100.000/7/60 = 238,10; con recargo nocturno (+30%) = 309,52 → 600 × 309,52 = **185.714 G$**.
- **Total esperado: 210.714 G$.**

**Resultado obtenido:**
```
Ordinarias diurnas    2h 00m    25.000 G$
Ordinarias nocturnas 10h 00m   162.500 G$
TOTAL                12h 00m   187.500 G$
· Jornal 100000 G$ · divisor 8 · valor minuto 208.33 G$.
```

**Comparación:** ❌ Difiere. El bloque diurno coincide (25.000 G$), pero el bloque nocturno se paga con divisor 8 (diurno) en lugar de divisor 7 (nocturno): 162.500 G$ obtenidos vs. 185.714 G$ esperados (-23.214 G$ para la persona trabajadora). Causa raíz en [`src/calcular-horas.ts`](../src/calcular-horas.ts): `valorMinuto` se calcula **una sola vez por jornada**, según si `inicioComputado` cae en ventana nocturna (`arrancaDeNoche`), y se aplica igual a todos los bloques — contradice literalmente la Regla 8. El log del propio motor lo confirma: `divisor 8` aplicado a toda la jornada, incluidos los 600 min nocturnos.

---

### Caso Mixto #2 — Turno mixto con tope de extras (Regla 8, Regla 10)

```
npm run caso -- --empresa seguridad --turno 14:00-23:00 --entrada 14:00 --salida 05:00 --fecha 2026-08-20
```

**Descripción:** Seguridad Sur (`maximoExtrasDiariasMinutos` = 240, `dividirTurnoPorMedianoche` = false). Turno de 9h (14:00-23:00: 6h diurnas + 3h nocturnas), marcación extendida hasta las 05:00 del día siguiente → 15h trabajadas, 6h de exceso. Regla 10: se pagan hasta 240 min de extra por día; el resto va a `excedente`.

**Resultado esperado (aplicando Regla 8 correctamente):**
- Ordinarias diurnas 360 min: 360 × 208,33 = **75.000 G$**.
- Ordinarias nocturnas 180 min (divisor nocturno + recargo nocturno): 180 × 309,52 = **55.714 G$**.
- Extra nocturna, topada a 240 min (divisor nocturno + recargo extra nocturna +100%): 240 × 476,19 = **114.286 G$**.
- Excedente: 120 min sin pagar (360 min de exceso − 240 min de tope).
- **Total esperado: 245.000 G$.**

**Resultado obtenido:**
```
Ordinarias diurnas   6h 00m    75.000 G$
Ordinarias nocturnas 3h 00m    48.750 G$
Extras nocturnas     4h 00m   100.000 G$
Excedente (no pagado) 2h 00m        —
TOTAL               13h 00m   223.750 G$
· 120 min trabajados quedaron sin pagar (tope de extras).
· Jornal 100000 G$ · divisor 8 · valor minuto 208.33 G$.
```

**Comparación:** ❌ Difiere. El reparto de minutos y el tope de extras (Regla 10) son correctos (180 min ordinarios + 240 min extra nocturna + 120 min excedente), pero, igual que en Mixto #1, todo el bloque nocturno se paga con divisor diurno (8) en lugar de nocturno (7): 223.750 G$ obtenidos vs. 245.000 G$ esperados (-21.250 G$). Misma causa raíz que Mixto #1 (Regla 8, `valorMinuto` único por jornada en [`src/calcular-horas.ts`](../src/calcular-horas.ts)).

---

## 4 · Feriados

### Caso Feriado #1 — Jornada íntegra en día feriado (Regla 7)

```
npm run caso -- --turno 08:00-17:00 --intervalo 12:00-13:00 --entrada 08:00 --salida 17:00 --fecha 2026-05-01
```

**Descripción:** mismo turno del Caso Diurno #1, pero en el 1° de mayo (Día del Trabajador, feriado). Regla 7: todo el tiempo trabajado en feriado se paga como feriado, sin separar ordinarias de extras.

**Resultado esperado:** 480 min de feriado diurno, con recargo de feriado (+100%): 208,33 × 2 = 416,67 G$/min × 480 = **200.000 G$**, igual al ejemplo numérico del README.

**Resultado obtenido:**
```
Feriado diurno   8h 00m   200.000 G$
Intervalo        1h 00m         —
TOTAL            8h 00m   200.000 G$
· 2026-05-01 es feriado (Día del Trabajador).
```

**Comparación:** ✅ Coincide.

---

### Caso Feriado #2 — Turno que cruza medianoche hacia un día feriado (Regla 7)

```
npm run caso -- --turno 22:00-06:00 --entrada 22:00 --salida 06:00 --fecha 2026-04-01
```

**Descripción:** turno nocturno 22:00-06:00 que empieza el 1° de abril de 2026 (no feriado) y termina el 2 de abril de 2026 (Jueves Santo, feriado). El Frigorífico tiene `dividirTurnoPorMedianoche = true`, por lo que, según Regla 7, **cada tramo se evalúa contra su propia fecha**.

**Resultado esperado:**
- Tramo 22:00-24:00 del 1° de abril (no feriado, 120 min): ordinarias nocturnas → 120 × 309,52 = **37.143 G$**.
- Tramo 00:00-06:00 del 2 de abril (feriado, 360 min): feriado nocturno, recargo feriado + recargo nocturno (+100% +30%): 208,33/7*8... valor minuto nocturno 238,10 × (1+1+0,3=2,3) = 547,62 → 360 × 547,62 = **197.143 G$**.
- **Total esperado: 234.286 G$.**

**Resultado obtenido:**
```
Ordinarias nocturnas   8h 00m   148.571 G$
TOTAL                  8h 00m   148.571 G$
```
(sin mención de feriado en el detalle, pese a que el turno cruza hacia un día feriado)

**Comparación:** ❌ Difiere. El motor no reconoce el feriado en absoluto: obtenidos 148.571 G$ vs. 234.286 G$ esperados (-85.715 G$, toda la porción de feriado nocturno). Causa raíz en [`src/calcular-horas.ts`](../src/calcular-horas.ts): `esFeriado` se calcula **una sola vez** con `calendario.esFeriado(jornada.fecha)` (la fecha de inicio del turno), y ese único booleano se usa para todos los bloques — aunque `partirEnBloques` ya calcula una `fecha` por bloque (necesaria para `dividirTurnoPorMedianoche`), nunca se usa para decidir el feriado por tramo. Esto contradice la tabla de Regla 7 para `dividirTurnoPorMedianoche = true`.

---

## Resumen de defectos expuestos

| Regla README | Caso(s) que lo expone | Causa raíz (archivo) |
|---|---|---|
| Regla 3 (tolerancia de entrada, todo o nada) | Diurno #2 | `atraso < cfg.toleranciaEntradaMinutos` debería ser `<=` en [`src/calcular-horas.ts`](../src/calcular-horas.ts) |
| Regla 8 (divisor por bloque, no por turno) | Mixto #1, Mixto #2 | `valorMinuto` calculado una única vez por `arrancaDeNoche`, en vez de por bloque, en [`src/calcular-horas.ts`](../src/calcular-horas.ts) |
| Regla 7 (feriado evaluado por fecha de cada tramo) | Feriado #2 | `esFeriado` calculado una única vez con `jornada.fecha`, ignorando la `fecha` por bloque, en [`src/calcular-horas.ts`](../src/calcular-horas.ts) |
