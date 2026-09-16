// generar_excel.js
// Genera data/reporte-{semana}.xlsx a partir de los calificados de la semana
// (ya filtrados >=75 por el Subagente de Calificacion) y sus mensajes.
// La semana se toma de --semana / argumento (YYYY-Www); por defecto, la ultima
// semana completada (scripts/semana.js).
// Exporta construirFilas/crearLibro/rutasDe para poder probarse en memoria.
// Ejecutar: node scripts/generar_excel.js [--semana 2026-W38]
const fs = require("fs")
const path = require("path")
const XLSX = require("xlsx-js-style")
const { resolverSemana } = require("./semana")

const DIR_RAIZ = path.join(__dirname, "..")

const COLS_ANCHO = [
  { wch: 24 }, // Nombre
  { wch: 28 }, // Puesto
  { wch: 24 }, // Empresa
  { wch: 46 }, // URL de LinkedIn
  { wch: 8 },  // Puntaje
  { wch: 18 }, // Nivel recomendado
  { wch: 12 }, // Idioma del mensaje
  { wch: 100 },// Mensaje sugerido
  { wch: 85 }, // Justificación de la calificación
]

const COLS_WRAP = new Set([7, 8])

const PUNTAJE_MINIMO = 75

const normalizar = (s) => (s || "").trim().toLowerCase()

function rutasDe(semana) {
  return {
    calificados: path.join(DIR_RAIZ, "data", `calificados-${semana}.json`),
    mensajes: path.join(DIR_RAIZ, "data", `mensajes-${semana}.json`),
    salida: path.join(DIR_RAIZ, "data", `reporte-${semana}.xlsx`),
  }
}

function parsearArgs(argv) {
  let semana
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--semana") semana = argv[++i]
    else if (!argv[i].startsWith("--")) semana = argv[i]
  }
  return resolverSemana(semana)
}

function construirFilas(calificados, mensajes, { excluidas = new Set(), puntajeMinimo = PUNTAJE_MINIMO } = {}) {
  const indiceMensajes = new Map()
  for (const m of mensajes) {
    const clave = `${normalizar(m.nombre)}|${normalizar(m.empresa)}`
    indiceMensajes.set(clave, m)
    if (!indiceMensajes.has(normalizar(m.nombre))) indiceMensajes.set(normalizar(m.nombre), m)
  }

  const admitidos = calificados.filter(
    (c) => (Number(c.puntaje_total) || 0) >= puntajeMinimo && !excluidas.has(normalizar(c.empresa))
  )

  return admitidos
    .map((c) => {
      const msg =
        indiceMensajes.get(`${normalizar(c.nombre)}|${normalizar(c.empresa)}`) ||
        indiceMensajes.get(normalizar(c.nombre))
      if (!msg) console.warn(`Sin mensaje para: ${c.nombre} @ ${c.empresa}`)
      return {
        Nombre: c.nombre,
        Puesto: c.puesto,
        Empresa: c.empresa,
        "URL de LinkedIn": c.url_linkedin,
        Puntaje: c.puntaje_total,
        "Nivel recomendado": c.nivel_recomendado,
        "Idioma del mensaje": msg ? msg.idioma : "",
        "Mensaje sugerido": msg ? msg.mensaje : "",
        "Justificación de la calificación": c.justificacion,
      }
    })
    .sort((a, b) => b.Puntaje - a.Puntaje || a.Nombre.localeCompare(b.Nombre))
}

function crearLibro(filas) {
  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja["!cols"] = COLS_ANCHO

  const rango = XLSX.utils.decode_range(hoja["!ref"])
  for (let fila = rango.s.r + 1; fila <= rango.e.r; fila++) {
    for (const col of COLS_WRAP) {
      const celda = hoja[XLSX.utils.encode_cell({ r: fila, c: col })]
      if (celda) celda.s = { alignment: { wrapText: true } }
    }
  }

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, "Reporte")
  return libro
}

function main() {
  const semana = parsearArgs(process.argv.slice(2))
  const rutas = rutasDe(semana)

  for (const [nombre, ruta] of [["calificados", rutas.calificados], ["mensajes", rutas.mensajes]]) {
    if (!fs.existsSync(ruta)) {
      console.error(`Falta el archivo ${nombre} de la semana ${semana}: ${ruta}`)
      console.error("Corre primero los subagentes de sourcing/calificacion/mensajes para esa semana.")
      process.exitCode = 1
      return
    }
  }

  const calificados = JSON.parse(fs.readFileSync(rutas.calificados, "utf-8"))
  const mensajes = JSON.parse(fs.readFileSync(rutas.mensajes, "utf-8"))
  const filas = construirFilas(calificados, mensajes)
  XLSX.writeFile(crearLibro(filas), rutas.salida, { cellStyles: true })

  console.log(`Semana: ${semana}`)
  console.log(`Candidatos leidos: ${calificados.length} | filas finales (>=${PUNTAJE_MINIMO}): ${filas.length}`)
  console.log(`Archivo guardado en: ${rutas.salida}`)
}

if (require.main === module) main()

module.exports = { construirFilas, crearLibro, rutasDe, parsearArgs, COLS_ANCHO, COLS_WRAP, PUNTAJE_MINIMO }
