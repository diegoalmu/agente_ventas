// semana.js
// Calcula la etiqueta de semana ISO 8601 (YYYY-Www) que usa todo el pipeline.
// - Modo "anterior" (por defecto): la ultima semana completada (actual - 7 dias).
// - Modo "actual": la semana en curso.
// - O una etiqueta explicita validada (ej. 2026-W38).
// Exporta las funciones para poder probarse desde scripts/pruebas/.
// Ejecutar: node scripts/semana.js [anterior|actual|YYYY-Www]

const RE_SEMANA = /^\d{4}-W\d{2}$/

function etiquetaSemana(fecha) {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
  const dia = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dia)
  const anio = d.getUTCFullYear()
  const inicioAnio = new Date(Date.UTC(anio, 0, 1))
  const semana = Math.ceil(((d - inicioAnio) / 86400000 + 1) / 7)
  return `${anio}-W${String(semana).padStart(2, "0")}`
}

function semanaActual(hoy = new Date()) {
  return etiquetaSemana(hoy)
}

function semanaAnterior(hoy = new Date()) {
  const d = new Date(hoy)
  d.setDate(d.getDate() - 7)
  return etiquetaSemana(d)
}

function resolverSemana(argumento, hoy = new Date()) {
  if (!argumento || argumento === "anterior") return semanaAnterior(hoy)
  if (argumento === "actual") return semanaActual(hoy)
  if (RE_SEMANA.test(argumento)) return argumento
  throw new Error(`Semana invalida: "${argumento}". Usa anterior | actual | YYYY-Www`)
}

function main() {
  const etiqueta = resolverSemana(process.argv[2])
  console.log(etiqueta)
}

if (require.main === module) main()

module.exports = { etiquetaSemana, semanaActual, semanaAnterior, resolverSemana, RE_SEMANA }
