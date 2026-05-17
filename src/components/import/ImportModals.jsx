// src/components/import/ImportModals.jsx
import { useState } from "react";
import toast from 'react-hot-toast'
import Modal from "../ui/Modal";
import DropZone from "./DropZone";
import FormatHint from "./FormatHint";
import { parseFile, extractAlumnos, extractCriterios } from "../../utils/parsers";
import { localId } from "../../utils/constants";

/**
 * Modal para importar alumnos
 */
export function ImportAlumnosModal({ onClose, onImport }) {
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file) => {
    setError("");
    setPreview(null);
    setLoading(true);

    try {
      const parsed = await parseFile(file);
      const items = extractAlumnos(parsed);
      
      if (!items.length) {
        throw new Error("No se encontraron alumnos válidos en el archivo.");
      }

      setPreview({ items, total: items.length });
    } catch (err) {
      setError(err.message || "Error al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = (mode = "add") => {
    if (!preview?.items) return;

    const newAlumnos = preview.items.map((nombre) => ({
      id: localId("a"),
      nombre,
      puntajes: {},
    }));

    onImport(newAlumnos, mode);
    toast.success('Alumnos importados');
    onClose();
  };

  return (
    <Modal title="Importar lista de alumnos" onClose={onClose}>
      <FormatHint 
        headers={["nombre", "apellido"]}
        rows={[
          ["Ana", "García"],
          ["Carlos", "López"],
          ["María", "Rodríguez"],
        ]}
      />

      <DropZone 
        onFile={handleFile}
        loading={loading}
        label="Arrastra tu lista de alumnos"
        sublabel="Formatos: Excel o CSV"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-green-700 mb-2">
              ✅ {preview.total} alumno(s) encontrado(s)
            </p>
            <div className="max-h-40 overflow-y-auto">
              <ul className="text-xs text-green-600 space-y-1">
                {preview.items.slice(0, 10).map((nombre, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-green-400">•</span>
                    {nombre}
                  </li>
                ))}
                {preview.total > 10 && (
                  <li className="text-green-400 italic">
                    ... y {preview.total - 10} más
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => confirmImport("add")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Agregar a la lista
            </button>
            <button
              onClick={() => confirmImport("replace")}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg border border-gray-200 transition-colors cursor-pointer"
            >
              Reemplazar lista
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Modal para importar rúbrica
 */
export function ImportRubricaModal({ onClose, onImport }) {
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file) => {
    setError("");
    setPreview(null);
    setLoading(true);

    try {
      const parsed = await parseFile(file);
      const items = extractCriterios(parsed);
      
      if (!items.length) {
        throw new Error("No se encontraron criterios válidos en el archivo.");
      }

      const totalPuntos = items.reduce((sum, r) => sum + r.puntajeMax, 0);
      setPreview({ items, total: items.length, totalPuntos });
    } catch (err) {
      setError(err.message || "Error al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = (mode = "add") => {
    if (!preview?.items) return;

    const newCriterios = preview.items.map((r) => ({
      id: localId("c"),
      nombre: r.nombre,
      puntajeMax: r.puntajeMax,
    }));

    onImport(newCriterios, mode);
    toast.success('Rúbrica importada');
    onClose();
  };

  return (
    <Modal title="Importar rúbrica de evaluación" onClose={onClose}>
      <FormatHint 
        headers={["criterio", "puntaje"]}
        rows={[
          ["Contenido", "40"],
          ["Presentación", "30"],
          ["Participación", "30"],
        ]}
      />

      <DropZone 
        onFile={handleFile}
        loading={loading}
        label="Arrastra tu archivo de rúbrica"
        sublabel="Formatos: Excel o CSV"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-green-700 mb-2">
              ✅ {preview.total} criterio(s) encontrado(s)
            </p>
            <div className="max-h-40 overflow-y-auto">
              <ul className="text-xs text-green-600 space-y-1">
                {preview.items.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-green-400">•</span>
                      {r.nombre}
                    </span>
                    <span className="font-medium tabular-nums bg-green-100 px-2 py-0.5 rounded">
                      {r.puntajeMax} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 pt-2 border-t border-green-200">
              <p className="text-xs text-green-600 font-medium">
                Puntaje total: {preview.totalPuntos} pts
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            ⚠️ Reemplazar la rúbrica limpiará los puntajes ingresados de los alumnos.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => confirmImport("add")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Agregar criterios
            </button>
            <button
              onClick={() => confirmImport("replace")}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg border border-gray-200 transition-colors cursor-pointer"
            >
              Reemplazar rúbrica
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
