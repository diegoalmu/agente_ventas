// test_rotacion.js
// Verifica la lógica de rotación de consultas de .opencode/tool/linkedin_search.ts:
// cada corrida toma el siguiente bloque de N combinaciones a partir del índice
// guardado, da la vuelta al inicio al llegar al final y cubre todas las
// combinaciones de config/icp.json en pocas corridas.
// Ejecutar: node scripts/pruebas/test_rotacion.js

const fs = require("fs")

const icp = JSON.parse(fs.readFileSync("D:/agente_ventas/config/icp.json", "utf-8"))
const combos = []
for (const industria of icp.industrias)
  for (const region of icp.regiones) combos.push(`${industria} / ${region}`)

const limite = Math.max(0, Math.min(Number(icp.consultas_maximas_por_dia) || 0, combos.length))
console.log("Total combinaciones:", combos.length, "| limite por corrida:", limite)

let indiceInicio = 0
const cubiertas = new Set()
for (let corrida = 1; corrida <= 3; corrida++) {
  const seleccion = []
  for (let i = 0; i < limite; i++) seleccion.push(combos[(indiceInicio + i) % combos.length])
  const ultimo = limite > 0 ? (indiceInicio + limite - 1) % combos.length : 0
  const siguiente = (indiceInicio + limite) % combos.length
  seleccion.forEach((c) => cubiertas.add(c))
  console.log(`Corrida ${corrida}: inicia en indice ${indiceInicio} | cubre indices ${indiceInicio}..${ultimo} | proximo inicio: ${siguiente}`)
  console.log("  primeras 3:", seleccion.slice(0, 3).join(" | "))
  console.log("  ultimas 3 :", seleccion.slice(-3).join(" | "))
  indiceInicio = siguiente
}
console.log(`Tras corrida 2, cobertura: ${cubiertas.size}/${combos.length} = ${Math.round((cubiertas.size / combos.length) * 100)}%`)
const fuera = combos.filter((c) => !cubiertas.has(c))
console.log("Fuera tras 2 corridas:", fuera.length === 0 ? "(ninguna)" : fuera.join(", "))