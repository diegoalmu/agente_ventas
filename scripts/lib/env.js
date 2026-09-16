// env.js
//
// Carga variables de entorno desde el .env de la raíz del proyecto, sin
// depender de ninguna librería externa (mismo patrón ya probado en
// recordatorio.js). Resuelve la raíz de forma determinística a partir de la
// ubicación de este archivo: scripts/lib -> scripts -> raíz del proyecto.

const fs = require("fs")
const path = require("path")

const RAIZ_PROYECTO = path.resolve(__dirname, "..", "..")
const RUTA_ENV = path.join(RAIZ_PROYECTO, ".env")

function cargarEnv() {
  const contenido = fs.readFileSync(RUTA_ENV, "utf-8")
  const variables = {}
  for (const linea of contenido.split("\n")) {
    const limpia = linea.trim()
    if (!limpia || limpia.startsWith("#")) continue
    const igual = limpia.indexOf("=")
    if (igual === -1) continue
    const clave = limpia.slice(0, igual).trim()
    const valor = limpia.slice(igual + 1).trim()
    variables[clave] = valor
  }
  return variables
}

module.exports = { cargarEnv, RAIZ_PROYECTO }