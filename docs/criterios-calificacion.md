# Criterios de calificación y alcance — Prospección TurboEmpresa

## Contexto de negocio

TurboEmpresa vende sitios, tiendas y sistemas a la medida (formularios complejos,
cuentas por rol, integraciones con WhatsApp y pagos; stack Angular + API .NET +
PostgreSQL en Supabase + Azure). El dolor central que resuelve es reemplazar
hojas de Excel/procesos manuales por un sistema con roles, cálculos protegidos
y auditoría.

**Rango de inversión real** (calibrado con una cotización real interna,
tipo de cambio de referencia MXN/USD):

| Nivel | Qué es | MXN c/IVA | USD aprox. |
|---|---|---|---|
| Entry (Google Workspace) | El Excel actual pero con candados, Forms y Apps Script | $58,464 | **$3,439** |
| Mid (Supabase + low-code) | Base de datos real, pantallas low-code, API desde el día 1 | $121,104 | **$7,124** |
| Plataforma (.NET + Angular a la medida) | Aplicación completa a la medida, sin tope de usuarios | $331,992 | **$19,529** |

Este rango (~$3,400 a ~$19,500 USD) **reemplaza** la suposición anterior de un
ticket fijo de $21,000 USD. Es una diferencia estratégica importante, no solo
cosmética: el piso real de entrada es casi 6 veces más bajo que el que se
usó para diseñar la rúbrica original. Esto significa que la mayoría de las
empresas dentro del rango de tamaño ya definido (20-500 empleados) probablemente
sí alcanzan a pagar al menos el nivel Entry — por lo que "capacidad de pago"
deja de ser un filtro binario de sí/no y pasa a ser una señal para decidir
**qué nivel ofrecerle a cada prospecto** (información que usará el futuro
Subagente 4 de redacción de mensajes para enfocar la propuesta correcta).

El rango de búsqueda (puestos, industrias, regiones, tamaño de empresa en
`config/icp.json`) **no cambia** — se mantiene igual para no perder consistencia
en el proceso; lo que cambia es cómo se interpreta la señal de capacidad de
pago dentro de la calificación.

## Por qué no se scrapea LinkedIn, Facebook ni Instagram directamente

Ver `README.md` para el detalle completo. En resumen: automatizar la navegación
o búsqueda **dentro** de estas plataformas (aunque no se envíen mensajes) genera
patrones detectables como bot y puede terminar en el baneo permanente de la
cuenta. Este proyecto obtiene datos de perfiles públicos indexados por buscadores
(Google), nunca iniciando sesión ni automatizando un navegador contra LinkedIn,
Facebook o Instagram.

## Alcance semanal objetivo

| Etapa | Volumen semanal | Nota |
|---|---|---|
| Consultas de búsqueda ejecutadas | ~30 | Combinación de puesto × industria × región |
| Candidatos crudos obtenidos | ~250-300 | ~10 resultados por consulta |
| Candidatos netos nuevos (tras deduplicar) | ~150-200 | Se descartan los ya vistos en semanas anteriores |
| Prospectos calificados (van al reporte final) | 15-25 (~10-15%) | Son los que reciben mensaje personalizado |

Estos números están calibrados a un ritmo sostenible con Serper.dev: la
prueba gratuita de 2,500 consultas cubre varias semanas a este ritmo, y
después el costo es de aproximadamente $1 USD por cada 1,000 consultas —
prácticamente insignificante al volumen que manejamos. Si más adelante se
necesita más volumen, escalar es trivial.

## Perfil de cliente ideal (ICP)

- **Puesto**: Founder, CEO, COO, CTO, Director de Operaciones, Director/Head de
  Digital o E-commerce. Deben ser tomadores de decisión o influenciadores
  fuertes de compra, no cualquier empleado.
- **Tamaño de empresa**: 20 a 500 empleados. Menos de 20 rara vez tiene
  presupuesto para $21,000 USD; más de 500 normalmente exige licitación/RFP
  formal, poco viable para un proveedor independiente.
- **Geografía**: internacional, sin restricción a México. El criterio de
  "capacidad de pago" (abajo) debe ponderar el poder adquisitivo del mercado
  del prospecto, ya que $21,000 USD no representa el mismo esfuerzo de compra
  en todos los países.
- **Señal de necesidad (fit con lo que vende TurboEmpresa)**: vacantes abiertas
  de desarrollador, sitio web sin integración de pagos o WhatsApp, presencia de
  procesos manuales evidentes (ej. "escríbenos por WhatsApp para cotizar"),
  menciones de iniciativas de transformación digital.

## Rúbrica de calificación (0-100, calificar si el total ≥ 75)

| Criterio | Peso máximo | Cómo se evalúa |
|---|---|---|
| Rol / seniority | 25 | Puesto coincide con la lista de decisores |
| Tamaño de empresa | 20 | Dentro del rango 20-500 empleados |
| Señal de necesidad | 25 | Evidencia concreta encontrada en investigación pública |
| Capacidad de pago | 20 | Ya no es sí/no contra $21,000 USD fijo — ver "Rango de inversión real" arriba. Puntuación completa si hay señales de que alcanza para Mid o Plataforma (facturación, ronda de inversión, expansión); puntuación media si solo alcanza para Entry, ajustado siempre por el mercado del prospecto |
| Actividad reciente | 10 | Actividad en LinkedIn en los últimos 3 meses |

Esta rúbrica la aplicará el **Subagente 2 (Enriquecimiento/Calificación)**, que
aún no se ha construido. El Subagente 1 (Sourcing) solo recolecta candidatos
crudos; no califica.

## Por qué esta estructura de documentación

Un solo archivo README gigante mezcla decisiones de negocio con instrucciones
de instalación — difícil de mantener y de navegar. Muchos archivos pequeños
generan ruido sin aportar claridad. Este proyecto separa por tipo de contenido:
`README.md` (qué es y cómo correrlo), este archivo (por qué se decidió así) y
el código con sus propios comentarios (cómo está implementado).
