# Fase 2 — normalización y modelo canónico

Continuidad: Fase 3 completada localmente; ver [motor de propuestas](data-reconciliation-engine.md).
El diseño de filtros REF se implementó después localmente en Fase 5; ver
[filtros y dashboards](data-quality-filters.md). Aún no está aplicado a producción.

2026-11-24. Implementación local sobre la auditoría de Fase 1. No cambia esquema,
identidades, hechos financieros, tasas ni permisos remotos. La implementación de
filtros REF descrita abajo es diseño para la fase de consultas, no una función ya
disponible en la aplicación.

## Reglas implementadas

El módulo `src/lib/data/normalization.ts` es puro y compartible entre servidor y
cliente; no depende de Supabase ni de la interfaz. Cada transformación devuelve
una clave/valor derivado, conservando el original en las estructuras de importación.

| Dominio | Función y regla | Límite de uso |
| --- | --- | --- |
| Headers y códigos de custodio conocidos | `textSearchKey`: trim, espacios consecutivos a uno, minúsculas españolas | Misma comparación que ya usaban los importadores; no crea aliases semánticos |
| Nombres de cliente/comercial/equipo; servicio y tipo de comisión | `textSearchKey` para búsqueda | No identifica personas, no asigna UUID ni convierte clasificaciones; tildes y caracteres no blancos se conservan |
| Cuenta externa | `inspectAccountIdentifier`: `key = original` | Ceros, signos, separadores, mayúsculas, espacios y caracteres invisibles permanecen intactos |
| Riesgos del identificador | Indicadores de espacios extremos, lista explícita de invisibles y notación científica | Diagnóstico para revisión, nunca permiso para resolver automáticamente |
| Fecha | `isoDate`: AAAA-MM-DD real, año 1–9998 y bisiestos gregorianos | Sin interpretación de fechas locales ambiguas, recorte ni zona horaria |
| Período importado | `importPeriod` / `isImportPeriod`: mes 1–12 y año 1900–2200 → AAAA-MM-01 | Admite los espacios de los campos mes/año ya admitidos; no acepta meses por nombre ni números decimales |

No hay una función por cada etiqueta de negocio que repita el mismo algoritmo:
cliente/comercial/equipo/servicio/tipo comparten búsqueda, no identidad. La búsqueda
no elimina acentos, signos ni zero-width characters. La lista diagnóstica invisible
incluye NBSP, zero-width space, non-joiner, joiner y BOM; no pretende cubrir Unicode
completo. Los nombres de custodios también pueden buscarse con esta regla, pero
el enrutamiento sigue exigiendo un código registrado único y el UUID del custodio.

Integración efectiva: `validate.ts` y `historical.ts` usan el mismo helper para
headers/códigos y períodos; `contracts.ts` valida el período con la misma regla.
La detección científica usa el inspector compartido. El parser Master conserva
sus headers exactos y reglas particulares; no se amplía silenciosamente su contrato.
Los filtros financieros siguen usando UUID/literales contractuales existentes.

No se agregaron advertencias persistidas a manifiestos en curso. Los indicadores
de espacios/invisibles quedan disponibles para el motor de revisión siguiente;
integrarlos a preview/staging requiere revisar la versión del parser para no cambiar
resúmenes congelados al retomar cargas. Las huellas siguen calculándose sobre
originales, nunca sobre claves de búsqueda. No se duplica normalización de nombres
en SQL ni se altera `account_identifiers.value_normalized`, que sigue siendo literal.

## Identidad y equivalencias

La cuenta mantiene su UUID interno. La resolución externa se acota por **fuente +
namespace + custodio + literal**. Igual número en distinto custodio/namespace no
prueba igualdad. AUM/Revenue se relacionan solo mediante equivalencias acreditadas,
como el par REF ya revisado, y no mediante la búsqueda normalizada.

Se reutiliza `account_identifiers`, su unicidad de clave resuelta y auditoría.
No se necesita otra tabla de identidad para Fase 2. Los dos pares identificados en
la auditoría siguen pendientes; un indicador de whitespace no aprueba una fusión.
Aliases de personas, equipos, servicios o tipos requieren un destino canónico y
evidencia de negocio antes de persistirlos; no se generan por parecido de nombres.
El contrato del motor y sus estados se implementará en Fase 3.

