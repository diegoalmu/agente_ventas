// test_wrap_readback.js
// Documenta cómo xlsx-js-style reconstruye estilos al leer (cellStyles: true).
// Si el read devuelve null, es una limitación del READ del fork (el XML sí lo tiene),
// no un fallo del generador. La verificación autoritativa es el styles.xml del .xlsx.
// Ejecutar: node scripts/pruebas/test_wrap_readback.js
const path = require("path")
const XLSX = require("xlsx-js-style")

const RUTA = path.join(__dirname, "..", "..", "data", "reporte-2026-W38.xlsx")
const libro = XLSX.readFile(RUTA, { cellStyles: true })
const hoja = libro.Sheets[libro.SheetNames[0]]

for (const ref of ["A1", "H2", "I2", "A2"]) {
  const celda = hoja[ref]
  console.log(ref, "->", celda ? JSON.stringify(celda.s) : "(celda no existe)")
}