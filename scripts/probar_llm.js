const { llamarNIMConJSON } = require("./lib/llm")

async function main() {
  const resultado = await llamarNIMConJSON({
    systemPrompt: "Respondes siempre en JSON.",
    userPrompt: 'Regresa exactamente este JSON: {"saludo": "hola", "numero": 42}',
  })
  console.log("Funcionó. Resultado:", resultado)
}

main().catch((error) => {
  console.error("Falló:", error.message)
  process.exit(1)
})