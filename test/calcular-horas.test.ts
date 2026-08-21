import { describe, expect, it } from 'vitest'

import { calcularJornada } from '../src/calcular-horas.js'
import { ConfigEmpresa, FRIGORIFICO, MUEBLERIA_VINTAGE, SEGURIDAD_SUR } from '../src/config-empresa.js'
import { Jornada, MotorError } from '../src/tipos.js'

/**
 * Suite del motor de horas.
 *
 * Convención: 2026-10-05 es un lunes común (no feriado) y es el día que usamos
 * para casi todo. Los feriados salen de `src/feriados.ts`.
 *
 * Salario mensual de referencia: 3.000.000 G$ → jornal 100.000 → hora diurna
 * 12.500 G$ (jornal / 8) y hora nocturna 14.285,71 G$ (jornal / 7).
 */

const DIA_COMUN = '2026-10-05'
const DIA_SIGUIENTE_COMUN = '2026-10-06' // día siguiente a DIA_COMUN, tampoco feriado
const FERIADO = '2026-05-01' // Día del Trabajador
const DIA_PREVIO_A_FERIADO = '2026-04-01' // no feriado
const DIA_SIGUIENTE_ES_FERIADO = '2026-04-02' // Jueves Santo

const TURNO_ADMINISTRATIVO = {
  nombre: 'Administrativo 08-17',
  inicio: '08:00',
  fin: '17:00',
  intervalo: { inicio: '12:00', fin: '13:00' },
}

const TURNO_VIGILANCIA = {
  nombre: 'Vigilancia corta 20-23',
  inicio: '20:00',
  fin: '23:00',
}

const TURNO_TARDE = {
  nombre: 'Tarde 14-23',
  inicio: '14:00',
  fin: '23:00',
}

const TURNO_MIXTO_18_06 = {
  nombre: 'Mixto 18-06',
  inicio: '18:00',
  fin: '06:00',
}

const TURNO_NOCTURNO_22_06 = {
  nombre: 'Nocturno 22-06',
  inicio: '22:00',
  fin: '06:00',
}

const COLABORADOR_DEFAULT = {
  nombre: 'Ramona Benítez',
  formaPago: 'mensual' as const,
  salarioBase: 3_000_000,
}

function jornada(parcial: {
  fecha?: string
  turno?: Jornada['turno']
  entrada: string
  salida: string
  formaPago?: 'mensual' | 'jornalero'
  salarioBase?: number
}): Jornada {
  const fecha = parcial.fecha ?? DIA_COMUN
  return {
    fecha,
    colaborador: {
      nombre: 'Ramona Benítez',
      formaPago: parcial.formaPago ?? 'mensual',
      salarioBase: parcial.salarioBase ?? 3_000_000,
    },
    turno: parcial.turno ?? TURNO_ADMINISTRATIVO,
    marcacion: {
      entrada: `${fecha}T${parcial.entrada}`,
      salida: `${fecha}T${parcial.salida}`,
    },
  }
}

describe('turno diurno', () => {
  it('marcación exacta: paga la jornada ordinaria completa y descuenta el intervalo', () => {
    const r = calcularJornada(jornada({ entrada: '08:00', salida: '17:00' }))

    expect(r.minutos.ordinariasDiurnas).toBe(480)
    expect(r.minutos.ordinariasNocturnas).toBe(0)
    expect(r.minutos.extrasDiurnas).toBe(0)
    expect(r.minutos.intervalo).toBe(60)
    expect(r.total).toBe(100_000)
  })

  it('salida temprana: paga solo lo trabajado', () => {
    const r = calcularJornada(jornada({ entrada: '08:00', salida: '15:00' }))

    expect(r.minutos.ordinariasDiurnas).toBe(360)
    expect(r.minutos.extrasDiurnas).toBe(0)
  })

  it('entrada anticipada: no computa el tiempo previo al inicio del turno', () => {
    const r = calcularJornada(jornada({ entrada: '07:30', salida: '17:00' }))

    expect(r.minutos.ordinariasDiurnas).toBe(480)
    expect(r.minutos.descuento).toBe(0)
  })

  it('horas extras diurnas por encima de la jornada', () => {
    const r = calcularJornada(jornada({ entrada: '08:00', salida: '19:00' }))

    expect(r.minutos.ordinariasDiurnas).toBe(480)
    expect(r.minutos.extrasDiurnas).toBe(120)
    expect(r.total).toBe(137_500) // 100.000 ordinarias + 37.500 de extras al 50%
  })
})

