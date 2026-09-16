// llm.js
//
// Llama al endpoint de NVIDIA NIM (compatible con el formato de OpenAI) y,
// cuando se le pide JSON, valida que la respuesta sea JSON real antes de
// regresarla — si el modelo la manda mal formada (les pasa a los modelos
// abiertos más que a Claude/GPT), reintenta con una instrucción más estricta
// en vez de tronar el pipeline completo por un solo candidato.

const { cargarEnv } = require("./env")

const MODELO_DEFAULT = "meta/llama-4-scout-17b-16e-instruct"
const URL_NIM = "https://integrate.api.nvidia.com/v1/chat/completions"

async function llamarNIM({ systemPrompt, userPrompt, model, temperature }) {
  const env = cargarEnv()
  const apiKey = env.NVIDIA_API_KEY

  if (!apiKey) {
    throw new Error("Falta NVIDIA_API_KEY en .env")
  }

  const respuesta = await fetch(URL_NIM, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || env.NVIDIA_MODEL || MODELO_DEFAULT,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: temperature ?? 0.4,
    }),
  })

  if (!respuesta.ok) {
    throw new Error(`NVIDIA NIM respondió ${respuesta.status}: ${await respuesta.text()}`)
  }

  const datos = await respuesta.json()
  return datos.choices[0].message.content
}

// Extrae JSON de la respuesta aunque venga envuelta en ```json ... ``` o con
// texto alrededor (comportamiento común de modelos abiertos).
function extraerJSON(texto) {
  const sinBackticks = texto.replace(/```json|```/g, "").trim()
  const inicio = sinBackticks.indexOf("{")
  const inicioArreglo = sinBackticks.indexOf("[")
  const usarArreglo = inicioArreglo !== -1 && (inicio === -1 || inicioArreglo < inicio)
  const desde = usarArreglo ? inicioArreglo : inicio
  const hasta = usarArreglo ? sinBackticks.lastIndexOf("]") : sinBackticks.lastIndexOf("}")
  if (desde === -1 || hasta === -1) throw new Error("No se encontró JSON en la respuesta")
  return JSON.parse(sinBackticks.slice(desde, hasta + 1))
}

async function llamarNIMConJSON({ systemPrompt, userPrompt, model, maxReintentos = 2 }) {
  let ultimoError
  for (let intento = 0; intento <= maxReintentos; intento++) {
    const promptFinal =
      intento === 0
        ? userPrompt
        : `${userPrompt}\n\nIMPORTANTE: responde ÚNICAMENTE con JSON válido, sin texto adicional, sin explicaciones, sin backticks.`
    try {
      const texto = await llamarNIM({ systemPrompt, userPrompt: promptFinal, model })
      return extraerJSON(texto)
    } catch (error) {
      ultimoError = error
    }
  }
  throw new Error(`Falló tras ${maxReintentos + 1} intentos: ${ultimoError.message}`)
}

module.exports = { llamarNIM, llamarNIMConJSON }