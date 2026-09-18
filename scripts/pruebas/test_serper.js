// test_serper.js
// Prueba de conectividad: confirma que la clave de Serper del .env raíz funciona
// desde esta carpeta con UNA sola consulta https://google.serper.dev/search.
// Replica la detección de raíz y la carga de claves de linkedin_search.ts pero
// NUNCA imprime la clave. Efecto colateral: consume 1 consulta de Serper.
// Ejecutar: node scripts/pruebas/test_serper.js
const fs = require("fs")
const path = require("path")

// Detección de la raíz del proyecto igual que .opencode/tool/linkedin_search.ts
function detectarRaizDelProyecto() {
  const cwd = process.cwd()
  if (fs.existsSync(path.join(cwd, "config", "icp.json"))) return cwd
  return path.resolve(__dirname, "..", "..")
}

function leerClaveSoloDeEnv(ruta) {
  if (!fs.existsSync(ruta)) return null
  const contenido = fs.readFileSync(ruta, "utf-8")
  for (const linea of contenido.split(/\r?\n/)) {
    const m = linea.match(/^\s*(?:export\s+)?SERPER_API_KEY\s*=\s*(.*)$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, "")
  }
  return null
}

async function main() {
  const raiz = detectarRaizDelProyecto()
  const clave = leerClaveSoloDeEnv(path.join(raiz, ".env"))

  if (!clave) {
    console.log("Error | No se encontro SERPER_API_KEY valida en el .env de la raiz del proyecto.")
    process.exitCode = 1
    return
  }

  const consulta = 'site:linkedin.com/in "Retail" "Mexico"'

  try {
    const respuesta = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": clave, "Content-Type": "application/json" },
      body: JSON.stringify({ q: consulta }),
    })

    if (!respuesta.ok) {
      const texto = await respuesta.text()
      console.log(`Error Serper | HTTP ${respuesta.status}: ${texto.slice(0, 300)}`)
      process.exitCode = 1
      return
    }

    const datos = await respuesta.json()
    const organicos = Array.isArray(datos.organic) ? datos.organic.length : 0
    console.log(`Serper OK | 1 consulta de prueba, HTTP 200, ${organicos} resultados organicos.`)
  } catch (e) {
    console.log(`Error red | ${e.message}`)
    process.exitCode = 1
  }
}

main()