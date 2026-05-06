import {
  SparklesIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

import { useState } from "react";

export default function LoginScreen({
  onLogin,
  onContinueWithoutLogin,
  loading,
}) {
  const [showContinueOption, setShowContinueOption] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <DocumentTextIcon className="size-10" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-800">
            Rúbricas de Notas
          </h1>
          <p className="text-sm text-gray-500">
            Sistema de evaluación con escala chilena
          </p>
        </div>

        {/* Beneficios */}
        <div className="bg-blue-50 rounded-xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2 text-blue-800">
            <SparklesIcon className="size-4" />
            <h3 className="text-sm font-semibold">¿Qué puedes hacer?</h3>
          </div>

          <ul className="text-xs text-blue-700 space-y-2">
            {[
              {
                icon: ChartBarIcon,
                text: "Crear rúbricas con criterios personalizables",
              },
              {
                icon: AcademicCapIcon,
                text: "Calcular notas automáticamente con escala chilena",
              },
              {
                icon: ClipboardDocumentListIcon,
                text: "Importar listas de alumnos desde Excel/CSV",
              },
              {
                icon: CloudArrowUpIcon,
                text: "Guardar en la nube con tu cuenta",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 p-1 rounded-md bg-blue-100">
                    <Icon className="size-3.5 text-blue-700" />
                  </span>
                  <span>{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Botón Google */}
        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            {/* SVG intacto */}
          </svg>
          {loading ? "Conectando…" : "Continuar con Google"}
        </button>

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span
              onClick={() => setShowContinueOption(true)}
              className="px-3 bg-white text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              o continuar sin cuenta
            </span>
          </div>
        </div>

        {/* Opción sin login */}
        {showContinueOption && (
          <div className="space-y-3">
            <button
              onClick={onContinueWithoutLogin}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-3 rounded-xl transition-colors"
            >
              Comenzar sin iniciar sesión
            </button>

            <p className="text-xs text-gray-400">
              Tus datos se guardarán solo en este navegador.
            </p>

            <button
              onClick={() => setShowContinueOption(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Volver
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-400">
          Al iniciar sesión aceptas guardar tus datos en la nube.
        </p>
      </div>
    </div>
  );
}
