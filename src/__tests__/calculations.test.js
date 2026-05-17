import { describe, it, expect } from 'vitest'
import { calcularNota, calcularPuntajeAlumno, calcularEstadisticas } from '../../src/utils/calculations'

describe('calculations', () => {
  it('calcula puntaje total del alumno', () => {
    const alumno = { puntajes: { c1: 3, c2: '2' } }
    const criterios = [{ id: 'c1', puntajeMax: 5 }, { id: 'c2', puntajeMax: 5 }]
    expect(calcularPuntajeAlumno(alumno, criterios)).toBe(5)
  })

  it('calcula nota dentro de rango', () => {
    const scale = { nMin: 1, nMax: 7, nApr: 4, exigencia: 60 }
    const nota = calcularNota(30, scale, 50)
    expect(typeof nota).toBe('number')
    expect(nota).toBeGreaterThanOrEqual(scale.nMin)
    expect(nota).toBeLessThanOrEqual(scale.nMax)
  })

  it('calcula estadisticas básicas', () => {
    const alumnos = [
      { id: 'a1', nombre: 'A1', puntajes: { c1: 5 } },
      { id: 'a2', nombre: 'A2', puntajes: { c1: 2 } },
    ]
    const criterios = [{ id: 'c1', puntajeMax: 5 }]
    const scale = { nMin: 1, nMax: 7, nApr: 4, exigencia: 60 }
    const res = calcularEstadisticas(alumnos, criterios, scale)
    expect(res).toHaveProperty('stats')
    expect(res).toHaveProperty('promedio')
    expect(res.pMaxTotal).toBe(5)
  })
})
