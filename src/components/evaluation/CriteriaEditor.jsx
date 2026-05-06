// src/components/evaluation/CriteriaEditor.jsx
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

/**
 * Componente para editar criterios de evaluación
 * @param {Array} criterios - Lista de criterios
 * @param {Function} onAdd - Callback para agregar criterio
 * @param {Function} onUpdate - Callback para actualizar criterio
 * @param {Function} onDelete - Callback para eliminar criterio
 * @param {number} pMaxTotal - Puntaje máximo total
 */
export default function CriteriaEditor({
  criterios,
  onAdd,
  onUpdate,
  onDelete,
  pMaxTotal,
}) {
  const [editandoId, setEditandoId] = useState(null);

  const handleStartEdit = (id) => {
    setEditandoId(id);
  };

  const handleStopEdit = () => {
    setEditandoId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Criterios de evaluación
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {criterios.length} criterio(s) · Total: {pMaxTotal} pts
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 
            bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <span className="text-lg leading-none">+</span>
          Agregar
        </button>
      </div>

      {/* Lista de criterios */}
      <div className="space-y-2">
        {criterios.map((criterio) => (
          <div
            key={criterio.id}
            className={`rounded-lg border transition-all ${
              editandoId === criterio.id
                ? "border-blue-300 bg-blue-50/50 p-3"
                : "border-gray-100 hover:border-gray-200 p-2"
            }`}
          >
            {editandoId === criterio.id ? (
              /* Modo edición */
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    value={criterio.nombre}
                    onChange={(e) =>
                      onUpdate(criterio.id, "nombre", e.target.value)
                    }
                    placeholder="Nombre del criterio"
                    className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    autoFocus
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      value={criterio.puntajeMax}
                      onChange={(e) =>
                        onUpdate(criterio.id, "puntajeMax", e.target.value)
                      }
                      min={1}
                      className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center text-gray-700 
                        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    <span className="text-xs text-gray-400">pts</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleStopEdit}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-md 
                      hover:bg-green-200 transition-colors cursor-pointer"
                  >
                    ✓ Guardar
                  </button>
                  <button
                    onClick={() => {
                      onDelete(criterio.id);
                      handleStopEdit();
                    }}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-md 
                      hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              /* Modo vista */
              <div className="flex items-center justify-between group">
                {/* Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleStartEdit(criterio.id)}
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 
        transition-colors text-left truncate"
                    title="Editar criterio"
                  >
                    {criterio.nombre}
                  </button>

                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {criterio.puntajeMax} pts
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(criterio.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Editar"
                  >
                    <PencilSquareIcon className="size-4" />
                  </button>

                  <button
                    onClick={() => onDelete(criterio.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {criterios.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            <p>No hay criterios definidos</p>
            <button
              onClick={onAdd}
              className="text-blue-500 hover:text-blue-600 mt-1 cursor-pointer"
            >
              + Agregar primer criterio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
