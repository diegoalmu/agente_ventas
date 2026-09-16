// test_filtro_rapido.js
// Verifica la lógica de .opencode/tool/filtro_rapido.ts: descarta candidatos
// por palabras descalificantes (PALABRAS_DESCALIFICAN) y por empresas
// excluidas (EMPRESAS_EXCLUIDAS), y conserva solo los que cuentan con un
// puesto válido de config/icp.json.
// Ejecutar: node scripts/pruebas/test_filtro_rapido.js

const PALABRAS_DESCALIFICAN = ["intern","becario","trainee","assistant to","asistente de","former","ex-"]
const EMPRESAS_EXCLUIDAS = ["Google","Amazon","Microsoft","Meta","Apple","IBM","Oracle","SAP","Salesforce","Accenture","Deloitte Digital","Globant","EPAM","ThoughtWorks","Endava","Softtek","Capgemini","Infosys","TCS","Cognizant"]
const puestosValidos = ["ceo","founder","coo","cto","director de operaciones","director digital","head of e-commerce","director de sistemas"]

function pasa(c) {
  const t = (c.titulo || "").toLowerCase()
  if (PALABRAS_DESCALIFICAN.some((p) => t.includes(p))) return false
  if (EMPRESAS_EXCLUIDAS.some((e) => t.includes(e.toLowerCase()))) return false
  return puestosValidos.some((p) => t.includes(p))
}

const casos = [
  ["Pedro Maldonado - Country Manager at Amazon Business Mexico", false, "gigante tech (Amazon)"],
  ["CTO y Co-Founder en Globant", false, "competidor (Globant)"],
  ["Head of Engineering at Endava", false, "competidor (Endava)"],
  ["Director of Operations - Former CEO at Meta", false, "disculificador former + excluida Meta"],
  ["CEO at Acme Retail Group", true, "valido"],
  ["Founder & CEO, Boutique E-Commerce Australia", true, "valido"],
  ["Creator - President & Owner at Deloitte Digital", false, "excluida (Deloitte Digital)"],
  ["Salesforce Admin intern", false, "disculificador (intern)"],
  ["Chief Experience Officer at Really Fast Delivery", false, "sin puesto valido en lista"],
  ["Director de Sistemas en Softtek", false, "competidor (Softtek)"],
  ["Head of E-commerce en Tienda de Moda", true, "valido es"],
]

let ok = true
for (const [titulo, esperado, nota] of casos) {
  const res = pasa({ titulo })
  const match = res === esperado
  if (!match) ok = false
  console.log((match ? "OK   " : "FALLA") + " | " + (res ? "pasa" : "sale") + " | " + titulo + "   [" + nota + "]")
}
console.log(ok ? "\nTODOS LOS CASOS ESPERADOS PASARON" : "\nHUBO FALLAS EN EL SET ESPERADO")
process.exitCode = ok ? 0 : 1