## Diseño de filtros REF separado de atribución histórica

Problema: REF contiene etiquetas actuales; los filtros `cliente`, `comercial` y
`equipo` existentes usan entidades canónicas, con vigencias en los dos últimos.
Reutilizar esos parámetros para REF produciría cambios de significado silenciosos.

Propuesta concreta para la fase de consultas:

- Mantener los filtros canónicos existentes. Agregar un grupo visible «Referencias
  de REF · foto sin vigencia histórica», con filtros independientes y ayuda breve.
- Transportar `ref_snapshot` (UUID) y selectores separados `ref_cliente`,
  `ref_comercial`, `ref_equipo`. No enviar un nombre como si fuera un UUID canónico.
- Identificar cada grupo literal dentro de snapshot/dimensión por su primera
  `source_row` (mínimo entre las filas con esa etiqueta). El par snapshot/fila
  ya existe, es inmutable y evita crear entidades de personas o IDs basados en
  texto normalizado. El servidor verifica que sea la fila representativa del grupo.
- Las opciones devuelven ID de fila y etiqueta original. La búsqueda puede usar
  `textSearchKey`; dos etiquetas que colisionen por esa clave permanecen dos opciones
  distintas hasta aprobar una equivalencia. El agrupamiento financiero es literal.
- Admitir una opción explícita `sin_referencia`: cuenta sin fila REF o con etiqueta
  NULL para esa dimensión. Sin filtro conserva todas las cuentas. Un identificador
  de opción inválido debe producir error, sin caer silenciosamente en «Todos».
- Fijar la revisión al snapshot actual. Si cambió desde la selección/paginación,
  devolver conflicto de revisión y ofrecer reiniciar, sin aplicar la nueva foto
  silenciosamente. No usar la fecha de publicación REF como fecha de asignación.
- Resolver el filtro dentro de SQL autorizado mediante EXISTS sobre UUID de cuenta.
  Agregar cada fuente independientemente antes de combinar métricas. Nunca unir
  etiquetas/originales al detalle Revenue para luego sumar.
- Aplicar AND entre filtros REF y canónicos, custodio, servicio, cuenta y período;
  mostrar ambos grupos activos. Bajo REF, seleccionar una cuenta determina el
  mismo conjunto durante todos los meses, sin fabricar asignaciones mensuales.
- Reutilizar esa selección en Resumen, Análisis, Cuentas, ROA y CSV, con etiquetas
  claras de la base usada. Comisiones conserva su propia semántica de beneficiario
  y base; no reinterpretar Owner como comercial fechado automáticamente.
- Consultar opciones con búsqueda/paginación y recuperar selección por ID. Los
  límites actuales de 100/200 no deben ocultar opciones sin posibilidad de buscarlas.
- Consultar solo REF publicado; lectores nunca reciben filas originales/preparadas.
  Campos nuevos entran en la huella de revisión y en las exportaciones.

Este contrato requiere modificación coordinada de RPC, contratos/API, enlaces,
selectores, CSV y pruebas SQL/HTTP/roles. No se agregan parámetros aceptados por la
API hasta tener ese recorrido completo; hoy siguen rechazándose como desconocidos.
No se creó migración ni se cambiaron consultas en esta fase.

## Verificación y continuación

60 unitarias pasan, incluidas seis nuevas para ceros/espacios/invisibles, claves
de búsqueda, fechas/bisiestos, límites, originales inmutables, Revenue repetido y
equivalencia entre preparación mensual e histórica. Ocho comparaciones adicionales
de reportes/manifiestos sintéticos completos contra HEAD anterior resultaron
idénticas (AUM/Revenue/FA CSV/XLSX y dos manifiestos AUM). Lint y tsc aislado pasan.
Límites de build/entorno y comandos en [data-quality-validation.md](data-quality-validation.md).

Próximo paso: Fase 3, motor local de propuestas de reconciliación con reglas
explícitas, conflictos y evidencia, conservando los casos ambiguos para revisión.
Las reparaciones remotas siguen requiriendo dry-run y aprobación específica.
