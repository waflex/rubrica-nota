// src/components/import/FormatHint.jsx
import { DocumentTextIcon, LightBulbIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

/**
 * Componente que muestra el formato esperado para la importación
 */
export default function FormatHint({
  headers = [],
  rows = [],
  title = "Formato esperado",
  type = "excel",
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Validar que sean arrays
  const validHeaders = Array.isArray(headers) ? headers : [];
  const validRows = Array.isArray(rows) ? rows : [];

  // Si no hay datos, no mostrar nada
  if (!validHeaders.length || !validRows.length) return null;

  // ✅ Seleccionar el COMPONENTE correcto (no guardarlo en variable)
  const IconComponent = type === "csv" ? DocumentTextIcon : TableCellsIcon;
  const fileType = type === "csv" ? "CSV" : "Excel (.xlsx)";

  return (
    <div className="bg-blue-50 rounded-lg overflow-hidden">
      {/* Header clickeable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-100 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
        type="button"
      >
        <div className="flex items-center gap-2">
          {/* ✅ Renderizar el componente como JSX, no como string */}
          <IconComponent className="size-5 text-blue-600 shrink-0" />
          <div className="text-left">
            <p className="text-xs font-semibold text-blue-800">
              {title} ({fileType})
            </p>
            <p className="text-[11px] text-blue-600">
              {validHeaders.length} columna(s) · {validRows.length} fila(s) de ejemplo
            </p>
          </div>
        </div>
        <span
          className="text-blue-400 transition-transform duration-200 text-xs"
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
            <div className="text-[11px] text-blue-700 bg-blue-100/50 rounded-lg p-3 space-y-2">
              {/* Header */}
              <div className="flex items-center gap-1.5 font-semibold">
                <LightBulbIcon className="size-3.5 shrink-0" />
                <p>Consejos</p>
              </div>

              {/* Lista */}
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 bg-blue-500 rounded-full shrink-0"></span>
                  <span>
                    Los nombres de columnas pueden variar (ej: "nombre", "name", "alumno")
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 bg-blue-500 rounded-full shrink-0"></span>
                  <span>
                    Se detectan automáticamente las columnas requeridas
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 bg-blue-500 rounded-full shrink-0"></span>
                  <span>Las filas vacías se ignoran automáticamente</span>
                </li>
                {type === "csv" && (
                  <li className="flex items-start gap-1.5">
                    <span className="mt-1 w-1 h-1 bg-blue-500 rounded-full shrink-0"></span>
                    <span>
                      Puedes usar coma (,) o punto y coma (;) como separador
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Tabla de ejemplo */}
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-blue-100">
                      {validHeaders.map((header, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left font-semibold text-blue-800 whitespace-nowrap"
                        >
                          {typeof header === "string" ? header : String(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.map((row, i) => {
                      // Asegurar que row sea un array
                      const safeRow = Array.isArray(row) ? row : [];
                      
                      return (
                        <tr
                          key={i}
                          className={`
                            ${i % 2 === 0 ? "bg-white" : "bg-blue-50/50"}
                            hover:bg-blue-100/50 transition-colors
                          `}
                        >
                          {safeRow.map((cell, j) => (
                            <td
                              key={j}
                              className="px-3 py-1.5 text-blue-700 whitespace-nowrap"
                            >
                              {typeof cell === "string" ? cell : String(cell ?? "")}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
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
