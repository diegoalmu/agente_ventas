---
description: Corre el pipeline semanal completo de prospección (sourcing → calificación → mensajes → reporte Excel) y entrega el resumen.
agent: reporte-semanal
---

Corre el pipeline semanal completo de prospección de TurboEmpresa.

Semana solicitada (puede venir vacía): `$ARGUMENTS`

Instrucciones:

1. Si en la petición hay una semana explícita (`YYYY-Www`), úsala; si no, usa la
   última semana completada (`node scripts/semana.js`).
2. Sigue el runbook completo: chequear re-corridas, luego sourcing → calificación →
   mensajes → reporte Excel.
3. Confirma con el usuario antes de volver a correr una semana que ya tiene archivos.
4. Termina con el resumen final y la ruta de `data/reporte-{semana}.xlsx`.
