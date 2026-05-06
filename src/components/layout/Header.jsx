// src/components/layout/Header.jsx
import { useState } from "react";

/**
 * Header de la aplicación
 * @param {Object} user - Usuario actual
 * @param {boolean} saving - Indica si está guardando
 * @param {Function} onToggleSidebar - Función para mostrar/ocultar sidebar
 * @param {Function} onImportAlumnos - Abrir modal de importación de alumnos
 * @param {Function} onImportRubrica - Abrir modal de importación de rúbrica
 * @param {Function} onLogout - Cerrar sesión
 * @param {string} evalNombre - Nombre de la evaluación activa
 * @param {Function} onEvalNombreChange - Cambiar nombre de evaluación
 * @param {boolean} hasActiveEval - Si hay una evaluación activa
 * @param {Function} onCreateEval - Crear nueva evaluación
 */
export default function Header({
  user,
  saving,
  onToggleSidebar,
  onImportAlumnos,
  onImportRubrica,
  onLogout,
  evalNombre,
  onEvalNombreChange,
  hasActiveEval,
  onCreateEval,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);

  // Cerrar menús al hacer clic fuera
  const handleBlur = (setter) => {
    // Pequeño delay para permitir el clic en el menú
    setTimeout(() => setter(false), 200);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Botón menú sidebar */}
        <button
          onClick={onToggleSidebar}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 rounded-lg 
            hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Mostrar/ocultar menú lateral"
          title="Menú lateral"
        >
          ☰
        </button>

        {/* Título / Nombre de evaluación */}
        <div className="flex-1 min-w-0">
          {hasActiveEval ? (
            <input
              value={evalNombre}
              onChange={(e) => onEvalNombreChange(e.target.value)}
              className="font-semibold text-gray-800 text-base bg-transparent border-none outline-none 
                focus:bg-gray-50 rounded-lg px-3 py-1.5 w-full transition-colors
                placeholder:text-gray-400"
              placeholder="Nombre de la evaluación"
              aria-label="Nombre de la evaluación"
            />
          ) : (
            <h1 className="font-semibold text-gray-800 text-base truncate">
              Rúbricas de Notas
            </h1>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Indicador de guardado */}
          {hasActiveEval && (
            <div className="hidden sm:block">
              {saving ? (
                <span className="text-xs text-gray-400 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                  Guardando…
                </span>
              ) : (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Guardado
                </span>
              )}
            </div>
          )}

          {/* Botones de importación */}
          {hasActiveEval && (
            <div className="relative">
              <button
                onClick={() => setShowImportMenu(!showImportMenu)}
                onBlur={() => handleBlur(setShowImportMenu)}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium 
                  px-3 py-1.5 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                aria-haspopup="true"
                aria-expanded={showImportMenu}
              >
                📥 Importar
                <span className="text-gray-400">▼</span>
              </button>

              {showImportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg 
                  shadow-lg py-1 z-50 min-w-[180px]">
                  <button
                    onClick={() => {
                      onImportAlumnos();
                      setShowImportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 
                      transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span>📋</span>
                    Importar alumnos
                  </button>
                  <button
                    onClick={() => {
                      onImportRubrica();
                      setShowImportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 
                      transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span>📊</span>
                    Importar rúbrica
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Nueva evaluación (solo cuando no hay activa) */}
          {!hasActiveEval && (
            <button
              onClick={onCreateEval}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 
                rounded-lg transition-colors cursor-pointer hidden sm:block"
            >
              + Nueva
            </button>
          )}

          {/* Menú de usuario */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                onBlur={() => handleBlur(setShowUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1 transition-colors cursor-pointer"
                aria-label="Menú de usuario"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Usuario"}
                    className="w-7 h-7 rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg 
                  shadow-lg py-1 z-50 min-w-[200px]">
                  {/* Info del usuario */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.displayName || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                    {user.isAnonymous && (
                      <span className="inline-block mt-1 text-[10px] bg-yellow-100 text-yellow-700 
                        px-1.5 py-0.5 rounded-full">
                        Modo local
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  {user.isAnonymous ? (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 
                        transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span>🔒</span>
                      Iniciar sesión para guardar
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 
                        hover:text-red-600 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span>🚪</span>
                      Cerrar sesión
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}