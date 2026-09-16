# AGENTS.md — Reglas del agente para este proyecto

## Pruebas de lógica Node.js

Al probar lógica de Node.js de forma aislada (verificar cálculos, simular funciones), nunca intentes pasar código Node inline con `node -e` o `-Command` en PowerShell — el escapado de comillas falla de forma consistente en este entorno.

En vez de eso, escribe un archivo de prueba permanente dentro de `scripts/pruebas/`, con nombre descriptivo según qué lógica verifica (ej. `scripts/pruebas/test_rotacion.js`, `scripts/pruebas/test_filtro_rapido.js`).

Si ya existe un archivo de prueba para esa misma lógica, sobrescríbelo en vez de crear uno nuevo o borrarlo.

Estos archivos NO se eliminan al terminar — quedan como una suite de pruebas que se puede volver a correr cada vez que se modifique esa parte del código.

## Pipeline semanal (reporte semanal)

Existe un agente orquestador `reporte-semanal` que corre la semana completa:
sourcing → calificación → mensajes → reporte Excel.

Cuando el usuario pida "el reporte semanal", "corre la semana" o similar, invócalo con
la herramienta `task` (subagent_type `reporte-semanal`) en vez de correr las etapas tú
mismo. Él se encarga de resolver la semana (por defecto, la última semana completada),
confirmar antes de re-correr una semana ya existente, delegar a los subagentes
`sourcing`, `calificacion` y `mensajes`, y generar `data/reporte-{semana}.xlsx`.

También se puede disparar con el comando `/reporte-semanal [YYYY-Www]`.

Notas del pipeline:

- La semana se calcula con `node scripts/semana.js` (por defecto la anterior; `actual`
  o un `YYYY-Www` explícito lo cambian).
- El Excel se genera con `node scripts/generar_excel.js --semana {semana}`; lee
  `data/calificados-{semana}.json`, se queda solo con puntaje ≥75 y cruza los mensajes
  de `data/mensajes-{semana}.json`.
- Volver a correr `sourcing` para una misma semana avanza el bloque de rotación y
  sobrescribe `candidatos-{semana}.json`: no lo hagas sin confirmar con el usuario.