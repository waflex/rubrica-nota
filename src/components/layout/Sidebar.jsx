// src/components/layout/Sidebar.jsx
import { useState } from "react";

/**
 * Sidebar de navegación con lista de evaluaciones
 * @param {boolean} isOpen - Si el sidebar está abierto
 * @param {Array} evaluaciones - Lista de evaluaciones
 * @param {string} evalActivaId - ID de la evaluación activa
 * @param {Function} onSelect - Seleccionar evaluación
 * @param {Function} onDelete - Eliminar evaluación
 * @param {Function} onCreate - Crear nueva evaluación
 * @param {Object} user - Usuario actual
 */
export default function Sidebar({
  isOpen,
  evaluaciones,
  evalActivaId,
  onSelect,
  onDelete,
  onCreate,
  user,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvalName, setNewEvalName] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const handleCreate = () => {
    onCreate(newEvalName);
    setNewEvalName("");
    setShowCreateModal(false);
  };

  const handleDelete = async (id, nombre) => {
    if (deletingId === id) return; // Evitar doble clic
    
    if (!confirm(`¿Eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`)) return;
    
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <aside
      className={`
        ${isOpen ? "w-64" : "w-0 overflow-hidden"}
        transition-all duration-300 ease-in-out
        bg-white border-r border-gray-200 flex flex-col flex-shrink-0
      `}
    >
      {/* Header del sidebar */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <span className="text-sm font-semibold text-gray-800">
              Mis Rúbricas
            </span>
          </div>
        </div>

        {/* Info del usuario */}
        {user && (
          <div className="flex items-center gap-2 mb-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 flex-shrink-0">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {user.displayName || "Usuario"}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {user.isAnonymous ? "Modo local" : user.email}
              </p>
            </div>
          </div>
        )}

        {/* Botón crear evaluación */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 
            rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span className="text-lg leading-none">+</span>
          Nueva evaluación
        </button>
      </div>

      {/* Lista de evaluaciones */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-1 mb-2">
            Evaluaciones
            {evaluaciones.length > 0 && (
              <span className="ml-1 text-gray-300">({evaluaciones.length})</span>
            )}
          </p>

          <div className="space-y-0.5">
            {evaluaciones.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400 mb-2">Sin evaluaciones</p>
                <p className="text-[10px] text-gray-400">
                  Crea una para comenzar
                </p>
              </div>
            ) : (
              evaluaciones.map((eva) => (
                <div
                  key={eva.id}
                  onClick={() => onSelect(eva.id)}
                  className={`
                    group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer 
                    transition-all duration-150
                    ${evalActivaId === eva.id
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "hover:bg-gray-50 text-gray-700"
                    }
                    ${deletingId === eva.id ? "opacity-50 pointer-events-none" : ""}
                  `}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(eva.id);
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate font-medium">
                      {eva.nombre || "Sin nombre"}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      {(eva.alumnos?.length || 0)} alumnos ·{" "}
                      {(eva.criterios?.length || 0)} criterios
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(eva.id, eva.nombre);
                    }}
                    disabled={deletingId === eva.id}
                    className={`
                      opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 
                      text-xs ml-2 transition-all p-1 rounded hover:bg-red-50
                      ${evalActivaId === eva.id ? "opacity-100" : ""}
                      ${deletingId === eva.id ? "animate-pulse" : ""}
                    `}
                    aria-label={`Eliminar ${eva.nombre}`}
                    title="Eliminar evaluación"
                  >
                    {deletingId === eva.id ? "⏳" : "✕"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer del sidebar */}
      <div className="p-3 border-t border-gray-100">
        <div className="text-[10px] text-gray-400 text-center">
          {user?.isAnonymous ? (
            <p>💾 Datos guardados localmente</p>
          ) : (
            <p>☁️ Datos sincronizados en la nube</p>
          )}
        </div>
      </div>

      {/* Modal para crear evaluación (inline en sidebar) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                Nueva evaluación
              </h3>
            </div>
            
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-medium">
                  Nombre de la evaluación
                </label>
                <input
                  autoFocus
                  value={newEvalName}
                  onChange={(e) => setNewEvalName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") setShowCreateModal(false);
                  }}
                  placeholder="Ej: Prueba 1, Proyecto Final…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 
                  rounded-lg border border-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 
                  rounded-lg transition-colors cursor-pointer"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}