describe('tolerancias', () => {
  it('atraso dentro de la tolerancia: no descuenta y computa desde el inicio del turno', () => {
    const r = calcularJornada(jornada({ entrada: '08:05', salida: '17:00' }))

    expect(r.minutos.descuento).toBe(0)
    expect(r.minutos.ordinariasDiurnas).toBe(480)
  })

  it('atraso fuera de la tolerancia: descuenta el atraso completo', () => {
    const r = calcularJornada(jornada({ entrada: '08:25', salida: '17:00' }))

    expect(r.minutos.descuento).toBe(25)
    expect(r.minutos.ordinariasDiurnas).toBe(455)
    expect(r.total).toBe(94_792)
  })

  it('exceso de salida dentro de la tolerancia: no genera extras', () => {
    const r = calcularJornada(jornada({ entrada: '08:00', salida: '17:04' }))

    expect(r.minutos.extrasDiurnas).toBe(0)
    expect(r.minutos.ordinariasDiurnas).toBe(480)
  })

  it('DEFECTO (Regla 3): atraso exactamente igual a la tolerancia debe considerarse dentro de tolerancia, no fuera', () => {
    // Regla 3 del README: "si el atraso es menor o igual a la tolerancia, no se
    // descuenta nada y la jornada se computa desde el inicio del turno".
    // toleranciaEntradaMinutos del Frigorífico es 10; un atraso de 10 min es el
    // caso límite "igual" y debe perdonarse por completo.
    const r = calcularJornada(jornada({ entrada: '08:10', salida: '17:00' }))

    expect(r.minutos.descuento).toBe(0)
    expect(r.minutos.ordinariasDiurnas).toBe(480)
    expect(r.minutos.extrasDiurnas).toBe(0)
    expect(r.total).toBe(100_000)
  })
})

describe('nocturnidad', () => {
  it('turno íntegramente nocturno: paga con el divisor nocturno y el recargo del 30%', () => {
    const r = calcularJornada(
      jornada({ turno: TURNO_VIGILANCIA, entrada: '20:00', salida: '23:00' }),
    )

    expect(r.minutos.ordinariasNocturnas).toBe(180)
    expect(r.minutos.ordinariasDiurnas).toBe(0)
    expect(r.total).toBe(55_714) // 3 h × 14.285,71 × 1,30
  })

  it('turno mixto: separa los minutos diurnos de los nocturnos en la frontera de las 20:00', () => {
    const r = calcularJornada(jornada({ turno: TURNO_TARDE, entrada: '14:00', salida: '23:00' }))

    expect(r.minutos.ordinariasDiurnas).toBe(360)
    expect(r.minutos.ordinariasNocturnas).toBe(180)
    expect(r.minutos.extrasDiurnas).toBe(0)
    expect(r.minutos.extrasNocturnas).toBe(0)
  })

  it('DEFECTO (Regla 8): en un turno mixto, el bloque nocturno debe usar el divisor y recargo nocturno, no el divisor con el que arranca el turno', () => {
    // Regla 8 del README, textual: "el divisor se decide por el bloque que se
    // está pagando, no por el turno: en un turno mixto, los minutos diurnos se
    // pagan con el divisor diurno y los nocturnos con el nocturno".
    // Turno 18:00→06:00: 2h diurnas (18-20) + 10h nocturnas (20-06).
    const r = calcularJornada({
      fecha: DIA_COMUN,
      colaborador: COLABORADOR_DEFAULT,
      turno: TURNO_MIXTO_18_06,
      marcacion: {
        entrada: `${DIA_COMUN}T18:00`,
        salida: `${DIA_SIGUIENTE_COMUN}T06:00`,
      },
    })

    expect(r.minutos.ordinariasDiurnas).toBe(120)
    expect(r.minutos.ordinariasNocturnas).toBe(600)
    expect(r.minutos.extrasDiurnas).toBe(0)
    expect(r.minutos.extrasNocturnas).toBe(0)

    // Bloque diurno: 120 min × (100.000 / 8 / 60) = 25.000 G$ (divisor 8, sin recargo).
    expect(r.valores.ordinariasDiurnas).toBe(25_000)
    // Bloque nocturno: 600 min × (100.000 / 7 / 60) × 1,30 (recargo nocturno) = 185.714 G$.
    // Con el divisor diurno (bug), da 162.500 G$ — la diferencia es el defecto a corregir.
    expect(r.valores.ordinariasNocturnas).toBe(185_714)
    expect(r.total).toBe(210_714)
  })
})

