import { useState, useRef } from "react";
import ExcelJS from "exceljs";

// ---------------------------------------------------------------------------
// Escala chilena
// ---------------------------------------------------------------------------
const DEFAULT_SCALE = { nMin: 1.0, nMax: 7.0, nApr: 4.0, exigencia: 60 };

function calcularNota(puntaje, scale, pMaxTotal) {
  const { nMin, nMax, nApr, exigencia } = scale;
  if (pMaxTotal === 0) return nMin;
  const e = exigencia / 100;
  const umbral = e * pMaxTotal;
  let nota;
  if (puntaje < umbral) {
    nota = umbral === 0 ? nMin : (nApr - nMin) * (puntaje / umbral) + nMin;
  } else {
    const denom = pMaxTotal * (1 - e);
    nota =
      denom === 0 ? nMax : (nMax - nApr) * ((puntaje - umbral) / denom) + nApr;
  }
  nota = Math.min(nota, nMax);
  const truncado = Math.floor(nota * 100) / 100;
  const centesima = Math.round((truncado * 100) % 10);
  return centesima >= 5
    ? Math.ceil(truncado * 10) / 10
    : Math.floor(truncado * 10) / 10;
}

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------
let _aid = 1,
  _cid = 1;
const newAlumno = (nombre) => ({ id: _aid++, nombre, puntajes: {} });
const newCriterio = (nombre, puntajeMax) => ({
  id: _cid++,
  nombre,
  puntajeMax: Number(puntajeMax),
});

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------
const normalize = (s) => s?.toString().toLowerCase().trim() ?? "";

/** Lee un ArrayBuffer y devuelve array de objetos {col: value} */
async function parseExcel(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("El archivo no tiene hojas.");

  const rows = [];
  ws.eachRow((row, rowNumber) => {
    rows.push(row.values); // index 1-based, index 0 = undefined
  });

  if (rows.length < 2)
    throw new Error("El archivo está vacío o solo tiene encabezados.");

  // Primera fila = encabezados
  const headers = rows[0].slice(1).map((h) => normalize(h));
  const data = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      const cell = row[i + 1];
      obj[h] = cell?.result ?? cell ?? "";
    });
    return obj;
  });
  return { headers, data };
}

/** Parsea CSV simple (sin dependencias) */
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2)
    throw new Error("El CSV está vacío o solo tiene encabezados.");

  const splitLine = (line) => {
    const result = [];
    let cur = "",
      inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if ((ch === "," || ch === ";") && !inQuotes) {
        result.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result.map((s) => s.trim());
  };

  const headers = splitLine(lines[0]).map(normalize);
  const data = lines.slice(1).map((line) => {
    const vals = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] ?? "";
    });
    return obj;
  });
  return { headers, data };
}

async function parseFile(file) {
  const isCsv = file.name.toLowerCase().endsWith(".csv");
  if (isCsv) {
    const text = await file.text();
    return parseCsv(text);
  }
  const buffer = await file.arrayBuffer();
  return parseExcel(buffer);
}

// ---------------------------------------------------------------------------
// Helpers para encontrar columnas
// ---------------------------------------------------------------------------
const COLS_NOMBRE = [
  "nombre",
  "name",
  "first name",
  "primer nombre",
  "nombres",
];
const COLS_APELLIDO = ["apellido", "apellidos", "last name", "surname"];
const COLS_CRITERIO = [
  "criterio",
  "criterios",
  "nombre",
  "name",
  "descripción",
  "descripcion",
];
const COLS_PUNTAJE = [
  "puntaje",
  "puntaje maximo",
  "puntaje máximo",
  "max",
  "máximo",
  "maximo",
  "puntos",
  "pts",
];

const findCol = (headers, opts) => headers.find((h) => opts.includes(h));

