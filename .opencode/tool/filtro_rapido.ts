// filtro_rapido.ts
//
// Filtro barato y determinístico: NO investiga nada ni hace llamadas a
// internet. Solo compara el título ya capturado por linkedin_search contra
// la lista de puestos válidos en config/icp.json, para descartar candidatos
// obviamente irrelevantes (títulos truncados, becarios, asistentes) o de
// empresas excluidas (gigantes tech / desarrolladoras de software) ANTES de
// gastar consultas de investigación real en el Subagente de Calificación.

import { tool } from "@opencode-ai/plugin"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Resuelve la raíz del proyecto de forma determinística a partir de la
// ubicación de este mismo archivo (no depende de process.cwd(), que fue la
// causa del bug anterior en linkedin_search.ts).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RAIZ_PROYECTO = path.resolve(__dirname, "../../")

const RUTA_ICP = path.join(RAIZ_PROYECTO, "config/icp.json")
const CARPETA_DATA = path.join(RAIZ_PROYECTO, "data")

// Puestos/palabras que descartan un candidato aunque coincida con algo de la
// lista (ej. "Marketing Assistant to the CEO" no es un CEO real).
const PALABRAS_DESCALIFICAN = [
  "intern",
  "becario",
  "trainee",
  "assistant to",
  "asistente de",
  "former",
  "ex-",
]

// Empresas que se excluyen siempre: gigantes tecnológicas donde el producto de
// TurboEmpresa no tiene cabida (Google, Amazon, etc.) o competidores directos
// que desarrollan software a la medida (Globant, EPAM, Softtek, Capgemini...).
// Mismo patrón que PALABRAS_DESCALIFICAN: si el nombre aparece en el título
// del candidato, se descarta sin investigar.
const EMPRESAS_EXCLUIDAS = [
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Apple",
  "IBM",
  "Oracle",
  "SAP",
  "Salesforce",
  "Accenture",
  "Deloitte Digital",
  "Globant",
  "EPAM",
  "ThoughtWorks",
  "Endava",
  "Softtek",
  "Capgemini",
  "Infosys",
  "TCS",
  "Cognizant",
]

export default tool({
  description:
    "Filtra rápidamente (sin investigar internet) los candidatos crudos de data/candidatos-{semana}.json contra la lista de puestos válidos en config/icp.json. Guarda el resultado en data/prefiltrados-{semana}.json.",
  args: {
    etiqueta_semana: tool.schema
      .string()
      .describe("Identificador de la semana, ej. '2026-W38', igual al usado en el Subagente de Sourcing."),
  },
  async execute(args) {
    const rutaCandidatos = path.join(
      CARPETA_DATA,
      `candidatos-${args.etiqueta_semana}.json`
    )

    if (!fs.existsSync(rutaCandidatos)) {
      throw new Error(
        `No existe ${rutaCandidatos}. Corre primero el Subagente de Sourcing para esta semana.`
      )
    }

    const icp = JSON.parse(fs.readFileSync(RUTA_ICP, "utf-8"))
    const candidatos = JSON.parse(fs.readFileSync(rutaCandidatos, "utf-8"))

    const puestosValidos: string[] = icp.puestos.map((p: string) =>
      p.toLowerCase()
    )

    const prefiltrados = candidatos.filter((c: any) => {
      const tituloLower = (c.titulo || "").toLowerCase()

      const tieneDescalificador = PALABRAS_DESCALIFICAN.some((palabra) =>
        tituloLower.includes(palabra)
      )
      if (tieneDescalificador) return false

      const enEmpresaExcluida = EMPRESAS_EXCLUIDAS.some((empresa) =>
        tituloLower.includes(empresa.toLowerCase())
      )
      if (enEmpresaExcluida) return false

      const coincidePuesto = puestosValidos.some((puesto) =>
        tituloLower.includes(puesto.toLowerCase())
      )
      return coincidePuesto
    })

    const rutaSalida = path.join(
      CARPETA_DATA,
      `prefiltrados-${args.etiqueta_semana}.json`
    )
    fs.writeFileSync(rutaSalida, JSON.stringify(prefiltrados, null, 2))

    return `Filtro rápido completo: de ${candidatos.length} candidatos crudos, ${prefiltrados.length} pasaron el filtro de puesto y quedaron guardados en ${rutaSalida}. Estos son los únicos que ameritan investigación real.`
  },
})