// src/utils/exportPdf.js
import jsPDF from 'jspdf'

export function exportEvaluationToPdf(evalData, stats = []) {
  const { nombre = 'Evaluacion', criterios = [], alumnos = [] } = evalData || {}
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const startY = 40
  doc.setFontSize(14)
  doc.text(nombre, 40, startY)

  const headers = ['Nombre', ...criterios.map(c => c.nombre || c.id), 'Puntaje total', 'Nota']
  const rows = (stats || alumnos).map((a) => [
    a.nombre || '',
    ...criterios.map((c) => a.puntajes?.[c.id] ?? ''),
    a.puntajeTotal ?? '',
    a.nota ?? '',
  ])

  // Simple table rendering
  doc.setFontSize(10)
  let y = startY + 20
  const colWidths = [150, ...criterios.map(() => 60), 60, 40]

  // Header
  let x = 40
  headers.forEach((h, i) => {
    doc.text(String(h), x, y)
    x += colWidths[i] || 60
  })
  y += 12

  rows.forEach((row) => {
    let x2 = 40
    row.forEach((cell, i) => {
      doc.text(String(cell), x2, y)
      x2 += colWidths[i] || 60
    })
    y += 12
    if (y > 750) { doc.addPage(); y = 40 }
  })

  doc.save(`${nombre} - notas.pdf`)
}

export default exportEvaluationToPdf
