// src/components/import/DropZone.jsx
import { ArrowDownTrayIcon, FolderIcon } from "@heroicons/react/24/outline";
import { useState, useRef } from "react";

/**
 * Componente DropZone para arrastrar y soltar archivos
 * @param {string} accept - Tipos de archivo aceptados (ej: ".xlsx,.csv")
 * @param {Function} onFile - Callback cuando se selecciona un archivo
 * @param {string} label - Texto descriptivo
 * @param {boolean} disabled - Si está deshabilitado
 * @param {boolean} loading - Si está cargando
 */
export default function DropZone({
  accept = ".xlsx,.xls,.csv",
  onFile,
  label = "Arrastra tu archivo aquí",
  sublabel = "o haz clic para seleccionar",
  disabled = false,
  loading = false,
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragging(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (disabled || loading) return;

    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);

    // Reset input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`
        border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none
        ${loading ? "opacity-50 cursor-wait" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}
        ${
          dragging
            ? "border-blue-400 bg-blue-50 scale-[1.02]"
            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
        }
      `}
      aria-label="Zona para subir archivos"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled || loading}
        aria-hidden="true"
      />

      {/* Icono animado */}

      <div className="text-3xl mb-2 transition-transform duration-200 flex justify-center">
        {loading ? (
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        ) : dragging ? (
          <ArrowDownTrayIcon className="size-8 text-blue-600 scale-110" />
        ) : (
          <FolderIcon className="size-8 text-gray-400" />
        )}
      </div>
      {/* Texto principal */}
      <p className="text-sm font-medium text-gray-700">
        {loading ? "Procesando archivo..." : label}
      </p>

      {/* Subtexto */}
      {!loading && sublabel && (
        <p className="text-xs text-gray-400 mt-1">
          {sublabel} · {accept.split(",").join(", ")}
        </p>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div className="mt-3 flex justify-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
