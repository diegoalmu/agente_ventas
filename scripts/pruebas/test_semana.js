// test_semana.js
// Verifica scripts/semana.js contra etiquetas ISO 8601 conocidas, incluyendo
// el cambio de anio y la semana 53, mas el modo anterior/actual/explicito.
// Ejecutar: node scripts/pruebas/test_semana.js
const { etiquetaSemana, semanaActual, semanaAnterior, resolverSemana } = require("../semana")

let ok = true
const falla = (msg) => { ok = false; console.log("FALLA | " + msg) }
const espera = (obtenido, esperado, etiqueta) => {
  if (obtenido === esperado) console.log(`OK   | ${etiqueta}: ${obtenido}`)
  else falla(`${etiqueta}: esperaba ${esperado}, obtuve ${obtenido}`)
}

// --- Semanas ISO conocidas (fechas con componentes locales) ---
espera(etiquetaSemana(new Date(2026, 0, 1)), "2026-W01", "jue 1-ene-2026 (inicia W01)")
espera(etiquetaSemana(new Date(2025, 11, 29)), "2026-W01", "lun 29-dic-2025 (pertenece a 2026-W01)")
espera(etiquetaSemana(new Date(2026, 0, 4)), "2026-W01", "dom 4-ene-2026 (cierra W01)")
espera(etiquetaSemana(new Date(2026, 0, 5)), "2026-W02", "lun 5-ene-2026 (abre W02)")
espera(etiquetaSemana(new Date(2026, 1, 16)), "2026-W08", "lun 16-feb-2026")
espera(etiquetaSemana(new Date(2024, 11, 30)), "2025-W01", "lun 30-dic-2024 (pertenece a 2025-W01)")
espera(etiquetaSemana(new Date(2020, 11, 31)), "2020-W53", "jue 31-dic-2020 (semana 53)")
espera(etiquetaSemana(new Date(2021, 0, 1)), "2020-W53", "vie 1-ene-2021 (pertenece a 2020-W53)")

// --- Modos ---
const ref = new Date(2026, 1, 18) // mie 18-feb-2026 -> W08
espera(semanaActual(ref), "2026-W08", "semanaActual(ref W08)")
espera(semanaAnterior(ref), "2026-W07", "semanaAnterior(ref W08)")
espera(resolverSemana(undefined, ref), "2026-W07", "resolverSemana sin argumento = anterior")
espera(resolverSemana("anterior", ref), "2026-W07", "resolverSemana('anterior')")
espera(resolverSemana("actual", ref), "2026-W08", "resolverSemana('actual')")
espera(resolverSemana("2026-W38", ref), "2026-W38", "resolverSemana('2026-W38') pasa tal cual")

// Change of year in 'anterior': 8-ene-2026 (W02) -> 1-ene-2026 (W01)
espera(resolverSemana("anterior", new Date(2026, 0, 8)), "2026-W01", "anterior cruza dentro de 2026")

// --- Validacion ---
for (const malo of ["2026-W9", "26-W09", "2026w09", "torta", "2026-W123"]) {
  try {
    resolverSemana(malo, ref)
    falla(`acepto etiqueta invalida: ${malo}`)
  } catch (e) {
    console.log(`OK   | rechaza "${malo}"`)
  }
}

console.log(ok ? "\nSEMANA OK" : "\nHUBO FALLAS")
process.exitCode = ok ? 0 : 1
