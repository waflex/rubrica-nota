// src/components/evaluation/EvaluationTable.jsx
import { useState } from "react";

/**
 * Componente de tabla de evaluación con alumnos y puntajes
 */
export default function EvaluationTable({
  alumnos,
  criterios,
  scale,
  pMaxTotal,
  onUpdatePuntaje,
  onDeleteAlumno,
  onEditCriterio,
  onDeleteCriterio,
}) {
  const [editandoCriterio, setEditandoCriterio] = useState(null);

  // Calcular estadísticas por alumno
  const alumnosConNotas = alumnos.map((alumno) => {
    const puntajeTotal = criterios.reduce((sum, c) => {
      const valor = alumno.puntajes?.[c.id];
      return sum + (valor !== undefined && valor !== "" ? Number(valor) : 0);
    }, 0);

    const nota = calcularNotaLocal(puntajeTotal, scale, pMaxTotal);

    return { ...alumno, puntajeTotal, nota };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {/* Columna Alumno - Sticky */}
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider 
                min-w-[200px] sticky left-0 bg-gray-50/50 backdrop-blur-sm z-10">
                Alumno
              </th>

              {/* Columnas de Criterios */}
              {criterios.map((c) => (
                <th
                  key={c.id}
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]"
                >
                  {editandoCriterio === c.id ? (
                    <div className="flex flex-col gap-1.5">
                      <input
                        value={c.nombre}
                        onChange={(e) => onEditCriterio(c.id, "nombre", e.target.value)}
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs text-center text-gray-700 
                          focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={c.puntajeMax}
                          min={1}
                          onChange={(e) => onEditCriterio(c.id, "puntajeMax", e.target.value)}
                          className="w-16 border border-gray-200 rounded-md px-1 py-1 text-xs text-center text-gray-700 
                            focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <span className="text-xs text-gray-400">pts</span>
                        <button
                          onClick={() => setEditandoCriterio(null)}
                          className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md 
                            hover:bg-green-200 transition-colors cursor-pointer"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="cursor-pointer hover:text-blue-500 transition-colors normal-case font-medium text-gray-600"
                          onClick={() => setEditandoCriterio(c.id)}
                          title="Clic para editar"
                        >
                          {c.nombre}
                        </span>
                        <button
                          onClick={() => onDeleteCriterio(c.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors text-xs leading-none cursor-pointer"
                          title="Eliminar criterio"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-[11px] text-gray-300 font-normal normal-case mt-0.5">
                        máx {c.puntajeMax}
                      </div>
                    </div>
                  )}
                </th>
              ))}

              {/* Columna Total */}
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">
                Total
              </th>

              {/* Columna Nota */}
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">
                Nota
              </th>

              {/* Columna Acciones */}
              <th className="w-10"></th>
            </tr>
          </thead>

          <tbody>
            {alumnosConNotas.map((alumno, idx) => (
              <tr
                key={alumno.id}
                className={`border-b border-gray-50 transition-colors
                  ${idx % 2 === 1 ? "bg-gray-50/50" : ""} 
                  hover:bg-blue-50/30`}
              >
                {/* Nombre alumno - Sticky */}
                <td className={`px-5 py-2.5 font-medium text-gray-700 sticky left-0 z-[5]
                  ${idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs 
                      flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    {alumno.nombre}
                  </div>
                </td>

                {/* Inputs de puntajes */}
                {criterios.map((c) => (
                  <td key={c.id} className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={c.puntajeMax}
                      step="0.5"
                      value={alumno.puntajes?.[c.id] ?? ""}
                      placeholder="—"
                      onChange={(e) => onUpdatePuntaje(alumno.id, c.id, e.target.value)}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm text-gray-700 
                        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                        hover:border-gray-300 transition-colors"
                    />
                  </td>
                ))}

                {/* Puntaje total */}
                <td className="px-3 py-2 text-center text-sm text-gray-500 tabular-nums">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                    {alumno.puntajeTotal} / {pMaxTotal}
                  </span>
                </td>

                {/* Nota */}
                <td className="px-5 py-2 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg font-semibold text-base min-w-[3rem] tabular-nums
                      ${alumno.nota >= scale.nApr
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                      }`}
                  >
                    {alumno.nota.toFixed(1)}
                  </span>
                </td>

                {/* Botón eliminar */}
                <td className="pr-3 py-2 text-center">
                  <button
                    onClick={() => onDeleteAlumno(alumno.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 cursor-pointer"
                    title="Eliminar alumno"
                    aria-label={`Eliminar a ${alumno.nombre}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}

            {/* Estado vacío */}
            {alumnos.length === 0 && (
              <tr>
                <td
                  colSpan={criterios.length + 4}
                  className="py-12 text-center text-sm text-gray-400"
                >
                  <div className="space-y-2">
                    <span className="text-4xl">📝</span>
                    <p>No hay alumnos en esta evaluación</p>
                    <p className="text-xs">Agrega alumnos para comenzar a calcular notas</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Función helper local para calcular nota
function calcularNotaLocal(puntaje, scale, pMaxTotal) {
  const { nMin, nMax, nApr, exigencia } = scale;
  
  if (pMaxTotal === 0) return nMin;
  
  const e = exigencia / 100;
  const umbral = e * pMaxTotal;
  
  let nota;
  if (puntaje < umbral) {
    nota = umbral === 0 ? nMin : (nApr - nMin) * (puntaje / umbral) + nMin;
  } else {
    const denom = pMaxTotal * (1 - e);
    nota = denom === 0 ? nMax : (nMax - nApr) * ((puntaje - umbral) / denom) + nApr;
  }
  
  nota = Math.min(Math.max(nota, nMin), nMax);
  const truncado = Math.floor(nota * 100) / 100;
  const centesima = Math.round((truncado * 100) % 10);
  
  return centesima >= 5
    ? Math.ceil(truncado * 10) / 10
    : Math.floor(truncado * 10) / 10;
}