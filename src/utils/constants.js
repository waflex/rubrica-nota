// src/utils/constants.js

// Escala chilena por defecto
export const DEFAULT_SCALE = {
  nMin: 1.0,
  nMax: 7.0,
  nApr: 4.0,
  exigencia: 60
};

// Criterios por defecto para una nueva rúbrica
export const DEFAULT_CRITERIOS = [
  { id: "c1", nombre: "Contenido", puntajeMax: 40 },
  { id: "c2", nombre: "Presentación", puntajeMax: 30 },
  { id: "c3", nombre: "Participación", puntajeMax: 30 },
];

// Estructura vacía de una evaluación
export const EMPTY_EVAL = {
  nombre: "",
  escala: DEFAULT_SCALE,
  criterios: DEFAULT_CRITERIOS,
  alumnos: [],
};

// Generador de IDs únicos
let _lid = 1;
export const localId = (prefix = "x") => {
  return `${prefix}${_lid++}${Date.now()}`;
};

// Mapeo de columnas para importación
export const COLS_NOMBRE = ["nombre", "name", "first name", "primer nombre", "nombres"];
export const COLS_APELLIDO = ["apellido", "apellidos", "last name", "surname"];
export const COLS_CRITERIO = ["criterio", "criterios", "nombre", "name", "descripción", "descripcion"];
export const COLS_PUNTAJE = ["puntaje", "puntaje maximo", "puntaje máximo", "max", "máximo", "maximo", "puntos", "pts"];

// Función helper para encontrar columna por nombre
export const findCol = (headers, opts) => headers.find((h) => opts.includes(h));

// Función para normalizar strings
export const normalize = (s) => s?.toString().toLowerCase().trim() ?? "";

// Labels para campos de escala
export const SCALE_FIELDS = [
  { label: "Nota mínima", key: "nMin", step: "0.1", min: 1, max: 6 },
  { label: "Nota máxima", key: "nMax", step: "0.1", min: 2, max: 10 },
  { label: "Nota de aprobación", key: "nApr", step: "0.1", min: 1, max: 10 },
  { label: "Exigencia (%)", key: "exigencia", step: "1", min: 1, max: 100 },
];