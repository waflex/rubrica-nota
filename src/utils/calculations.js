// src/utils/calculations.js

/**
 * Calcula la nota según la escala chilena
 * @param {number} puntaje - Puntaje obtenido por el alumno
 * @param {Object} scale - Configuración de escala { nMin, nMax, nApr, exigencia }
 * @param {number} pMaxTotal - Puntaje máximo total de la rúbrica
 * @returns {number} Nota calculada (aproximada al décimo)
 */
export function calcularNota(puntaje, scale, pMaxTotal) {
  const { nMin, nMax, nApr, exigencia } = scale;
  
  // Si no hay puntaje máximo, retornar nota mínima
  if (pMaxTotal === 0) return nMin;
  
  const e = exigencia / 100;
  const umbral = e * pMaxTotal;
  
  let nota;
  
  // Si el puntaje está bajo el umbral de exigencia
  if (puntaje < umbral) {
    nota = umbral === 0 
      ? nMin 
      : (nApr - nMin) * (puntaje / umbral) + nMin;
  } 
  // Si el puntaje está sobre o igual al umbral
  else {
    const denom = pMaxTotal * (1 - e);
    nota = denom === 0 
      ? nMax 
      : (nMax - nApr) * ((puntaje - umbral) / denom) + nApr;
  }
  
  // Limitar al rango [nMin, nMax]
  nota = Math.min(Math.max(nota, nMin), nMax);
  
  // Truncar a 2 decimales
  const truncado = Math.floor(nota * 100) / 100;
  
  // Aproximar al décimo según la centésima
  const centesima = Math.round((truncado * 100) % 10);
  
  return centesima >= 5
    ? Math.ceil(truncado * 10) / 10
    : Math.floor(truncado * 10) / 10;
}

/**
 * Calcula el puntaje total de un alumno
 * @param {Object} alumno - Datos del alumno con puntajes
 * @param {Array} criterios - Lista de criterios de evaluación
 * @returns {number} Puntaje total
 */
export function calcularPuntajeAlumno(alumno, criterios) {
  return criterios.reduce((sum, criterio) => {
    const valor = alumno.puntajes?.[criterio.id];
    return sum + (valor !== undefined && valor !== "" ? Number(valor) : 0);
  }, 0);
}

/**
 * Calcula estadísticas del curso
 * @param {Array} alumnos - Lista de alumnos
 * @param {Array} criterios - Criterios de evaluación
 * @param {Object} scale - Configuración de escala
 * @returns {Object} Estadísticas calculadas
 */
export function calcularEstadisticas(alumnos, criterios, scale) {
  const pMaxTotal = criterios.reduce((sum, c) => sum + Number(c.puntajeMax), 0);
  
  const stats = alumnos.map((alumno) => {
    const puntaje = calcularPuntajeAlumno(alumno, criterios);
    const nota = calcularNota(puntaje, scale, pMaxTotal);
    return { ...alumno, puntajeTotal: puntaje, nota };
  });

  const promedio = stats.length > 0
    ? (stats.reduce((sum, a) => sum + a.nota, 0) / stats.length)
    : 0;

  const aprobados = stats.filter((a) => a.nota >= scale.nApr).length;
  
  return {
    stats,
    promedio: promedio.toFixed(1),
    aprobados,
    total: alumnos.length,
    pMaxTotal,
  };
}

/**
 * Obtiene la fórmula de cálculo en texto legible
 * @param {Object} scale - Configuración de escala
 * @returns {string} Descripción de la fórmula
 */
export function getFormulaText(scale) {
  const { nMin, nMax, nApr, exigencia } = scale;
  return (
    `Si puntaje < ${exigencia}% del máximo → nota = (${nApr}−${nMin}) × p / (${exigencia/100} × pMax) + ${nMin}. ` +
    `Si puntaje ≥ umbral → nota = (${nMax}−${nApr}) × (p − umbral) / (pMax × (1−${exigencia/100})) + ${nApr}. ` +
    `Resultado truncado a 2 decimales y aproximado al décimo (≥5 sube).`
  );
}