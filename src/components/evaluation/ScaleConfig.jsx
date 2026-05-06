// src/components/evaluation/ScaleConfig.jsx
import { SCALE_FIELDS } from "../../utils/constants";

/**
 * Componente para configurar la escala de evaluación
 * @param {Object} scale - Configuración actual de la escala
 * @param {Function} onChange - Callback cuando cambia un campo
 */
export default function ScaleConfig({ scale, onChange }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Configuración de escala
        </p>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          Chilena
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SCALE_FIELDS.map(({ label, key, step, min, max }) => (
          <div key={key}>
            <label 
              htmlFor={`scale-${key}`}
              className="block text-xs text-gray-500 mb-1.5 font-medium"
            >
              {label}
            </label>
            <div className="relative">
              <input
                id={`scale-${key}`}
                type="number"
                step={step}
                min={min}
                max={max}
                value={scale[key]}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all hover:border-gray-300"
              />
              {key === "exigencia" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  %
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Vista previa de la escala */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">Rango:</span>
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">
            {scale.nMin}
          </span>
          <span>→</span>
          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
            {scale.nApr}
          </span>
          <span>→</span>
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
            {scale.nMax}
          </span>
          <span className="ml-2">|</span>
          <span className="ml-2">Exigencia:</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
            {scale.exigencia}%
          </span>
        </div>
      </div>
    </div>
  );
}