describe('feriados', () => {
  it('día feriado: todo el tiempo trabajado se paga como feriado, al doble', () => {
    const r = calcularJornada(jornada({ fecha: FERIADO, entrada: '08:00', salida: '17:00' }))

    expect(r.esFeriado).toBe(true)
    expect(r.minutos.feriadoDiurno).toBe(480)
    expect(r.minutos.ordinariasDiurnas).toBe(0)
    expect(r.total).toBe(200_000)
  })

  it('DEFECTO (Regla 7): turno que cruza medianoche hacia un día feriado debe pagar feriado nocturno en el tramo posterior', () => {
    // Regla 7 + tabla de dividirTurnoPorMedianoche=true (caso del Frigorífico):
    // cada tramo se evalúa contra su propia fecha. El turno empieza el
    // DIA_PREVIO_A_FERIADO (no feriado) y cruza a DIA_SIGUIENTE_ES_FERIADO
    // (Jueves Santo). Solo el tramo posterior a medianoche debe pagarse como
    // feriado nocturno; el tramo previo sigue como ordinaria nocturna.
    const r = calcularJornada({
      fecha: DIA_PREVIO_A_FERIADO,
      colaborador: COLABORADOR_DEFAULT,
      turno: TURNO_NOCTURNO_22_06,
      marcacion: {
        entrada: `${DIA_PREVIO_A_FERIADO}T22:00`,
        salida: `${DIA_SIGUIENTE_ES_FERIADO}T06:00`,
      },
    })

    // Tramo 22:00-24:00 del día previo (no feriado): 120 min ordinarios nocturnos.
    expect(r.minutos.ordinariasNocturnas).toBe(120)
    // Tramo 00:00-06:00 del día siguiente (feriado): 360 min de feriado nocturno.
    expect(r.minutos.feriadoNocturno).toBe(360)
    expect(r.minutos.ordinariasDiurnas).toBe(0)
    expect(r.minutos.feriadoDiurno).toBe(0)

    // 120 min × (100.000 / 7 / 60) × 1,30 (recargo nocturno) = 37.143 G$
    expect(r.valores.ordinariasNocturnas).toBe(37_143)
    // 360 min × (100.000 / 7 / 60) × (1 + 1 + 0,30) (recargo feriado + nocturno) = 197.143 G$
    expect(r.valores.feriadoNocturno).toBe(197_143)
    expect(r.total).toBe(234_286)
  })
})

describe('forma de pago', () => {
  it('jornalero: el salario base ya es el jornal, no se divide por los días del mes', () => {
    const r = calcularJornada(
      jornada({ entrada: '08:00', salida: '17:00', formaPago: 'jornalero', salarioBase: 100_000 }),
    )

    expect(r.minutos.ordinariasDiurnas).toBe(480)
    expect(r.total).toBe(100_000)
  })
})

describe('configuración por empresa', () => {
  it('tope diario de extras: lo que pasa el tope no se paga', () => {
    const r = calcularJornada(jornada({ entrada: '08:00', salida: '22:00' }))

    expect(r.minutos.ordinariasDiurnas).toBe(480)
    expect(r.minutos.extrasDiurnas).toBe(180) // tope de 180 min
    expect(r.minutos.excedente).toBe(120)
  })

  it('empresa que no paga extras: el excedente queda registrado y no se paga', () => {
    const sinExtras: ConfigEmpresa = { ...FRIGORIFICO, pagarExtras: false }
    const r = calcularJornada(jornada({ entrada: '08:00', salida: '19:00' }), sinExtras)

    expect(r.minutos.extrasDiurnas).toBe(0)
    expect(r.minutos.excedente).toBe(120)
    expect(r.total).toBe(100_000)
  })

  it('empresa que no descuenta el intervalo: el descanso se paga como trabajado', () => {
    const r = calcularJornada(jornada({ entrada: '08:00', salida: '17:00' }), SEGURIDAD_SUR)

    expect(r.minutos.intervalo).toBe(0)
    expect(r.minutos.ordinariasDiurnas).toBe(540)
    expect(r.total).toBe(112_500)
  })
})

