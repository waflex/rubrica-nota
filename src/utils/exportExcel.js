// src/utils/exportExcel.js
import ExcelJS from "exceljs";

function safeFilename(name) {
  return name?.replace(/[\\/:*?"<>|]/g, "_") || "evaluacion";
}

/**
 * Exporta una evaluación a un archivo .xlsx y dispara la descarga en el navegador.
 * @param {Object} evalData - Documento de evaluación (nombre, criterios, alumnos, escala)
 * @param {Array} stats - Array opcional con puntajeTotal y nota por alumno (calcularEstadisticas devuelve esto)
 */
export async function exportEvaluationToExcel(evalData, stats = null) {
  const { nombre = "Evaluacion", criterios = [], alumnos = [], escala = {} } = evalData || {};

  // Si no recibimos stats, calculamos puntaje total simple
  let computedStats = stats;
  if (!computedStats) {
    // cálculo simple inline para evitar dependencia circular; se asume estructura mínima
    const pMaxTotal = criterios.reduce((s, c) => s + Number(c.puntajeMax || 0), 0);
    computedStats = alumnos.map((a) => {
      const puntajeTotal = criterios.reduce((sum, c) => {
        const v = a.puntajes?.[c.id];
        return sum + (v !== undefined && v !== "" ? Number(v) : 0);
      }, 0);
      // nota no precisa precisión exacta aquí; dejar vacía para que el usuario la vea
      return { ...a, puntajeTotal };
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "rubrica-notas";
  wb.created = new Date();

  // Hoja principal con notas
  const ws = wb.addWorksheet("Notas");

  // Encabezado: Nombre + criterios + Total + Nota
  const header = ["Nombre", ...criterios.map((c) => c.nombre || c.id), "Puntaje total", "Nota"];
  ws.addRow(header);

  // Formato de encabezado
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };

  // Rellenar filas de alumnos
  computedStats.forEach((a) => {
    const row = [];
    row.push(a.nombre || "");
    criterios.forEach((c) => {
      const v = a.puntajes?.[c.id];
      row.push(v !== undefined && v !== "" ? Number(v) : "");
    });
    row.push(a.puntajeTotal ?? "");
    row.push(a.nota ?? "");
    ws.addRow(row);
  });

  // Auto-ajustar ancho de columnas mínimamente
  ws.columns.forEach((col) => {
    let maxLength = 10;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      const len = v ? String(v).length : 0;
      if (len > maxLength) maxLength = Math.min(len, 60);
    });
    col.width = maxLength + 2;
  });

  // Hoja resumen con metadata
  const meta = wb.addWorksheet("Resumen");
  meta.addRow(["Nombre de evaluación", nombre]);
  meta.addRow(["Fecha exportación", new Date().toLocaleString()]);
  meta.addRow(["Criterios totales", criterios.length]);
  meta.addRow(["Alumnos", alumnos.length]);
  meta.addRow(["Escala nMin", escala.nMin ?? ""]);
  meta.addRow(["Escala nMax", escala.nMax ?? ""]);
  meta.addRow(["Escala nApr", escala.nApr ?? ""]);
  meta.addRow(["Escala exigencia (%)", escala.exigencia ?? ""]);

  // Generar archivo y descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFilename(nombre)} - notas.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default exportEvaluationToExcel;
