// scripts/recordatorio.js
//
// Script independiente (NO usa OpenCode ni ninguna librería externa) que
// manda un recordatorio por Telegram. Se dispara desde el Programador de
// Tareas de Windows cada lunes.

const fs = require("fs")
const path = require("path")

const RUTA_ENV = path.join(__dirname, "..", ".env")

function cargarEnv(ruta) {
  const contenido = fs.readFileSync(ruta, "utf-8")
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

async function main() {
  const env = cargarEnv(RUTA_ENV)
  const token = env.TELEGRAM_BOT_TOKEN
  const chatId = env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.error("Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en .env")
    process.exit(1)
  }

  const mensaje = "Recordatorio: toca correr Sourcing y Calificación esta semana en OpenCode (D:\\agente_ventas)."

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: mensaje }),
  })

  if (!respuesta.ok) {
    console.error(`Telegram respondió ${respuesta.status}: ${await respuesta.text()}`)
    process.exit(1)
  }

  console.log("Recordatorio enviado correctamente.")
}

main()