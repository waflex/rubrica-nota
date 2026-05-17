// src/App.jsx
import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./hooks/useAuth";
import { useEvaluations } from "./hooks/useEvaluations";
import { useLocalStorage } from "./hooks/useLocalStorage";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import EvaluationForm from "./components/evaluation/EvaluationForm";
import {
  ImportAlumnosModal,
  ImportRubricaModal,
} from "./components/import/ImportModals";
import { localId } from "./utils/constants";
import { calcularEstadisticas } from "./utils/calculations";
import {
  PencilSquareIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalculatorIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

import "./App.css";



export default function App() {
  const { user, loginLoading, handleLogin, handleLogout } = useAuth();

  const {
    evaluaciones,
    evalActivaId,
    evalData,
    saving,
    seleccionarEval,
    updateEvalData,
    crearEvaluacion,
    eliminarEvaluacion,
    clonarEvaluacion,
  } = useEvaluations(user);

  const [sidebarOpen, setSidebarOpen] = useLocalStorage(
    "rubrica_sidebar_open",
    true,
  );
  const [modalImportAlumnos, setModalImportAlumnos] = useState(false);
  const [modalImportRubrica, setModalImportRubrica] = useState(false);

  const { escala, criterios, alumnos } = evalData;
  const stats = calcularEstadisticas(alumnos, criterios, escala);

  const handleCreateEval = useCallback(
    async (nombre) => {
      const id = await crearEvaluacion(nombre);
      if (id) seleccionarEval(id);
    },
    [crearEvaluacion, seleccionarEval],
  );

  const handleDeleteEval = useCallback(
    async (id) => {
      try {
        await eliminarEvaluacion(id);
        toast.success("Evaluación eliminada");
      } catch (err) {
        console.error(err);
        toast.error("Error al eliminar evaluación");
      }
    },
    [eliminarEvaluacion],
  );

  const handleAddAlumno = useCallback(
    (nombre) => {
      updateEvalData((prev) => ({
        ...prev,
        alumnos: [...prev.alumnos, { id: localId("a"), nombre, puntajes: {} }],
      }));
    },
    [updateEvalData],
  );

  const handleDeleteAlumno = useCallback(
    (alumnoId) => {
      updateEvalData((prev) => ({
        ...prev,
        alumnos: prev.alumnos.filter((a) => a.id !== alumnoId),
      }));
    },
    [updateEvalData],
  );

  const handleUpdatePuntaje = useCallback(
    (alumnoId, criterioId, valor) => {
      updateEvalData((prev) => ({
        ...prev,
        alumnos: prev.alumnos.map((a) =>
          a.id === alumnoId
            ? { ...a, puntajes: { ...a.puntajes, [criterioId]: valor } }
            : a,
        ),
      }));
    },
    [updateEvalData],
  );

  const handleAddCriterio = useCallback(() => {
    updateEvalData((prev) => ({
      ...prev,
      criterios: [
        ...prev.criterios,
        {
          id: localId("c"),
          nombre: `Criterio ${prev.criterios.length + 1}`,
          puntajeMax: 10,
        },
      ],
    }));
  }, [updateEvalData]);

  const handleUpdateCriterio = useCallback(
    (criterioId, campo, valor) => {
      updateEvalData((prev) => ({
        ...prev,
        criterios: prev.criterios.map((c) =>
          c.id === criterioId
            ? { ...c, [campo]: campo === "puntajeMax" ? Number(valor) : valor }
            : c,
        ),
      }));
    },
    [updateEvalData],
  );

  const handleDeleteCriterio = useCallback(
    (criterioId) => {
      updateEvalData((prev) => ({
        ...prev,
        criterios: prev.criterios.filter((c) => c.id !== criterioId),
        alumnos: prev.alumnos.map((a) => {
          const { [criterioId]: _, ...rest } = a.puntajes ?? {};
          return { ...a, puntajes: rest };
        }),
      }));
    },
    [updateEvalData],
  );

  const handleImportAlumnos = useCallback(
    (newAlumnos, mode) => {
      updateEvalData((prev) => ({
        ...prev,
        alumnos:
          mode === "replace" ? newAlumnos : [...prev.alumnos, ...newAlumnos],
      }));
    },
    [updateEvalData],
  );

  const handleImportRubrica = useCallback(
    (newCriterios, mode) => {
      updateEvalData((prev) => ({
        ...prev,
        criterios:
          mode === "replace"
            ? newCriterios
            : [...prev.criterios, ...newCriterios],
        alumnos:
          mode === "replace"
            ? prev.alumnos.map((a) => ({ ...a, puntajes: {} }))
            : prev.alumnos,
      }));
    },
    [updateEvalData],
  );

  const handleEvalNombreChange = useCallback(
    (nombre) => {
      updateEvalData((prev) => ({ ...prev, nombre }));
    },
    [updateEvalData],
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fila principal: sidebar + contenido */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          evaluaciones={evaluaciones}
          evalActivaId={evalActivaId}
          onSelect={seleccionarEval}
          onDelete={handleDeleteEval}
          onCreate={handleCreateEval}
          onClone={async (id) => {
            try {
              const newId = await clonarEvaluacion(id);
              if (newId) {
                seleccionarEval(newId);
                toast.success("Evaluación duplicada");
                return newId;
              }
              toast.error("No se pudo duplicar");
              return null;
            } catch (err) {
              console.error(err);
              toast.error("Error al duplicar");
              return null;
            }
          }}
          user={user}
        />

        {/* Contenido principal */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <Header
            user={user}
            saving={saving}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onImportAlumnos={() => setModalImportAlumnos(true)}
            onImportRubrica={() => setModalImportRubrica(true)}
            onExportExcel={() =>
              import("./utils/exportExcel").then((m) =>
                m
                  .exportEvaluationToExcel(evalData, stats.stats)
                  .then(() => toast.success("Exportado a Excel"))
                  .catch((err) => {
                    console.error(err);
                    toast.error("Error exportando a Excel");
                  }),
              )
            }
            onLogin={handleLogin}
            onLogout={handleLogout}
            loginLoading={loginLoading}
            evalNombre={evalData.nombre}
            onEvalNombreChange={handleEvalNombreChange}
            hasActiveEval={!!evalActivaId}
            onCreateEval={() => handleCreateEval()}
            onExportPdf={() =>
              import("./utils/exportPdf")
                .then((m) => m.exportEvaluationToPdf(evalData, stats.stats))
                .then(() => toast.success("Exportado a PDF"))
                .catch((err) => {
                  console.error(err);
                  toast.error("Error exportando a PDF");
                })
            }
          />

          {/* Área de contenido */}
          <main className="flex-1 p-6 overflow-auto">
            {!evalActivaId ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 min-h-[60vh]">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                    <ClipboardDocumentListIcon className="size-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-800 font-semibold text-lg">
                      Selecciona o crea una evaluación
                    </p>
                    <p className="text-sm text-gray-500 max-w-md">
                      Cada evaluación tiene su propia rúbrica, lista de alumnos
                      y configuración de escala personalizada.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCreateEval()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5
                    rounded-xl transition-colors cursor-pointer shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <DocumentPlusIcon className="size-5 mx-1" />
                  Crear mi primera evaluación
                </button>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  {[
                    {
                      icon: <AcademicCapIcon className="size-5" />,
                      text: "Define criterios con puntajes máximos",
                    },
                    {
                      icon: <UserGroupIcon className="size-5" />,
                      text: "Agrega alumnos manualmente o por archivo",
                    },
                    {
                      icon: <CalculatorIcon className="size-5" />,
                      text: "Calcula notas con escala chilena",
                    },
                    {
                      icon: <PencilSquareIcon className="size-5" />,
                      text: "Guarda en la nube o localmente",
                    },
                  ].map((tip, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-2"
                    >
                      <span className="text-lg">{tip.icon}</span>
                      <p className="text-xs text-gray-600 text-left">
                        {tip.text}
                      </p>
                    </div>
                  ))}
                </div>
               
              </div>
            ) : (
              <EvaluationForm
                evalData={evalData}
                saving={saving}
                stats={stats}
                onUpdateEvalData={updateEvalData}
                onAddAlumno={handleAddAlumno}
                onDeleteAlumno={handleDeleteAlumno}
                onUpdatePuntaje={handleUpdatePuntaje}
                onAddCriterio={handleAddCriterio}
                onUpdateCriterio={handleUpdateCriterio}
                onDeleteCriterio={handleDeleteCriterio}
                onEditAlumno={(alumnoId, nombre) =>
                  updateEvalData((prev) => ({
                    ...prev,
                    alumnos: prev.alumnos.map((a) =>
                      a.id === alumnoId ? { ...a, nombre } : a,
                    ),
                  }))
                }
              />
            )}
          </main>
          {/* Footer */}
          <footer className="w-full text-center text-xs text-gray-400 py-2 bg-gray-50 shrink-0">
            {"hecho con ♥ por "}
            <a
              href="https://jrtdev.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 hover:underline transition-colors"
            >
              JRTDEV
            </a>
          </footer>
        </div>
        {/* fin contenido principal */}
      </div>
      {/* fin fila principal */}

      {/* Modales */}
      {modalImportAlumnos && (
        <ImportAlumnosModal
          onClose={() => setModalImportAlumnos(false)}
          onImport={handleImportAlumnos}
        />
      )}
      {modalImportRubrica && (
        <ImportRubricaModal
          onClose={() => setModalImportRubrica(false)}
          onImport={handleImportRubrica}
        />
      )}
    </div>
  );
}
