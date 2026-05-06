import { useEffect, useCallback } from "react";

/**
 * Componente Modal reutilizable
 * @param {string} title - Título del modal
 * @param {Function} onClose - Función para cerrar el modal
 * @param {React.ReactNode} children - Contenido del modal
 * @param {string} size - Tamaño del modal ('sm', 'md', 'lg')
 * @param {boolean} closeOnOverlay - Si se cierra al hacer clic fuera
 */
export default function Modal({ 
  title, 
  onClose, 
  children, 
  size = "md",
  closeOnOverlay = true 
}) {
  // Manejar tecla Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      onClose?.();
    }
  }, [onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Tamaños del modal
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200"
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 
              id="modal-title"
              className="text-base font-semibold text-gray-800"
            >
              {title}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}