import { useState, useRef, useEffect, useCallback } from "react";
import ExcelJS from "exceljs";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";

// ---------------------------------------------------------------------------
// Escala chilena
// ---------------------------------------------------------------------------
const DEFAULT_SCALE    = { nMin: 1.0, nMax: 7.0, nApr: 4.0, exigencia: 60 };
const DEFAULT_CRITERIOS = [
  { id: "c1", nombre: "Contenido",     puntajeMax: 40 },
  { id: "c2", nombre: "Presentación",  puntajeMax: 30 },
  { id: "c3", nombre: "Participación", puntajeMax: 30 },
];

const EMPTY_EVAL = {
  nombre:    "",
  escala:    DEFAULT_SCALE,
  criterios: DEFAULT_CRITERIOS,
  alumnos:   [],
};

function calcularNota(puntaje, scale, pMaxTotal) {
  const { nMin, nMax, nApr, exigencia } = scale;
  if (pMaxTotal === 0) return nMin;
  const e      = exigencia / 100;
  const umbral = e * pMaxTotal;
  let nota;
  if (puntaje < umbral) {
    nota = umbral === 0 ? nMin : (nApr - nMin) * (puntaje / umbral) + nMin;
  } else {
    const denom = pMaxTotal * (1 - e);
    nota = denom === 0 ? nMax : (nMax - nApr) * ((puntaje - umbral) / denom) + nApr;
  }
  nota = Math.min(nota, nMax);
  const truncado  = Math.floor(nota * 100) / 100;
  const centesima = Math.round((truncado * 100) % 10);
  return centesima >= 5
    ? Math.ceil(truncado  * 10) / 10
    : Math.floor(truncado * 10) / 10;
}

let _lid = 1;
const localId = (prefix = "x") => `${prefix}${_lid++}${Date.now()}`;

// ---------------------------------------------------------------------------
// Parsers Excel / CSV
// ---------------------------------------------------------------------------
const normalize = (s) => s?.toString().toLowerCase().trim() ?? "";
const COLS_NOMBRE   = ["nombre","name","first name","primer nombre","nombres"];
const COLS_APELLIDO = ["apellido","apellidos","last name","surname"];
const COLS_CRITERIO = ["criterio","criterios","nombre","name","descripción","descripcion"];
const COLS_PUNTAJE  = ["puntaje","puntaje maximo","puntaje máximo","max","máximo","maximo","puntos","pts"];
const findCol = (headers, opts) => headers.find((h) => opts.includes(h));

