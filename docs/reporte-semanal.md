# Reporte Semanal — Orquestador del Pipeline

Corre el pipeline completo de prospección (Sourcing → Calificación →
Mensajes → Reporte Excel) con una sola instrucción, en el orden correcto,
sin pisar trabajo ya hecho de semanas anteriores.

## Cómo se dispara

- Comando: `/reporte-semanal [YYYY-Www]`
- Lenguaje natural: "dame el reporte semanal", "corre la semana"

Sin argumento, toma por defecto la **última semana ISO completada**.

## Flujo, paso a paso

1. **Resolver la semana** — usa la indicada, o calcula la última semana
   completada con `scripts/semana.js`.
2. **Comprobar re-corridas** — si ya existe algún archivo de esa semana
   (`candidatos`, `prefiltrados`, `calificados` o `mensajes`), se detiene y
   pregunta antes de continuar. Volver a correr Sourcing avanza la rotación
   de consultas y sobrescribe la lista de candidatos, así que nunca ocurre
   sin confirmación explícita.
3. **Sourcing** → invoca al subagente `sourcing`, verifica
   `data/candidatos-{semana}.json`.
4. **Calificación** → invoca al subagente `calificacion`, verifica
   `data/calificados-{semana}.json` (ya filtrado por el umbral ≥75 y sin
   competidores directos).
5. **Mensajes** → invoca al subagente `mensajes`, verifica
   `data/mensajes-{semana}.json`.
6. **Reporte Excel** → corre `node scripts/generar_excel.js --semana {semana}`,
   genera `data/reporte-{semana}.xlsx`.
7. **Resumen final** — candidatos crudos, prefiltrados, calificados,
   mensajes redactados, filas del Excel, ruta del archivo, y avisos
   (excluidos por competidor, consultas de Serper consumidas, errores).

## Archivos del orquestador

| Archivo | Función |
|---|---|
| `.opencode/agent/reporte-semanal.md` | Agente orquestador — define el runbook y limita sus permisos a invocar `sourcing`/`calificacion`/`mensajes` vía `task`, y a correr `node scripts/*` |
| `.opencode/command/reporte-semanal.md` | Comando `/reporte-semanal`, recibe la semana opcional como argumento |
| `scripts/semana.js` | Calcula la etiqueta ISO `YYYY-Www` (última completada, actual, o explícita) |
| `scripts/generar_excel.js` | Ahora parametrizado por semana (antes fijo a 2026-W38); filtra ≥75 por sí mismo, ya no depende de una lista fija de empresas excluidas |

## Comandos de referencia

```powershell
node scripts/semana.js
```

```powershell
node scripts/semana.js actual
```

```powershell
node scripts/generar_excel.js --semana 2026-W38
```

## Suite de pruebas

```powershell
node scripts/pruebas/test_semana.js
```

```powershell
node scripts/pruebas/test_rotacion.js
```

```powershell
node scripts/pruebas/test_filtro_rapido.js
```

```powershell
node scripts/pruebas/test_reporte_excel.js
```

```powershell
node scripts/pruebas/test_wrap_readback.js
```

## Decisiones de diseño

| Tema | Decisión |
|---|---|
| Disparo | Comando slash y lenguaje natural, ambos válidos |
| Semana por defecto | Última semana ISO completada |
| Archivos ya existentes | Se detecta y se pregunta antes de re-correr, nunca se sobrescribe en silencio |
| Filtro de nivel del Excel | Se aplica dentro de `generar_excel.js` (≥75), no depende de listas externas |

## Limitaciones conocidas

- **Orquestación anidada sin confirmar en producción**: se asume que el
  agente por defecto puede invocar al orquestador vía `task`. Si en la
  práctica ese nivel de anidamiento no funcionara (limitación documentada de
  OpenCode con subagentes personalizados), el respaldo es correr
  `/reporte-semanal` directamente como agente de primer nivel — siempre
  funciona por esa vía.
- El reporte de la semana 2026-W38 se conserva con el umbral viejo (≥60,
  108 candidatos) porque ya fue entregado; el umbral ≥75 aplica desde la
  semana siguiente en adelante.
