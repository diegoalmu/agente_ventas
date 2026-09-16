// test_reporte_excel.js
// Verifica scripts/generar_excel.js:
//  - parametrizacion por semana (parsearArgs/rutasDe)
//  - construccion de filas: filtro >=75, exclusion opcional, orden desc,
//    cabeceras en orden, cruce de mensajes por nombre|empresa con fallback por nombre
//  - integracion: escribe un .xlsx temporal y lo vuelve a leer
//  - coherencia: leer calificados-2026-W38.json con >=75 reproduce las 27 filas
//    que antes salian de calificados-2026-W38-top.json
// Ejecutar: node scripts/pruebas/test_reporte_excel.js
const fs = require("fs")
const os = require("os")
const path = require("path")
const XLSX = require("xlsx-js-style")
const { construirFilas, crearLibro, rutasDe, parsearArgs, PUNTAJE_MINIMO } = require("../generar_excel")
const { resolverSemana } = require("../semana")

const RAIZ = path.join(__dirname, "..", "..")
const HEADERS = [
  "Nombre",
  "Puesto",
  "Empresa",
  "URL de LinkedIn",
  "Puntaje",
  "Nivel recomendado",
  "Idioma del mensaje",
  "Mensaje sugerido",
  "Justificación de la calificación",
]

let ok = true
const falla = (msg) => { ok = false; console.log("FALLA | " + msg) }
const espera = (obtenido, esperado, etiqueta) => {
  if (obtenido === esperado) console.log(`OK   | ${etiqueta}: ${obtenido}`)
  else falla(`${etiqueta}: esperaba ${esperado}, obtuve ${obtenido}`)
}

// --- Parametrizacion por semana ---
espera(parsearArgs(["--semana", "2026-W38"]), "2026-W38", "parsearArgs --semana")
espera(parsearArgs(["2026-W38"]), "2026-W38", "parsearArgs posicional")
espera(parsearArgs([]), resolverSemana(undefined), "parsearArgs sin arg = ultima completada")
espera(path.basename(rutasDe("2026-W38").salida), "reporte-2026-W38.xlsx", "rutasDe salida")
espera(path.basename(rutasDe("2026-W38").calificados), "calificados-2026-W38.json", "rutasDe calificados")

// --- Unidad: construirFilas con datos sinteticos ---
const cal = [
  { nombre: "Ana", empresa: "Acme", puesto: "CTO", url_linkedin: "https://x/ana", puntaje_total: 90, nivel_recomendado: "Mid", justificacion: "j1" },
  { nombre: "Beto", empresa: "Beta", puesto: "CEO", url_linkedin: "https://x/beto", puntaje_total: 80, nivel_recomendado: "Entry", justificacion: "j2" },
  { nombre: "Caro", empresa: "Comp", puesto: "Head", url_linkedin: "https://x/caro", puntaje_total: 70, nivel_recomendado: "Entry", justificacion: "j3" },
  { nombre: "Dani", empresa: "Comp2", puesto: "Founder", url_linkedin: "https://x/dani", puntaje_total: 85, nivel_recomendado: "Plataforma", justificacion: "j4" },
  { nombre: "Eva", empresa: "Excluida", puesto: "COO", url_linkedin: "https://x/eva", puntaje_total: 95, nivel_recomendado: "Mid", justificacion: "j5" },
]
const msgs = [
  { nombre: "Ana", empresa: "Acme", idioma: "es", mensaje: "hola ana" },
  { nombre: "Beto", empresa: "Beta", idioma: "en", mensaje: "hi beto" },
  { nombre: "Dani", empresa: "OtraEmpresa", idioma: "es", mensaje: "hola dani (fallback)" },
  { nombre: "Eva", empresa: "Excluida", idioma: "en", mensaje: "hi eva" },
]

const filas = construirFilas(cal, msgs, { excluidas: new Set(["excluida"]) })
espera(filas.length, 3, "filtro >=75 + exclusion -> 3 filas")
espera(filas.map((f) => f.Nombre).join(","), "Ana,Dani,Beto", "orden descendente por puntaje")
espera(JSON.stringify(Object.keys(filas[0])), JSON.stringify(HEADERS), "cabeceras en orden")
espera(filas.find((f) => f.Nombre === "Dani")["Mensaje sugerido"], "hola dani (fallback)", "cruce por nombre de respaldo")
if (filas.some((f) => f.Nombre === "Caro")) falla("Caro (70) no deberia pasar el filtro >=75")
else console.log(`OK   | Caro (70 < ${PUNTAJE_MINIMO}) descartada`)
if (filas.some((f) => f.Nombre === "Eva")) falla("Eva no deberia aparecer: empresa excluida")
else console.log("OK   | empresa excluida omitida")

const sinExcluir = construirFilas(cal, msgs)
espera(sinExcluir.length, 4, "sin exclusiones -> 4 filas")

// --- Coherencia con la corrida W38 real ---
const rutaCalW38 = path.join(RAIZ, "data", "calificados-2026-W38.json")
const rutaMsgW38 = path.join(RAIZ, "data", "mensajes-2026-W38.json")
const calW38 = JSON.parse(fs.readFileSync(rutaCalW38, "utf-8"))
const msgW38 = JSON.parse(fs.readFileSync(rutaMsgW38, "utf-8"))
const filasW38 = construirFilas(calW38, msgW38)
espera(filasW38.length, 27, `W38 con >=${PUNTAJE_MINIMO} reproduce las 27 del -top`)
espera(calW38.filter((c) => (c.puntaje_total || 0) >= PUNTAJE_MINIMO).length, 27, "conteo directo >=75 en calificados W38")

// --- Integracion: escribir y releer un .xlsx temporal ---
const libro = crearLibro(filas)
const hoja = libro.Sheets.Reporte
for (const [nombre, celda] of [["Mensaje sugerido (H)", hoja["H2"]], ["Justificación (I)", hoja["I2"]]]) {
  if (!(celda && celda.s && celda.s.alignment && celda.s.alignment.wrapText))
    falla(`wrapText ausente en memoria en columna ${nombre}`)
}
if (hoja["H2"].s.alignment.wrapText && hoja["I2"].s.alignment.wrapText)
  console.log("OK   | wrap text en memoria (Mensaje y Justificación)")
if (!hoja["!cols"] || hoja["!cols"].length !== 9) falla("anchos de columna ausentes")
else if (!(hoja["!cols"][7].wch > Math.max(...hoja["!cols"].slice(0, 7).map((c) => c.wch))))
  falla("Mensaje deberia ser la columna mas ancha")
else console.log("OK   | 9 anchos de columna; Mensaje (100) el mas ancho")

const rutaTmp = path.join(os.tmpdir(), "reporte-prueba.xlsx")
XLSX.writeFile(libro, rutaTmp, { cellStyles: true })
const releido = XLSX.readFile(rutaTmp)
const filasDisco = XLSX.utils.sheet_to_json(releido.Sheets[releido.SheetNames[0]], { defval: "" })
espera(filasDisco.length, 3, "integracion: .xlsx temporal releido con 3 filas")
espera(filasDisco[0]["Idioma del mensaje"] !== undefined, true, "integracion: columna Idioma presente")

console.log(ok ? "\nREPORTE EXCEL OK" : "\nHUBO FALLAS")
process.exitCode = ok ? 0 : 1