async function parseExcel(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("El archivo no tiene hojas.");
  const rows = [];
  ws.eachRow((row) => rows.push(row.values));
  if (rows.length < 2) throw new Error("El archivo está vacío.");
  const headers = rows[0].slice(1).map((h) => normalize(h));
  const data = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i + 1]?.result ?? row[i + 1] ?? ""; });
    return obj;
  });
  return { headers, data };
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("El CSV está vacío.");
  const splitLine = (line) => {
    const result = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if ((ch === "," || ch === ";") && !inQ) { result.push(cur); cur = ""; }
      else cur += ch;
    }
    result.push(cur);
    return result.map((s) => s.trim());
  };
  const headers = splitLine(lines[0]).map(normalize);
  const data    = lines.slice(1).map((line) => {
    const vals = splitLine(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
  return { headers, data };
}

async function parseFile(file) {
  if (file.name.toLowerCase().endsWith(".csv")) return parseCsv(await file.text());
  return parseExcel(await file.arrayBuffer());
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function DropZone({ accept, onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors select-none
        ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      <div className="text-3xl mb-2">📂</div>
      <p className="text-sm font-medium text-gray-700">Arrastra tu archivo aquí</p>
      <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar · Excel (.xlsx) o CSV</p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer">✕</button>
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
      <div className="border border-blue-200 rounded overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-blue-100">
            <tr>{headers.map((h) => <th key={h} className="px-3 py-1 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-blue-50/50"}>
                {row.map((cell, j) => <td key={j} className="px-3 py-1">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login screen
// ---------------------------------------------------------------------------
function LoginScreen({ onLogin, loading }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 w-full max-w-sm text-center space-y-6">
        <div className="text-5xl">📝</div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Rúbricas de Notas</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de evaluación con escala chilena</p>
        </div>
        <button onClick={onLogin} disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors cursor-pointer disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Conectando…" : "Continuar con Google"}
        </button>
        <p className="text-xs text-gray-400">Tus rúbricas se guardan de forma segura y solo tú puedes verlas.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const [user, setUser]                         = useState(null);
  const [authLoading, setAuthLoading]           = useState(true);
  const [loginLoading, setLoginLoading]         = useState(false);
  const [evaluaciones, setEvaluaciones]         = useState([]);
  const [evalActivaId, setEvalActivaId]         = useState(null);
  const [evalData, setEvalData]                 = useState(EMPTY_EVAL);
  const [nuevoAlumno, setNuevoAlumno]           = useState("");
  const [editandoCriterio, setEditandoCriterio] = useState(null);
  const [modal, setModal]                       = useState(null);
  const [importError, setImportError]           = useState("");
  const [importPreview, setImportPreview]       = useState(null);
  const [importLoading, setImportLoading]       = useState(false);
  const [saving, setSaving]                     = useState(false);
  const [modalEval, setModalEval]               = useState(false);
  const [nuevaEvalNombre, setNuevaEvalNombre]   = useState("");
  const [sidebarOpen, setSidebarOpen]           = useState(true);

  const inputRef  = useRef(null);
  const saveTimer = useRef(null);

  // Auth
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    try { await signInWithPopup(auth, provider); }
    catch (e) { console.error(e); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setEvaluaciones([]);
    setEvalActivaId(null);
    setEvalData(EMPTY_EVAL);
  };

  // Firestore snapshot
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, "users", user.uid, "evaluaciones");
    return onSnapshot(colRef, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));
      setEvaluaciones(docs);
    });
  }, [user]);

  // Seleccionar evaluación — un solo setState conjunto
  const seleccionarEval = useCallback((id) => {
    setEvalActivaId(id);
    setEvaluaciones((prev) => {
      const eva = prev.find((e) => e.id === id);
      setEvalData(eva
        ? {
            nombre:    eva.nombre    ?? "",
            escala:    eva.escala    ?? DEFAULT_SCALE,
            criterios: eva.criterios ?? DEFAULT_CRITERIOS,
            alumnos:   eva.alumnos   ?? [],
          }
        : EMPTY_EVAL
      );
      return prev;
    });
  }, []);

  // Guardar con debounce
  const saveEval = useCallback(async (id, data) => {
    if (!user || !id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid, "evaluaciones", id), {
        nombre:    data.nombre,
        escala:    data.escala,
        criterios: data.criterios,
        alumnos:   data.alumnos,
        updatedAt: serverTimestamp(),
      });
    } catch (e) { console.error("Error guardando:", e); }
    finally { setSaving(false); }
  }, [user]);

  const updateEvalData = useCallback((updater) => {
    setEvalData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setEvalActivaId((id) => { saveEval(id, next); return id; });
      }, 800);
      return next;
    });
  }, [saveEval]);

  // CRUD evaluaciones
  const crearEvaluacion = async () => {
    if (!user) return;
    const nombre = nuevaEvalNombre.trim() || "Nueva evaluación";
    const ref = await addDoc(collection(db, "users", user.uid, "evaluaciones"), {
      nombre,
      escala:    DEFAULT_SCALE,
      criterios: DEFAULT_CRITERIOS,
      alumnos:   [],
      updatedAt: serverTimestamp(),
    });
    setNuevaEvalNombre("");
    setModalEval(false);
    seleccionarEval(ref.id);
  };

  const eliminarEvaluacion = async (id) => {
    if (!user) return;
    if (!confirm("¿Eliminar esta evaluación? Esta acción no se puede deshacer.")) return;
    await deleteDoc(doc(db, "users", user.uid, "evaluaciones", id));
    if (evalActivaId === id) {
      setEvalActivaId(null);
      setEvalData(EMPTY_EVAL);
    }
  };

  // Derivados
  const { nombre: evalNombre, escala: scale, criterios, alumnos } = evalData;
  const pMaxTotal = criterios.reduce((s, c) => s + Number(c.puntajeMax), 0);

  const calcularPuntajeAlumno = (alumno) =>
    criterios.reduce((sum, c) => {
      const v = alumno.puntajes?.[c.id];
      return sum + (v !== undefined && v !== "" ? Number(v) : 0);
    }, 0);

  const stats = alumnos.map((a) => {
    const pts = calcularPuntajeAlumno(a);
    return { ...a, puntajeTotal: pts, nota: calcularNota(pts, scale, pMaxTotal) };
  });
  const promedio  = stats.length > 0
    ? (stats.reduce((s, a) => s + a.nota, 0) / stats.length).toFixed(1) : "—";
  const aprobados = stats.filter((a) => a.nota >= scale.nApr).length;

  // Mutaciones
  const setScaleField = (key, val) =>
    updateEvalData((p) => ({ ...p, escala: { ...p.escala, [key]: parseFloat(val) || 0 } }));

  const setEvalNombre = (nombre) =>
    updateEvalData((p) => ({ ...p, nombre }));

  const agregarAlumno = () => {
    const nombre = nuevoAlumno.trim();
    if (!nombre || !evalActivaId) return;
    updateEvalData((p) => ({ ...p, alumnos: [...p.alumnos, { id: localId("a"), nombre, puntajes: {} }] }));
    setNuevoAlumno("");
    inputRef.current?.focus();
  };

  const eliminarAlumno = (id) =>
    updateEvalData((p) => ({ ...p, alumnos: p.alumnos.filter((a) => a.id !== id) }));

  const actualizarPuntaje = (aid, cid, val) =>
    updateEvalData((p) => ({
      ...p,
      alumnos: p.alumnos.map((a) =>
        a.id === aid ? { ...a, puntajes: { ...a.puntajes, [cid]: val } } : a
      ),
    }));

  const agregarCriterio = () =>
    updateEvalData((p) => ({
      ...p,
      criterios: [...p.criterios, { id: localId("c"), nombre: `Criterio ${p.criterios.length + 1}`, puntajeMax: 10 }],
    }));

  // ✅ FIX: desestructuración computed key correcta
  const eliminarCriterio = (id) =>
    updateEvalData((p) => ({
      ...p,
      criterios: p.criterios.filter((c) => c.id !== id),
      alumnos: p.alumnos.map((a) => {
        const { [id]: _, ...rest } = a.puntajes ?? {};
        return { ...a, puntajes: rest };
      }),
    }));

  const actualizarCriterio = (id, campo, valor) =>
    updateEvalData((p) => ({
      ...p,
      criterios: p.criterios.map((c) =>
        c.id === id ? { ...c, [campo]: campo === "puntajeMax" ? Number(valor) : valor } : c
      ),
    }));

  // Importar alumnos
  const handleFileAlumnos = async (file) => {
    setImportError(""); setImportPreview(null); setImportLoading(true);
    try {
      const { headers, data } = await parseFile(file);
      const colNombre   = findCol(headers, COLS_NOMBRE);
      const colApellido = findCol(headers, COLS_APELLIDO);
      if (!colNombre) { setImportError('No se encontró la columna "nombre".'); return; }
      const items = data
        .map((row) => [row[colNombre], colApellido ? row[colApellido] : ""]
          .map((s) => s?.toString().trim()).filter(Boolean).join(" "))
        .filter(Boolean);
      if (!items.length) { setImportError("No se encontraron alumnos válidos."); return; }
      setImportPreview({ type: "alumnos", items });
    } catch (e) { setImportError(e.message ?? "Error al leer el archivo."); }
    finally { setImportLoading(false); }
  };

  const confirmarImportAlumnos = (modo) => {
    const nuevos = importPreview.items.map((nombre) => ({ id: localId("a"), nombre, puntajes: {} }));
    updateEvalData((p) => ({
      ...p,
      alumnos: modo === "reemplazar" ? nuevos : [...p.alumnos, ...nuevos],
    }));
    closeModal();
  };

  // Importar rúbrica
  const handleFileRubrica = async (file) => {
    setImportError(""); setImportPreview(null); setImportLoading(true);
    try {
      const { headers, data } = await parseFile(file);
      const colCriterio = findCol(headers, COLS_CRITERIO);
      const colPuntaje  = findCol(headers, COLS_PUNTAJE);
      if (!colCriterio) { setImportError('No se encontró columna de criterio.'); return; }
      if (!colPuntaje)  { setImportError('No se encontró columna de puntaje.'); return; }
      const items = data
        .map((row) => ({ nombre: row[colCriterio]?.toString().trim(), puntajeMax: Number(row[colPuntaje]) || 0 }))
        .filter((r) => r.nombre && r.puntajeMax > 0);
      if (!items.length) { setImportError("No se encontraron criterios válidos."); return; }
      setImportPreview({ type: "rubrica", items });
    } catch (e) { setImportError(e.message ?? "Error al leer el archivo."); }
    finally { setImportLoading(false); }
  };

  const confirmarImportRubrica = (modo) => {
    const nuevos = importPreview.items.map((r) => ({ id: localId("c"), nombre: r.nombre, puntajeMax: r.puntajeMax }));
    updateEvalData((p) => ({
      ...p,
      criterios: modo === "reemplazar" ? nuevos : [...p.criterios, ...nuevos],
      alumnos:   modo === "reemplazar" ? p.alumnos.map((a) => ({ ...a, puntajes: {} })) : p.alumnos,
    }));
    closeModal();
  };

  const closeModal = () => { setModal(null); setImportPreview(null); setImportError(""); setImportLoading(false); };
  const openModal  = (tipo) => { setModal(tipo); setImportError(""); setImportPreview(null); };

  // Guards
  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse">Cargando…</p>
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} loading={loginLoading} />;

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} transition-all duration-200 bg-white border-r border-gray-200 flex flex-col shrink-0`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{user.displayName}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-xs text-gray-500 hover:text-red-500 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
            Cerrar sesión
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Evaluaciones</p>
            <button onClick={() => setModalEval(true)}
              className="text-blue-600 hover:text-blue-700 text-xl leading-none cursor-pointer" title="Nueva evaluación">+</button>
          </div>

          {evaluaciones.length === 0 && (
            <p className="text-xs text-gray-400 px-2 py-4 text-center">Sin evaluaciones.<br />Crea una para comenzar.</p>
          )}

          {evaluaciones.map((eva) => (
            <div key={eva.id} onClick={() => seleccionarEval(eva.id)}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors
                ${evalActivaId === eva.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"}`}>
              <span className="text-sm truncate flex-1">{eva.nombre}</span>
              <button onClick={(e) => { e.stopPropagation(); eliminarEvaluacion(eva.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs ml-1 transition-all cursor-pointer">✕</button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen((v) => !v)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer">☰</button>

          {evalActivaId ? (
            <input value={evalNombre} onChange={(e) => setEvalNombre(e.target.value)}
              className="font-semibold text-gray-800 text-base bg-transparent border-none outline-none focus:bg-gray-50 rounded px-2 py-0.5 flex-1 min-w-0"
              placeholder="Nombre de la evaluación" />
          ) : (
            <h1 className="font-semibold text-gray-800 text-base flex-1">Rúbricas de Notas</h1>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {saving
              ? <span className="text-xs text-gray-400 animate-pulse">Guardando…</span>
              : evalActivaId && <span className="text-xs text-green-500">✓ Guardado</span>
            }
            {evalActivaId && (
              <>
                <button onClick={() => openModal("alumnos")}
                  className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-colors cursor-pointer">
                  📋 Importar alumnos
                </button>
                <button onClick={() => openModal("rubrica")}
                  className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-colors cursor-pointer">
                  📊 Importar rúbrica
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {!evalActivaId ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="text-5xl">📋</div>
              <div>
                <p className="text-gray-600 font-medium">Selecciona o crea una evaluación</p>
                <p className="text-sm text-gray-400 mt-1">Cada evaluación tiene su propia rúbrica, alumnos y escala</p>
              </div>
              <button onClick={() => setModalEval(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
                + Nueva evaluación
              </button>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-5">

              {/* Escala */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Configuración de escala</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Nota mínima",        key: "nMin",      step: "0.1", min: 1,  max: 6   },
                    { label: "Nota máxima",        key: "nMax",      step: "0.1", min: 2,  max: 10  },
                    { label: "Nota de aprobación", key: "nApr",      step: "0.1", min: 1,  max: 10  },
                    { label: "Exigencia (%)",      key: "exigencia", step: "1",   min: 1,  max: 100 },
                  ].map(({ label, key, step, min, max }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input type="number" step={step} min={min} max={max} value={scale[key]}
                        onChange={(e) => setScaleField(key, e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Puntaje total", value: `${pMaxTotal} pts` },
                  { label: "Alumnos",       value: alumnos.length },
                  { label: "Promedio curso",value: promedio },
                  { label: "Aprobados",     value: `${aprobados} / ${alumnos.length}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
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
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-40 sticky left-0 bg-white">
                        Alumno
                      </th>
                      {criterios.map((c) => (
                        <th key={c.id} className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-30">
                          {editandoCriterio === c.id ? (
                            <div className="flex flex-col gap-1.5">
                              <input value={c.nombre}
                                onChange={(e) => actualizarCriterio(c.id, "nombre", e.target.value)}
                                className="border border-gray-200 rounded-md px-2 py-1 text-xs text-center text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                              <div className="flex items-center justify-center gap-1">
                                <input type="number" value={c.puntajeMax} min={1}
                                  onChange={(e) => actualizarCriterio(c.id, "puntajeMax", e.target.value)}
                                  className="w-14 border border-gray-200 rounded-md px-1 py-1 text-xs text-center text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                <span className="text-xs text-gray-400">pts</span>
                                <button onClick={() => setEditandoCriterio(null)}
                                  className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md hover:bg-green-200 transition-colors cursor-pointer">✓</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="cursor-pointer hover:text-blue-500 transition-colors normal-case font-medium text-gray-600"
                                  onClick={() => setEditandoCriterio(c.id)} title="Clic para editar">{c.nombre}</span>
                                <button onClick={() => eliminarCriterio(c.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors text-xs leading-none cursor-pointer">✕</button>
                              </div>
                              <div className="text-[11px] text-gray-300 font-normal normal-case mt-0.5">máx {c.puntajeMax}</div>
                            </div>
                          )}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-20">Total</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-20">Nota</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((alumno, idx) => (
                      <tr key={alumno.id}
                        className={`border-b border-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30 transition-colors`}>
                        <td className={`px-5 py-2.5 font-medium text-gray-700 sticky left-0 ${idx % 2 === 1 ? "bg-gray-50" : "bg-white"}`}>
                          {alumno.nombre}
                        </td>
                        {criterios.map((c) => (
                          <td key={c.id} className="px-3 py-2 text-center">
                            <input type="number" min={0} max={c.puntajeMax} step="0.5"
                              value={alumno.puntajes?.[c.id] ?? ""} placeholder="—"
                              onChange={(e) => actualizarPuntaje(alumno.id, c.id, e.target.value)}
                              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center text-sm text-gray-500">
                          {alumno.puntajeTotal} / {pMaxTotal}
                        </td>
                        <td className="px-5 py-2 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg font-semibold text-base min-w-12
                            ${alumno.nota >= scale.nApr ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {alumno.nota.toFixed(1)}
                          </span>
                        </td>
                        <td className="pr-3 py-2 text-center">
                          <button onClick={() => eliminarAlumno(alumno.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors text-sm cursor-pointer">✕</button>
                        </td>
                      </tr>
                    ))}
                    {alumnos.length === 0 && (
                      <tr>
                        <td colSpan={criterios.length + 4} className="py-12 text-center text-sm text-gray-400">
                          Agrega alumnos para comenzar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-3 items-center">
                <input ref={inputRef} value={nuevoAlumno}
                  onChange={(e) => setNuevoAlumno(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && agregarAlumno()}
                  placeholder="Nombre del alumno..."
                  className="flex-1 min-w-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <button onClick={agregarAlumno}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
                  + Agregar alumno
                </button>
                <button onClick={agregarCriterio}
                  className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors cursor-pointer">
                  + Agregar criterio
                </button>
              </div>

              {/* Fórmula */}
              <div className="bg-gray-100 rounded-xl px-5 py-4 text-xs text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-500">Fórmula aplicada: </span>
                Si puntaje &lt; {scale.exigencia}% del máximo → nota = ({scale.nApr}−{scale.nMin}) × p / (e × pMax) + {scale.nMin}.{" "}
                Si puntaje ≥ umbral → nota = ({scale.nMax}−{scale.nApr}) × (p − umbral) / (pMax × (1−e)) + {scale.nApr}.{" "}
                Resultado truncado a 2 decimales y aproximado al décimo (≥5 sube).
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal nueva evaluación */}
      {modalEval && (
        <Modal title="Nueva evaluación" onClose={() => setModalEval(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre de la evaluación</label>
              <input autoFocus value={nuevaEvalNombre}
                onChange={(e) => setNuevaEvalNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && crearEvaluacion()}
                placeholder="Ej: Prueba 1, Proyecto Final…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <button onClick={crearEvaluacion}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
              Crear evaluación
            </button>
          </div>
        </Modal>
      )}

      {/* Modal importar alumnos */}
      {modal === "alumnos" && (
        <Modal title="Importar lista de alumnos" onClose={closeModal}>
          <FormatHint headers={["nombre", "apellido"]} rows={[["Ana", "García"], ["Carlos", "López"]]} />
          <DropZone accept=".xlsx,.xls,.csv" onFile={handleFileAlumnos} />
          {importLoading && <p className="text-sm text-center text-gray-400 animate-pulse">Leyendo archivo…</p>}
          {importError   && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{importError}</div>}
          {importPreview && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-green-700 mb-2">{importPreview.items.length} alumno(s) encontrado(s):</p>
                <ul className="text-xs text-green-600 space-y-0.5 max-h-40 overflow-y-auto">
                  {importPreview.items.map((n, i) => (
                    <li key={i} className="flex items-center gap-1.5"><span className="text-green-400">•</span>{n}</li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <button onClick={() => confirmarImportAlumnos("agregar")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer">
                  Agregar a la lista
                </button>
                <button onClick={() => confirmarImportAlumnos("reemplazar")}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-lg border border-gray-200 transition-colors cursor-pointer">
                  Reemplazar lista
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Modal importar rúbrica */}
      {modal === "rubrica" && (
        <Modal title="Importar rúbrica" onClose={closeModal}>
          <FormatHint headers={["criterio", "puntaje"]} rows={[["Contenido", "40"], ["Presentación", "30"], ["Participación", "30"]]} />
          <DropZone accept=".xlsx,.xls,.csv" onFile={handleFileRubrica} />
          {importLoading && <p className="text-sm text-center text-gray-400 animate-pulse">Leyendo archivo…</p>}
          {importError   && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{importError}</div>}
          {importPreview && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-green-700 mb-2">
                  {importPreview.items.length} criterio(s) · total {importPreview.items.reduce((s, r) => s + r.puntajeMax, 0)} pts
                </p>
                <ul className="text-xs text-green-600 space-y-0.5 max-h-40 overflow-y-auto">
                  {importPreview.items.map((r, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="text-green-400">•</span>{r.nombre}</span>
                      <span className="font-medium tabular-nums">{r.puntajeMax} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-gray-500">Reemplazar también limpiará los puntajes ingresados.</p>
              <div className="flex gap-2">
                <button onClick={() => confirmarImportRubrica("agregar")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer">
                  Agregar criterios
                </button>
                <button onClick={() => confirmarImportRubrica("reemplazar")}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-lg border border-gray-200 transition-colors cursor-pointer">
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