describe('Resolución 118/2026 (nueva empresa adherida)', () => {
  const FECHA_PREVIA_VIGENCIA = '2026-09-30'
  const FECHA_VIGENCIA_EXACTA = '2026-10-01'
  const FECHA_POSTERIOR_VIGENCIA = '2026-10-02'

  it('empresa adherida, fecha previa a la vigencia: sigue usando el recargo anterior (30%)', () => {
    const r = calcularJornada(
      jornada({ turno: TURNO_VIGILANCIA, entrada: '20:00', salida: '23:00', fecha: FECHA_PREVIA_VIGENCIA }),
      MUEBLERIA_VINTAGE,
    )

    expect(r.minutos.ordinariasNocturnas).toBe(180)
    expect(r.valores.ordinariasNocturnas).toBe(55_714)
    expect(r.detalle.some((linea) => linea.includes('Resolución 118/2026'))).toBe(false)
  })

  it('empresa adherida, fecha posterior a la vigencia: aplica el nuevo recargo (40%)', () => {
    const r = calcularJornada(
      jornada({ turno: TURNO_VIGILANCIA, entrada: '20:00', salida: '23:00', fecha: FECHA_POSTERIOR_VIGENCIA }),
      MUEBLERIA_VINTAGE,
    )

    expect(r.minutos.ordinariasNocturnas).toBe(180)
    expect(r.valores.ordinariasNocturnas).toBe(60_000)
    expect(r.detalle.some((linea) => linea.includes('Resolución 118/2026'))).toBe(true)
  })

  it('empresa adherida, fecha exacta a inicio de vigencia: ya aplica el nuevo recargo (40%)', () => {
    const r = calcularJornada(
      jornada({ turno: TURNO_VIGILANCIA, entrada: '20:00', salida: '23:00', fecha: FECHA_VIGENCIA_EXACTA }),
      MUEBLERIA_VINTAGE,
    )

    expect(r.minutos.ordinariasNocturnas).toBe(180)
    expect(r.valores.ordinariasNocturnas).toBe(60_000)
    expect(r.detalle.some((linea) => linea.includes('Resolución 118/2026'))).toBe(true)
  })

  it('empresa no adherida, fecha previa a la vigencia: sigue con el recargo anterior (30%)', () => {
    const r = calcularJornada(
      jornada({ turno: TURNO_VIGILANCIA, entrada: '20:00', salida: '23:00', fecha: FECHA_PREVIA_VIGENCIA }),
      SEGURIDAD_SUR,
    )

    expect(r.valores.ordinariasNocturnas).toBe(55_714)
    expect(r.detalle.some((linea) => linea.includes('Resolución 118/2026'))).toBe(false)
  })

  it('empresa no adherida, fecha posterior a la vigencia: no aplica el nuevo recargo', () => {
    const r = calcularJornada(
      jornada({ turno: TURNO_VIGILANCIA, entrada: '20:00', salida: '23:00', fecha: FECHA_POSTERIOR_VIGENCIA }),
      SEGURIDAD_SUR,
    )

    expect(r.valores.ordinariasNocturnas).toBe(55_714)
    expect(r.detalle.some((linea) => linea.includes('Resolución 118/2026'))).toBe(false)
  })

  it('empresa no adherida, fecha exacta a inicio de vigencia: tampoco aplica el nuevo recargo', () => {
    const r = calcularJornada(
      jornada({ turno: TURNO_VIGILANCIA, entrada: '20:00', salida: '23:00', fecha: FECHA_VIGENCIA_EXACTA }),
      SEGURIDAD_SUR,
    )

    expect(r.valores.ordinariasNocturnas).toBe(55_714)
    expect(r.detalle.some((linea) => linea.includes('Resolución 118/2026'))).toBe(false)
  })

  it('turno diurno y empresa adherida vigente: el total no cambia', () => {
    const r = calcularJornada(
      jornada({ entrada: '08:00', salida: '17:00', fecha: FECHA_POSTERIOR_VIGENCIA }),
      MUEBLERIA_VINTAGE,
    )

    expect(r.minutos.ordinariasNocturnas).toBe(0)
    expect(r.total).toBe(100_000)
  })

  it('turno mixto nocturno→diurno y empresa adherida vigente: aplica el recargo nuevo solo al bloque nocturno', () => {
    const r = calcularJornada(
      {
        fecha: FECHA_POSTERIOR_VIGENCIA,
        colaborador: COLABORADOR_DEFAULT,
        turno: {
          nombre: 'Mixto 22-08',
          inicio: '22:00',
          fin: '08:00',
        },
        marcacion: {
          entrada: `${FECHA_POSTERIOR_VIGENCIA}T22:00`,
          salida: '2026-10-03T08:00',
        },
      },
      MUEBLERIA_VINTAGE,
    )

    expect(r.minutos.ordinariasNocturnas).toBe(480)
    expect(r.valores.ordinariasNocturnas).toBe(160_000)
    expect(r.detalle.some((linea) => linea.includes('Resolución 118/2026'))).toBe(true)
  })

  it('día feriado y empresa adherida vigente: no afecta las horas feriado nocturno', () => {
    const r = calcularJornada(
      jornada({
        turno: TURNO_VIGILANCIA,
        entrada: '20:00',
        salida: '23:00',
        fecha: '2026-12-25',
      }),
      MUEBLERIA_VINTAGE,
    )

    expect(r.esFeriado).toBe(true)
    expect(r.minutos.ordinariasNocturnas).toBe(0)
    expect(r.minutos.feriadoNocturno).toBe(180)
    expect(r.valores.feriadoNocturno).toBe(98_571)
  })
})

describe('entradas inválidas', () => {
  it('rechaza una marcación con salida anterior o igual a la entrada', () => {
    expect(() => calcularJornada(jornada({ entrada: '08:00', salida: '08:00' }))).toThrow(MotorError)
  })
})