// ---------------------------------------------------------------------------
// Componentes UI
// ---------------------------------------------------------------------------
function DropZone({ accept, onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors select-none
        ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <div className="text-3xl mb-2">📂</div>
      <p className="text-sm font-medium text-gray-700">
        Arrastra tu archivo aquí
      </p>
      <p className="text-xs text-gray-400 mt-1">
        o haz clic para seleccionar · Excel (.xlsx) o CSV
      </p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function FormatHint({ headers, rows }) {
  return (
    <div className="bg-blue-50 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-2">
      <p className="font-semibold">Formato esperado (Excel .xlsx o CSV):</p>
      <p>Primera hoja, primera fila como encabezados:</p>
      <div className="border border-blue-200 rounded overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-blue-100">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-1 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-white" : "bg-blue-50/50"}
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
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
  const [modal, setModal] = useState(null); // "alumnos" | "rubrica"
  const [importError, setImportError] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const pMaxTotal = criterios.reduce((s, c) => s + Number(c.puntajeMax), 0);
  const actualizarScale = (k, v) =>
    setScale((p) => ({ ...p, [k]: parseFloat(v) || 0 }));

  const calcularPuntajeAlumno = (alumno) =>
    criterios.reduce((sum, c) => {
      const v = alumno.puntajes[c.id];
      return sum + (v !== undefined && v !== "" ? Number(v) : 0);
    }, 0);

  const agregarAlumno = () => {
    const nombre = nuevoAlumno.trim();
    if (!nombre) return;
    setAlumnos((p) => [...p, newAlumno(nombre)]);
    setNuevoAlumno("");
    inputRef.current?.focus();
  };

  const eliminarAlumno = (id) =>
    setAlumnos((p) => p.filter((a) => a.id !== id));
  const actualizarPuntaje = (aid, cid, val) =>
    setAlumnos((p) =>
      p.map((a) =>
        a.id === aid ? { ...a, puntajes: { ...a.puntajes, [cid]: val } } : a,
      ),
    );
  const agregarCriterio = () =>
    setCriterios((p) => [...p, newCriterio(`Criterio ${p.length + 1}`, 10)]);
  const eliminarCriterio = (id) => {
    setCriterios((p) => p.filter((c) => c.id !== id));
    setAlumnos((p) =>
      p.map((a) => {
        const { [id]: _, ...rest } = a.puntajes;
        return { ...a, puntajes: rest };
      }),
    );
  };
  const actualizarCriterio = (id, campo, valor) =>
    setCriterios((p) =>
      p.map((c) =>
        c.id === id
          ? { ...c, [campo]: campo === "puntajeMax" ? Number(valor) : valor }
          : c,
      ),
    );

  // ---- Importar alumnos ---------------------------------------------------
  const handleFileAlumnos = async (file) => {
    setImportError("");
    setImportPreview(null);
    setLoading(true);
    try {
      const { headers, data } = await parseFile(file);
      const colNombre = findCol(headers, COLS_NOMBRE);
      const colApellido = findCol(headers, COLS_APELLIDO);

      if (!colNombre) {
        setImportError(
          'No se encontró la columna "nombre". Revisa los encabezados del archivo.',
        );
        return;
      }

      const items = data
        .map((row) =>
          [row[colNombre], colApellido ? row[colApellido] : ""]
            .map((s) => s?.toString().trim())
            .filter(Boolean)
            .join(" "),
        )
        .filter(Boolean);

      if (items.length === 0) {
        setImportError("No se encontraron alumnos válidos en el archivo.");
        return;
      }
      setImportPreview({ type: "alumnos", items });
    } catch (err) {
      setImportError(err.message ?? "Error al leer el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarImportAlumnos = (modo) => {
    const nuevos = importPreview.items.map((nombre) => newAlumno(nombre));
    setAlumnos(modo === "reemplazar" ? nuevos : (p) => [...p, ...nuevos]);
    closeModal();
  };

  // ---- Importar rúbrica ---------------------------------------------------
  const handleFileRubrica = async (file) => {
    setImportError("");
    setImportPreview(null);
    setLoading(true);
    try {
      const { headers, data } = await parseFile(file);
      const colCriterio = findCol(headers, COLS_CRITERIO);
      const colPuntaje = findCol(headers, COLS_PUNTAJE);

      if (!colCriterio) {
        setImportError(
          'No se encontró columna de criterio. Usa "criterio" o "nombre".',
        );
        return;
      }
      if (!colPuntaje) {
        setImportError(
          'No se encontró columna de puntaje. Usa "puntaje" o "puntaje maximo".',
        );
        return;
      }

      const items = data
        .map((row) => ({
          nombre: row[colCriterio]?.toString().trim(),
          puntajeMax: Number(row[colPuntaje]) || 0,
        }))
        .filter((r) => r.nombre && r.puntajeMax > 0);

      if (items.length === 0) {
        setImportError(
          "No se encontraron criterios válidos. Verifica que la columna de puntaje tenga valores numéricos.",
        );
        return;
      }
      setImportPreview({ type: "rubrica", items });
    } catch (err) {
      setImportError(err.message ?? "Error al leer el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarImportRubrica = (modo) => {
    const nuevos = importPreview.items.map((r) =>
      newCriterio(r.nombre, r.puntajeMax),
    );
    if (modo === "reemplazar") {
      setCriterios(nuevos);
      setAlumnos((p) => p.map((a) => ({ ...a, puntajes: {} })));
    } else {
      setCriterios((p) => [...p, ...nuevos]);
    }
    closeModal();
  };

  const closeModal = () => {
    setModal(null);
    setImportPreview(null);
    setImportError("");
    setLoading(false);
  };
  const openModal = (tipo) => {
    setModal(tipo);
    setImportError("");
    setImportPreview(null);
  };

  // ---- Stats --------------------------------------------------------------
  const stats = alumnos.map((a) => {
    const pts = calcularPuntajeAlumno(a);
    return {
      ...a,
      puntajeTotal: pts,
      nota: calcularNota(pts, scale, pMaxTotal),
    };
  });
  const promedio =
    stats.length > 0
      ? (stats.reduce((s, a) => s + a.nota, 0) / stats.length).toFixed(1)
      : "—";
  const aprobados = stats.filter((a) => a.nota >= scale.nApr).length;

  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Escala de Notas y Rúbricas
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Sistema de evaluación con escala chilena
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => openModal("alumnos")}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors cursor-pointer"
            >
              <span>📋</span> Importar alumnos
            </button>
            <button
              onClick={() => openModal("rubrica")}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors cursor-pointer"
            >
              <span>📊</span> Importar rúbrica
            </button>
          </div>
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
                            className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md hover:bg-green-200 transition-colors cursor-pointer"
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
                            title="Clic para editar"
                          >
                            {c.nombre}
                          </span>
                          <button
                            onClick={() => eliminarCriterio(c.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors text-xs leading-none cursor-pointer"
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
                        placeholder="—"
                        onChange={(e) =>
                          actualizarPuntaje(alumno.id, c.id, e.target.value)
                        }
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-sm text-gray-500">
                    {alumno.puntajeTotal} / {pMaxTotal}
                  </td>
                  <td className="px-5 py-2 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg font-semibold text-base min-w-[48px]
                      ${alumno.nota >= scale.nApr ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                    >
                      {alumno.nota.toFixed(1)}
                    </span>
                  </td>
                  <td className="pr-3 py-2 text-center">
                    <button
                      onClick={() => eliminarAlumno(alumno.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-sm cursor-pointer"
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

        {/* Acciones manuales */}
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
      </div>
      {/* Footer */}
      <div className="text-center text-xs text-gray-400 mt-8">
        Desarrollado por{" "}
        <span className="font-semibold text-gray-500">JRTDEV</span>
      </div>
      {/* ---- Modal importar alumnos ---- */}
      {modal === "alumnos" && (
        <Modal title="Importar lista de alumnos" onClose={closeModal}>
          <FormatHint
            headers={["nombre", "apellido"]}
            rows={[
              ["Ana", "García"],
              ["Carlos", "López"],
              ["María", "Rodríguez"],
            ]}
          />

          <DropZone accept=".xlsx,.xls,.csv" onFile={handleFileAlumnos} />

          {loading && (
            <p className="text-sm text-center text-gray-400 animate-pulse">
              Leyendo archivo…
            </p>
          )}

          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {importError}
            </div>
          )}

          {importPreview && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-green-700 mb-2">
                  {importPreview.items.length} alumno
                  {importPreview.items.length !== 1 ? "s" : ""} encontrado
                  {importPreview.items.length !== 1 ? "s" : ""}:
                </p>
                <ul className="text-xs text-green-600 space-y-0.5 max-h-40 overflow-y-auto">
                  {importPreview.items.map((nombre, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-green-400">•</span>
                      {nombre}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-gray-500">¿Cómo quieres importar?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmarImportAlumnos("agregar")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Agregar a la lista
                </button>
                <button
                  onClick={() => confirmarImportAlumnos("reemplazar")}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                >
                  Reemplazar lista
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ---- Modal importar rúbrica ---- */}
      {modal === "rubrica" && (
        <Modal title="Importar rúbrica" onClose={closeModal}>
          <FormatHint
            headers={["criterio", "puntaje"]}
            rows={[
              ["Contenido", "40"],
              ["Presentación", "30"],
              ["Participación", "30"],
            ]}
          />

          <DropZone accept=".xlsx,.xls,.csv" onFile={handleFileRubrica} />

          {loading && (
            <p className="text-sm text-center text-gray-400 animate-pulse">
              Leyendo archivo…
            </p>
          )}

          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {importError}
            </div>
          )}

          {importPreview && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-green-700 mb-2">
                  {importPreview.items.length} criterio
                  {importPreview.items.length !== 1 ? "s" : ""} encontrado
                  {importPreview.items.length !== 1 ? "s" : ""} (total:{" "}
                  {importPreview.items.reduce((s, r) => s + r.puntajeMax, 0)}{" "}
                  pts):
                </p>
                <ul className="text-xs text-green-600 space-y-0.5 max-h-40 overflow-y-auto">
                  {importPreview.items.map((r, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-green-400">•</span>
                        {r.nombre}
                      </span>
                      <span className="font-medium tabular-nums">
                        {r.puntajeMax} pts
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-gray-500">
                Reemplazar también limpiará los puntajes ya ingresados.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmarImportRubrica("agregar")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Agregar criterios
                </button>
                <button
                  onClick={() => confirmarImportRubrica("reemplazar")}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                >
                  Reemplazar rúbrica
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
