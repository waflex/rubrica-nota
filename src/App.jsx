import { useState, useRef } from "react";

const DEFAULT_SCALE = {
  nMin: 1.0,
  nMax: 7.0,
  nApr: 4.0,
  exigencia: 60,
};

function calcularNota(puntaje, scale, pMaxTotal) {
  const { nMin, nMax, nApr, exigencia } = scale;
  const e = exigencia / 100;
  const umbral = e * pMaxTotal;
  let nota;
  if (puntaje < umbral) {
    nota = (nApr - nMin) * (puntaje / umbral) + nMin;
  } else {
    nota = (nMax - nApr) * ((puntaje - umbral) / (pMaxTotal * (1 - e))) + nApr;
  }
  const truncado = Math.floor(nota * 100) / 100;
  const centesima = Math.round((truncado * 100) % 10);
  return centesima >= 5
    ? Math.ceil(truncado * 10) / 10
    : Math.floor(truncado * 10) / 10;
}

let _alumnoId = 1;
let _criterioId = 1;
const newAlumno = (nombre = "") => ({ id: _alumnoId++, nombre, puntajes: {} });
const newCriterio = (nombre = "Criterio", puntajeMax = 10) => ({
  id: _criterioId++,
  nombre,
  puntajeMax,
});

export default function App() {
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [criterios, setCriterios] = useState([
    newCriterio("Contenido", 40),
    newCriterio("Presentación", 30),
    newCriterio("Participación", 30),
  ]);
  const [alumnos, setAlumnos] = useState([
    newAlumno("Ana García"),
    newAlumno("Carlos López"),
    newAlumno("María Rodríguez"),
  ]);
  const [nuevoAlumno, setNuevoAlumno] = useState("");
  const [editandoCriterio, setEditandoCriterio] = useState(null);
  const inputRef = useRef(null);

  const pMaxTotal = criterios.reduce((s, c) => s + Number(c.puntajeMax), 0);

  const actualizarScale = (campo, valor) =>
    setScale((prev) => ({ ...prev, [campo]: parseFloat(valor) || 0 }));

  const calcularPuntajeAlumno = (alumno) =>
    criterios.reduce((sum, c) => {
      const v = alumno.puntajes[c.id];
      return sum + (v !== undefined && v !== "" ? Number(v) : 0);
    }, 0);

  const agregarAlumno = () => {
    const nombre = nuevoAlumno.trim();
    if (!nombre) return;
    setAlumnos((prev) => [...prev, newAlumno(nombre)]);
    setNuevoAlumno("");
    inputRef.current?.focus();
  };

  const eliminarAlumno = (id) =>
    setAlumnos((prev) => prev.filter((a) => a.id !== id));

  const actualizarPuntaje = (alumnoId, criterioId, valor) =>
    setAlumnos((prev) =>
      prev.map((a) =>
        a.id === alumnoId
          ? { ...a, puntajes: { ...a.puntajes, [criterioId]: valor } }
          : a,
      ),
    );

  const agregarCriterio = () =>
    setCriterios((prev) => [
      ...prev,
      newCriterio(`Criterio ${prev.length + 1}`, 10),
    ]);

  const eliminarCriterio = (id) => {
    setCriterios((prev) => prev.filter((c) => c.id !== id));
    setAlumnos((prev) =>
      prev.map((a) => {
        const { [id]: _, ...rest } = a.puntajes;
        return { ...a, puntajes: rest };
      }),
    );
  };

  const actualizarCriterio = (id, campo, valor) =>
    setCriterios((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, [campo]: campo === "puntajeMax" ? Number(valor) : valor }
          : c,
      ),
    );

  const stats = alumnos.map((a) => {
    const pts = calcularPuntajeAlumno(a);
    const nota = calcularNota(pts, scale, pMaxTotal);
    return { ...a, puntajeTotal: pts, nota };
  });

  const promedio =
    stats.length > 0
      ? (stats.reduce((s, a) => s + a.nota, 0) / stats.length).toFixed(1)
      : "—";
  const aprobados = stats.filter((a) => a.nota >= scale.nApr).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Escala de Notas y Rúbricas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sistema de evaluación con escala chilena
          </p>
        </div>

        {/* Configuración */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Configuración de escala
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Nota mínima",
                key: "nMin",
                step: "0.1",
                min: 1,
                max: 6,
              },
              {
                label: "Nota máxima",
                key: "nMax",
                step: "0.1",
                min: 2,
                max: 10,
              },
              {
                label: "Nota de aprobación",
                key: "nApr",
                step: "0.1",
                min: 1,
                max: 10,
              },
              {
                label: "Exigencia (%)",
                key: "exigencia",
                step: "1",
                min: 1,
                max: 100,
              },
            ].map(({ label, key, step, min, max }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  step={step}
                  min={min}
                  max={max}
                  value={scale[key]}
                  onChange={(e) => actualizarScale(key, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Puntaje total", value: `${pMaxTotal} pts` },
            { label: "Alumnos", value: alumnos.length },
            { label: "Promedio curso", value: promedio },
            { label: "Aprobados", value: `${aprobados} / ${alumnos.length}` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-2xl font-semibold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[160px] sticky left-0 bg-white">
                  Alumno
                </th>
                {criterios.map((c) => (
                  <th
                    key={c.id}
                    className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]"
                  >
                    {editandoCriterio === c.id ? (
                      <div className="flex flex-col gap-1.5">
                        <input
                          value={c.nombre}
                          onChange={(e) =>
                            actualizarCriterio(c.id, "nombre", e.target.value)
                          }
                          className="border border-gray-200 rounded-md px-2 py-1 text-xs text-center text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={c.puntajeMax}
                            min={1}
                            onChange={(e) =>
                              actualizarCriterio(
                                c.id,
                                "puntajeMax",
                                e.target.value,
                              )
                            }
                            className="w-14 border border-gray-200 rounded-md px-1 py-1 text-xs text-center text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <span className="text-xs text-gray-400">pts</span>
                          <button
                            onClick={() => setEditandoCriterio(null)}
                            className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md hover:bg-green-200 transition-colors"
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className="cursor-pointer hover:text-blue-500 transition-colors normal-case font-medium text-gray-600"
                            onClick={() => setEditandoCriterio(c.id)}
                            title="Haz clic para editar"
                          >
                            {c.nombre}
                          </span>
                          <button
                            onClick={() => eliminarCriterio(c.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors text-xs leading-none"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-300 font-normal normal-case mt-0.5">
                          máx {c.puntajeMax}
                        </div>
                      </div>
                    )}
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">
                  Total
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">
                  Nota
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {stats.map((alumno, idx) => (
                <tr
                  key={alumno.id}
                  className={`border-b border-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30 transition-colors`}
                >
                  <td
                    className={`px-5 py-2.5 font-medium text-gray-700 sticky left-0 ${idx % 2 === 1 ? "bg-gray-50" : "bg-white"}`}
                  >
                    {alumno.nombre}
                  </td>
                  {criterios.map((c) => (
                    <td key={c.id} className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={c.puntajeMax}
                        step="0.5"
                        value={alumno.puntajes[c.id] ?? ""}
                        onChange={(e) =>
                          actualizarPuntaje(alumno.id, c.id, e.target.value)
                        }
                        placeholder="—"
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-sm text-gray-500">
                    {alumno.puntajeTotal} / {pMaxTotal}
                  </td>
                  <td className="px-5 py-2 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg font-semibold text-base min-w-[48px] ${
                        alumno.nota >= scale.nApr
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {alumno.nota.toFixed(1)}
                    </span>
                  </td>
                  <td className="pr-3 py-2 text-center">
                    <button
                      onClick={() => eliminarAlumno(alumno.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {alumnos.length === 0 && (
                <tr>
                  <td
                    colSpan={criterios.length + 4}
                    className="py-12 text-center text-sm text-gray-400"
                  >
                    Agrega alumnos para comenzar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            ref={inputRef}
            value={nuevoAlumno}
            onChange={(e) => setNuevoAlumno(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarAlumno()}
            placeholder="Nombre del alumno..."
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={agregarAlumno}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            + Agregar alumno
          </button>
          <button
            onClick={agregarCriterio}
            className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors cursor-pointer"
          >
            + Agregar criterio
          </button>
        </div>

        {/* Fórmula */}
        <div className="bg-gray-100 rounded-xl px-5 py-4 text-xs text-gray-400 leading-relaxed">
          <span className="font-semibold text-gray-500">
            Fórmula aplicada:{" "}
          </span>
          Si puntaje &lt; {scale.exigencia}% del máximo → nota = ({scale.nApr}−
          {scale.nMin}) × p / (e × pMax) + {scale.nMin}. Si puntaje ≥ umbral →
          nota = ({scale.nMax}−{scale.nApr}) × (p − umbral) / (pMax × (1−e)) +{" "}
          {scale.nApr}. Resultado truncado a 2 decimales y aproximado al décimo
          (≥5 sube).
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8">
          Desarrollado por{" "}
          <span className="font-semibold text-gray-500">JRTDEV</span>
        </div>
      </div>
    </div>
  );
}
