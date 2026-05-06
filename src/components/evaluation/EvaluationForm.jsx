// src/components/evaluation/EvaluationForm.jsx
import { useRef, useState } from "react";
import ScaleConfig from "./ScaleConfig";
import CriteriaEditor from "./CriteriaEditor";
import StatsCards from "./StatsCards";
import EvaluationTable from "./EvaluationTable";
import { getFormulaText } from "../../utils/calculations";

/**
 * Componente principal del formulario de evaluación
 * Agrupa todos los subcomponentes de evaluación
 */
export default function EvaluationForm({
  evalData,
  saving,
  stats,
  onUpdateEvalData,
  onAddAlumno,
  onDeleteAlumno,
  onUpdatePuntaje,
  onAddCriterio,
  onUpdateCriterio,
  onDeleteCriterio,
}) {
  const { escala, criterios, alumnos } = evalData;
  const [nuevoAlumno, setNuevoAlumno] = useState("");
  const inputRef = useRef(null);

  const pMaxTotal = criterios.reduce((sum, c) => sum + Number(c.puntajeMax), 0);

  const handleAddAlumno = () => {
    const nombre = nuevoAlumno.trim();
    if (!nombre) return;

    onAddAlumno(nombre);
    setNuevoAlumno("");
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-300">
      
      {/* Configuración de escala */}
      <ScaleConfig
        scale={escala}
        onChange={(key, value) =>
          onUpdateEvalData((prev) => ({
            ...prev,
            escala: { ...prev.escala, [key]: parseFloat(value) || 0 },
          }))
        }
      />

      {/* Estadísticas */}
      <StatsCards
        pMaxTotal={pMaxTotal}
        totalAlumnos={alumnos.length}
        promedio={stats.promedio}
        aprobados={stats.aprobados}
        escala={escala}
      />

      {/* Tabla de evaluación */}
      <EvaluationTable
        alumnos={alumnos}
        criterios={criterios}
        scale={escala}
        pMaxTotal={pMaxTotal}
        onUpdatePuntaje={onUpdatePuntaje}
        onDeleteAlumno={onDeleteAlumno}
        onEditCriterio={onUpdateCriterio}
        onDeleteCriterio={onDeleteCriterio}
      />

      {/* Acciones inferiores */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Input para nuevo alumno */}
        <div className="flex-1 min-w-[200px] flex gap-2">
          <input
            ref={inputRef}
            value={nuevoAlumno}
            onChange={(e) => setNuevoAlumno(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddAlumno()}
            placeholder="Nombre del alumno..."
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder:text-gray-400"
          />
          <button
            onClick={handleAddAlumno}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 
              rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            + Agregar
          </button>
        </div>

        {/* Botón agregar criterio */}
        <button
          onClick={onAddCriterio}
          className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 
            rounded-lg border border-gray-200 transition-colors cursor-pointer"
        >
          + Agregar criterio
        </button>
      </div>

      {/* Fórmula aplicada */}
      <div className="bg-gray-50 rounded-xl px-5 py-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="font-semibold text-gray-500">Fórmula aplicada: </span>
          {getFormulaText(escala)}
        </p>
      </div>
    </div>
  );
}