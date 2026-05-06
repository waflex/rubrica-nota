// src/components/import/FormatHint.jsx
import { useState } from "react";

/**
 * Componente que muestra el formato esperado para la importación
 * @param {Array} headers - Nombres de las columnas
 * @param {Array} rows - Filas de ejemplo
 * @param {string} title - Título descriptivo
 * @param {string} type - Tipo de archivo ('excel' o 'csv')
 */
export default function FormatHint({ 
  headers = [], 
  rows = [], 
  title = "Formato esperado",
  type = "excel" 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Si no hay datos, no mostrar nada
  if (!headers.length || !rows.length) return null;

  const icon = type === "csv" ? "📄" : "📊";
  const fileType = type === "csv" ? "CSV" : "Excel (.xlsx)";

  return (
    <div className="bg-blue-50 rounded-lg overflow-hidden">
      {/* Header clickeable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-100 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div className="text-left">
            <p className="text-xs font-semibold text-blue-800">
              {title} ({fileType})
            </p>
            <p className="text-[11px] text-blue-600">
              {headers.length} columnas · {rows.length} filas de ejemplo
            </p>
          </div>
        </div>
        <span className="text-blue-400 transition-transform duration-200"
          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="border-t border-blue-200 animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-3">
            {/* Consejos */}
            <div className="text-[11px] text-blue-700 bg-blue-100/50 rounded-lg p-3">
              <p className="font-semibold mb-1">💡 Consejos:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Los nombres de columnas pueden variar (ej: "nombre", "name", "alumno")</li>
                <li>Se detectan automáticamente las columnas requeridas</li>
                <li>Las filas vacías se ignoran automáticamente</li>
                {type === "csv" && (
                  <li>Para CSV, puedes usar coma (,) o punto y coma (;) como separador</li>
                )}
              </ul>
            </div>

            {/* Tabla de ejemplo */}
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-blue-100">
                      {headers.map((header, i) => (
                        <th 
                          key={i} 
                          className="px-3 py-2 text-left font-semibold text-blue-800 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr 
                        key={i} 
                        className={`
                          ${i % 2 === 0 ? "bg-white" : "bg-blue-50/50"}
                          hover:bg-blue-100/50 transition-colors
                        `}
                      >
                        {row.map((cell, j) => (
                          <td 
                            key={j} 
                            className="px-3 py-1.5 text-blue-700 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nota adicional */}
            <p className="text-[10px] text-blue-400 leading-relaxed">
              * Los valores mostrados son solo ejemplos. Tus datos pueden variar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}