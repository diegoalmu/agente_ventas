// company_research.ts
//
// Investiga una empresa (nombre extraído por el propio modelo del título del
// candidato) buscando su sitio oficial y señales de necesidad (vacantes
// abiertas de desarrollo/sistemas). Esto es lo que le da al Subagente de
// Calificación material real para aplicar la rúbrica de
// docs/criterios-calificacion.md, en vez de adivinar.

import { tool } from "@opencode-ai/plugin"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

// Misma resolución determinística de raíz que filtro_rapido.ts.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAIZ_PROYECTO = path.resolve(__dirname, "../../")

// Carga SERPER_API_KEY desde el .env de la raíz del proyecto, sin importar
// desde qué carpeta se haya lanzado el proceso (mismo patrón que
// linkedin_search.ts; "dotenv/config" no sirve aquí porque lee process.cwd()).
dotenv.config({ path: path.join(RAIZ_PROYECTO, ".env") })

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
    "Investiga una empresa por su nombre: busca su sitio oficial y vacantes abiertas de desarrollo/sistemas (señal de necesidad). Regresa resultados reales de Google para que el agente los interprete y califique según la rúbrica.",
  args: {
    empresa: tool.schema
      .string()
      .describe("Nombre de la empresa a investigar, extraído del título o fragmento del candidato."),
  },
  async execute(args) {
    const [sitioOficial, vacantes] = await Promise.all([
      buscarEnSerper(`${args.empresa} sitio oficial`),
      buscarEnSerper(`${args.empresa} vacantes desarrollador OR sistemas OR TI`),
    ])

    return JSON.stringify(
      {
        empresa: args.empresa,
        sitio_oficial: sitioOficial.slice(0, 3),
        senales_de_vacantes: vacantes.slice(0, 3),
      },
      null,
      2
    )
  },
})