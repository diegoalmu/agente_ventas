// linkedin_search.ts
//
// Este tool NO se conecta a LinkedIn. Consulta la API de Serper.dev, que
// regresa resultados reales de Google, restringidos con "site:linkedin.com/in"
// en el texto de la consulta, es decir, páginas de perfil público que Google
// ya tiene indexadas. Esto evita por completo el riesgo de baneo de cuenta:
// nunca iniciamos sesión ni automatizamos un navegador contra LinkedIn.
//
// (Nota: originalmente este tool usaba Google Custom Search JSON API
// directamente, pero esa API está cerrada a clientes nuevos desde 2026 y se
// apaga por completo el 1 de enero de 2027 — por eso se cambió a Serper.dev,
// que expone los mismos resultados de Google vía una API de terceros.)
//
// Requiere en el entorno (ver .env.example):
//   SERPER_API_KEY  -> API key de https://serper.dev

import { tool } from "@opencode-ai/plugin"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

// Detecta la raíz del proyecto de forma robusta. Normalmente opencode se
// lanza desde la raíz del proyecto (ej. D:\agente_ventas), pero si el proceso
// arranca desde otra carpeta (como el home del usuario), subimos desde la
// ubicación de este archivo (.opencode/tool/) buscando la carpeta config/.
function detectarRaizDelProyecto(): string {
  const cwd = process.cwd()
  if (fs.existsSync(path.join(cwd, "config", "icp.json"))) {
    return cwd
  }
  const directorioDeEsteArchivo = path.dirname(
    fileURLToPath(import.meta.url)
  )
  return path.resolve(directorioDeEsteArchivo, "..", "..")
}

const RUTA_RAIZ_PROYECTO = detectarRaizDelProyecto()

// Carga variables de entorno desde el .env de la raíz del proyecto, sin
// importar desde qué carpeta se haya lanzado el proceso.
dotenv.config({ path: path.join(RUTA_RAIZ_PROYECTO, ".env") })

// Rutas fijas del proyecto (relativas a la raíz detectada arriba).
const RUTA_ICP = path.join(RUTA_RAIZ_PROYECTO, "config", "icp.json")
const RUTA_VISTOS = path.join(RUTA_RAIZ_PROYECTO, "data", "vistos.json")
const CARPETA_DATA = path.join(RUTA_RAIZ_PROYECTO, "data")

// Lee el archivo de perfiles ya vistos en semanas anteriores (para no
// reperfilar a la misma persona). Si no existe todavía, regresa un set vacío.
function cargarVistos(): Set<string> {
  if (!fs.existsSync(RUTA_VISTOS)) return new Set()
  const contenido = fs.readFileSync(RUTA_VISTOS, "utf-8")
  return new Set(JSON.parse(contenido))
}

function guardarVistos(vistos: Set<string>) {
  fs.writeFileSync(RUTA_VISTOS, JSON.stringify([...vistos], null, 2))
}

// Construye las combinaciones puesto + industria + región a partir de
// config/icp.json, respetando el límite de consultas diarias.
function construirConsultas(icp: any): string[] {
  const consultas: string[] = []
  const puestosTexto = icp.puestos.map((p: string) => `"${p}"`).join(" OR ")

  for (const industria of icp.industrias) {
    for (const region of icp.regiones) {
      consultas.push(
        `site:linkedin.com/in (${puestosTexto}) "${industria}" "${region}"`
      )
    }
  }

  // Recorta al máximo diario configurado (evita gastar de más el saldo de Serper).
  return consultas.slice(0, icp.consultas_maximas_por_dia)
}

// Llama a la API de Serper.dev para una sola consulta.
async function buscarEnSerper(consulta: string): Promise<any[]> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    throw new Error(
      "Falta SERPER_API_KEY en el entorno. Revisa tu archivo .env."
    )
  }

  const respuesta = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: consulta }),
  })

  if (!respuesta.ok) {
    throw new Error(
      `Serper.dev respondió ${respuesta.status}: ${await respuesta.text()}`
    )
  }

  const datos = await respuesta.json()
  return datos.organic ?? []
}

export default tool({
  description:
    "Busca perfiles públicos de LinkedIn indexados por Google (vía Serper.dev, nunca navega LinkedIn directamente) usando los puestos, industrias y regiones definidos en config/icp.json. Deduplica contra candidatos de semanas anteriores y guarda el resultado crudo en data/.",
  args: {
    etiqueta_semana: tool.schema
      .string()
      .describe(
        "Identificador de esta corrida, ej. '2026-W38'. Se usa para nombrar el archivo de salida."
      ),
  },
  async execute(args) {
    const icp = JSON.parse(fs.readFileSync(RUTA_ICP, "utf-8"))
    const vistos = cargarVistos()
    const consultas = construirConsultas(icp)

    const candidatosNuevos: any[] = []

    for (const consulta of consultas) {
      const resultados = await buscarEnSerper(consulta)

      for (const item of resultados) {
        const url = item.link
        if (vistos.has(url)) continue // ya se recolectó en una semana anterior

        candidatosNuevos.push({
          url,
          titulo: item.title,
          fragmento: item.snippet,
          consulta_origen: consulta,
        })
        vistos.add(url)
      }
    }

    guardarVistos(vistos)

    if (!fs.existsSync(CARPETA_DATA)) fs.mkdirSync(CARPETA_DATA)
    const archivoSalida = path.join(
      CARPETA_DATA,
      `candidatos-${args.etiqueta_semana}.json`
    )
    fs.writeFileSync(archivoSalida, JSON.stringify(candidatosNuevos, null, 2))

    return `Se ejecutaron ${consultas.length} consultas y se encontraron ${candidatosNuevos.length} candidatos nuevos (no vistos antes). Guardados en ${archivoSalida}.`
  },
})
