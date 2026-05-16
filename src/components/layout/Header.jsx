// src/components/layout/Header.jsx
import { useState } from "react";
import {
  ArrowRightOnRectangleIcon,
  UserIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

export default function Header({
  user,
  saving,
  onToggleSidebar,
  onImportAlumnos,
  onImportRubrica,
  onLogin,
  onLogout,
  loginLoading,
  evalNombre,
  onEvalNombreChange,
  hasActiveEval,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);

  const handleBlur = (setter) => {
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
                  {user?.isAnonymous ? "Local" : "Guardado"}
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
                <div
                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg 
                  shadow-lg py-1 z-50 min-w-[180px]"
                >
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

          {/* ✅ Botón de Login / Usuario */}
          {user?.isAnonymous ? (
            <button
              onClick={onLogin}
              disabled={loginLoading}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-1.5
      rounded-lg transition-colors cursor-pointer hidden sm:flex"
            >
              {loginLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <LockClosedIcon className="size-3.5" />
              )}
              <span className="hidden sm:inline">Iniciar sesión</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                onBlur={() => handleBlur(setShowUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1 transition-colors cursor-pointer"
                aria-label="Menú de usuario"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Usuario"}
                    className="w-7 h-7 rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <UserIcon className="size-4" />
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg 
                  shadow-lg py-1 z-50 min-w-[200px]"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.displayName || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <CloudArrowUpIcon className="size-3" />
                      {user.email || "Sincronizado en la nube"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 
                      hover:text-red-600 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="size-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
