// src/utils/parsers.js
import ExcelJS from "exceljs";
import { normalize, findCol } from "./constants";

/**
 * Parsea un archivo Excel (.xlsx, .xls)
 * @param {ArrayBuffer} buffer - Contenido del archivo
 * @returns {Object} { headers, data }
 */
export async function parseExcel(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("El archivo no tiene hojas.");
  
  const rows = [];
  ws.eachRow((row) => rows.push(row.values));
  
  if (rows.length < 2) throw new Error("El archivo está vacío o no tiene datos.");
  
  const headers = rows[0].slice(1).map((h) => normalize(h));
  
  const data = rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i + 1]?.result ?? row[i + 1] ?? "";
    });
    return obj;
  });
  
  return { headers, data };
}

/**
 * Divide una línea CSV respetando comillas
 * @param {string} line - Línea del CSV
 * @returns {Array} Array de valores
 */
function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "," || char === ";") && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map((s) => s.trim());
}

/**
 * Parsea un archivo CSV
 * @param {string} text - Contenido del archivo
 * @returns {Object} { headers, data }
 */
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  
  if (lines.length < 2) throw new Error("El CSV está vacío o no tiene datos suficientes.");
  
  const headers = splitCSVLine(lines[0]).map(normalize);
  const data = lines.slice(1).map((line) => {
    const vals = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] ?? "";
    });
    return obj;
  });
  
  return { headers, data };
}

/**
 * Parsea un archivo (detecta automáticamente el tipo)
 * @param {File} file - Archivo a parsear
 * @returns {Object} { headers, data }
 */
export async function parseFile(file) {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith(".csv")) {
    const text = await file.text();
    return parseCSV(text);
  }
  
  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    return parseExcel(buffer);
  }
  
  throw new Error("Formato de archivo no soportado. Use .xlsx, .xls o .csv");
}

/**
 * Extrae lista de alumnos desde datos parseados
 * @param {Object} parsedData - Datos parseados { headers, data }
 * @returns {Array} Lista de nombres de alumnos
 */
export function extractAlumnos(parsedData) {
  const { headers, data } = parsedData;
  const COLS_NOMBRE = ["nombre", "name", "first name", "primer nombre", "nombres"];
  const COLS_APELLIDO = ["apellido", "apellidos", "last name", "surname"];
  
  const colNombre = findCol(headers, COLS_NOMBRE);
  const colApellido = findCol(headers, COLS_APELLIDO);
  
  if (!colNombre) throw new Error('No se encontró la columna "nombre" en el archivo.');
  
  const items = data
    .map((row) => {
      const nombre = row[colNombre]?.toString().trim();
      const apellido = colApellido ? row[colApellido]?.toString().trim() : "";
      return [nombre, apellido].filter(Boolean).join(" ");
    })
    .filter(Boolean);
  
  return items;
}

/**
 * Extrae criterios de rúbrica desde datos parseados
 * @param {Object} parsedData - Datos parseados { headers, data }
 * @returns {Array} Lista de criterios { nombre, puntajeMax }
 */
export function extractCriterios(parsedData) {
  const { headers, data } = parsedData;
  const COLS_CRITERIO = ["criterio", "criterios", "nombre", "name", "descripción", "descripcion"];
  const COLS_PUNTAJE = ["puntaje", "puntaje maximo", "puntaje máximo", "max", "máximo", "maximo", "puntos", "pts"];
  
  const colCriterio = findCol(headers, COLS_CRITERIO);
  const colPuntaje = findCol(headers, COLS_PUNTAJE);
  
  if (!colCriterio) throw new Error('No se encontró columna de criterio en el archivo.');
  if (!colPuntaje) throw new Error('No se encontró columna de puntaje en el archivo.');
  
  const items = data
    .map((row) => ({
      nombre: row[colCriterio]?.toString().trim(),
      puntajeMax: Number(row[colPuntaje]) || 0,
    }))
    .filter((r) => r.nombre && r.puntajeMax > 0);
  
  return items;
}