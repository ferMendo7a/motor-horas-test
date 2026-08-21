# Consigna > Tarea 1 'Encontrá lo que está mal'

## Descripción de la consigna
1 · Encontrá lo que está mal

La suite de tests pasa entera. Aun así, el motor **no cumple las reglas escritas en el README** en al menos tres situaciones.

Encontralas, explicá **por qué** pasan, y escribí para cada una un test que la exponga.

## Respuesta

Lo que está mal:

Se encontraron 3 casos con defectos inconsistentes con las reglas descritas en el planteamiento del caso práctico.

1. Cálculo del sistema difiere con Regla 3 · Tolerancia de entrada — todo o nada.
El cálculo realizado en calcular-horas.ts con respecto a la tolerancia de entrada indica que si el atraso es menor a la tolerancia de atraso se computa como 'atraso' y no como entrada normal (cómputo de turno normal).
```
if (atraso < cfg.toleranciaEntradaMinutos)
```

La condición debe considerar el caso en el que el atraso sea menor o igual a la tolerancia de atraso para considerar los casos en el que la marcación se haya realizado exactamente en el minuto límite de tolerancia para computarlo como entrada normal y no como atraso:
```
if (atraso <= cfg.toleranciaEntradaMinutos)
```

2. Regla 8 · Valor de la hora: Turnos mixtos (diurno/nocturno)

Cuando una jornada tiene parte diurna y parte nocturna, el valor por minuto se deberia calcular por bloque.
Hoy el motor calcula `valorMinuto` una sola vez para toda la jornada (segun si el turno arranca de dia o de noche) y despues reutiliza ese mismo valor en todos los tramos.

En palabras simples: en turnos mixtos, a varios minutos nocturnos se les termina aplicando tarifa diurna (o al reves), y los montos quedan mal.

3. Regla 7 · Feriado: en turnos que cruzan medianoche

Con `dividirTurnoPorMedianoche: true`, el feriado debe evaluarse por tramo: lo que cae en fecha feriada se paga como feriado, y lo que cae en fecha no feriada no.

Hoy el motor define `esFeriado` una sola vez con la fecha de la jornada y usa ese mismo valor para todos los bloques.
Resultado: si el turno empieza en feriado y termina al dia siguiente, puede pagar toda la noche como feriado, aunque una parte ya no corresponda.
