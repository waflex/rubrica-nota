// src/components/auth/LoginScreen.jsx
import { useState } from "react";

export default function LoginScreen({ onLogin, onContinueWithoutLogin, loading }) {
  const [showContinueOption, setShowContinueOption] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 w-full max-w-md text-center space-y-6">
        {/* Logo / Icono */}
        <div className="text-5xl">📝</div>
        
        {/* Título y descripción */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Rúbricas de Notas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistema de evaluación con escala chilena
          </p>
        </div>

        {/* Beneficios */}
        <div className="bg-blue-50 rounded-xl p-4 text-left space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">
            ✨ ¿Qué puedes hacer?
          </h3>
          <ul className="text-xs text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">📊</span>
              <span>Crear rúbricas con criterios personalizables</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">🎯</span>
              <span>Calcular notas automáticamente con escala chilena</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">📋</span>
              <span>Importar listas de alumnos desde Excel/CSV</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">💾</span>
              <span>Guardar en la nube (con cuenta de Google)</span>
            </li>
          </ul>
        </div>

        {/* Botón principal de Google */}
        <button 
          onClick={onLogin} 
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Conectando…" : "Continuar con Google"}
        </button>

        {/* Separador */}
        {!showContinueOption ? (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span 
                onClick={() => setShowContinueOption(true)}
                className="px-3 bg-white text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
              >
                o continuar sin cuenta
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">Usar sin guardar en la nube</span>
              </div>
            </div>

            <button 
              onClick={onContinueWithoutLogin}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-3 rounded-xl transition-colors cursor-pointer"
            >
              Comenzar sin iniciar sesión
            </button>
            
            <p className="text-xs text-gray-400">
              Tus datos se guardarán solo en este navegador. 
              Para sincronizar entre dispositivos, usa tu cuenta de Google.
            </p>
            
            <button 
              onClick={() => setShowContinueOption(false)}
              className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
            >
              ← Volver a inicio de sesión
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-400">
          Al iniciar sesión aceptas que tus rúbricas se guarden de forma segura en la nube.
        </p>
      </div>
    </div>
  );
}