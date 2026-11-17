# Motor trimestral de comisiones y conciliación

Vigente: solicitud del 2026-11-17. Implementación exclusivamente local; sin datos
reales ni migración/despliegue remoto. Amplía expectativas y comparación, sin
liquidaciones, pagos ni deuda del representante. Reemplaza **para este motor** la
propuesta ACT/365 del plan anterior. El helper `advisory.ts` anterior se conserva
sin consumidores; no se combina con esta fórmula.

## Regla y fecha de corte

Versión `balance_annual_div4_v1`:

- anual = Balance importado × Adv Fee / Retro anual en proporción decimal;
- trimestral = anual × 0.25 (equivale a /4 sin perder escala decimal);
- diferencia = cobro comparable − trimestral;
- porcentaje = diferencia × 100 / trimestral; N/D cuando el esperado es cero.

Montos negativos y cero son válidos; ausente es null. No hay redondeo monetario
implícito ni tolerancia: Matched requiere igualdad exacta. PostgreSQL `numeric`
sin escala fija realiza toda operación financiera. Las cadenas de entrada/salida
son decimales canónicos; se rechazan JSON Number, coma, exponentes, NaN e infinito.
La división porcentual periódica tiene la precisión decimal de PostgreSQL;
se conservan numerador y denominador exactos por conciliación, sin usar el
porcentaje redondeado para decidir estado o totales.

**No hay una fecha de corte global inferida.** Cada base exige `cutoff` ISO con año,
header Balance seleccionado y `cutoff_evidence` que acredita su aplicación al
trimestre indicado por separado. Puede ser cierre previo o fecha del trimestre
si la evidencia lo justifica; el motor no elige la política económica. Ejemplo
sintético HTTP: Q1 2026 usa foto acreditada de 2025-12-31. Los tests SQL usan fotos
sintéticas fechadas al inicio de cada trimestre. La bandeja muestra corte/tasa.
No hay fallback a AUM, interpolación de tasas ni generación de otros trimestres.

El cálculo numérico puede servir de vista preliminar con tasa/base presentes,
pero `verified` sólo se activa con evidencia de tasa **para ese trimestre**,
elegibilidad confirmada y aceptación explícita de la fórmula para ese Fee type.
`no_historical_evidence` y tipos sin regla revisada quedan Pending y fuera de
comparables. No se infiere si existen archivos históricos. El Balance confirmado
en este pedido no se equipara con Assets Billed On del helper ACT/365.

## Entradas revisadas y originales

`POST /api/comisiones` (administrador/sesión activa, mismo origen, hasta 1 MiB)
recibe `{request_id, operation, target_id, input}`. `request_id` UUID identifica un
comando idempotente; reutilizarlo con contenido diferente falla. Las correcciones
usan otro UUID y `input.previous_id` igual a la versión activa de esa operación.
Cada evento conserva actor, fecha, original, motivo y referencia a la versión previa.
No se actualiza ni elimina historia; todas las escrituras pasan por la RPC.

`expected`: `target_id` es UUID estable de obligación. `input` requiere:

- `account_id`, `custodian_id` resueltos y `account_evidence`; no une por nombre.
- `quarter` (primer día de trimestre calendario), `cutoff`, `cutoff_evidence`.
- `broker`, `owner` (= Owner Name payout original), `fee_type`, `basis`:
  `gross`, `net` o `representative_payout`. Broker es referencia original,
  **no** custodio/comercial inferido. Owner es referencia literal, no identidad
  de persona inferida; homónimos requieren resolución externa acreditada.
- `component_key`: componente cuya independencia/aditividad revisó el operador.
  Repetir cuenta/trimestre/broker/owner/fee/base/componente con otro UUID falla;
  corregir la obligación existente. No inventar componentes para eludir duplicados.
- `balance`, `annual_rate`: strings canónicos o null; 0.25%, 0.5%, 1% se normalizan
  explícitamente a `0.0025`, `0.005`, `0.01`. `normalization_evidence` documenta
  convención de monto/unidad de tasa. El motor no interpreta una celda ambigua.
- `rate_evidence_status: confirmed_for_quarter`, `rate_evidence`,
  `fee_rule: balance_annual_div4_v1`, `fee_rule_evidence`,
  `eligibility_confirmed: true` para verificar; sin estas confirmaciones es Pending.
- `source_file`, `source_sheet`, `source_row`, `file_sha256`, `balance_header`,
  `original_cells` (las 14 columnas, texto/null), `reason`. Se conservan Gross anua
  USD, Net annual USD, Payout final REP y Final REP sin reinterpretarlos.
- Opcional `excel_checks`: lista de `{header,value,basis,periodicity,evidence}`;
  periodicity `annual` o `quarterly`, misma base que la expectativa. Devuelve
  original, normalizado, cálculo y diferencia. Base distinta se rechaza; los
  restantes resultados Excel continúan conservados aunque aún no comparables.

Este es un motor sobre **entradas ya revisadas**. No agrega un parser/upload XLSX
de comisiones ni certifica que un hash/metadato proporcionado coincide con un
archivo real. El adaptador que lo alimente debe conservar bytes en Storage
privado y entregar celdas completas; no ejecutar fórmulas ni macros. La evidencia
actual de origen son fixtures sintéticos, no una importación real acreditada.

## Contrato Revenue inspeccionado y clasificación

El contrato tiene 29 originales; `revenue_entries` preserva cada fila física,
`batch_id`, `import_row_id`, UUID de cuenta/custodio, mes y originales. Sólo
`Payout broker` está normalizado como `payout_broker_usd`. GROSS, TOTAL, Payout
Medina y NET Payout REP son textos originales, con semánticas distintas. No hay
Fee type, Owner Name payout ni fecha de cobranza confirmada en este contrato.
`PAGO OK`, Advisor Name y un nombre similar no acreditan esos conceptos.
La métrica general de Revenue continúa SUM(Payout broker); no se cambia.

`receipt`: `target_id` es el UUID del movimiento Revenue **publicado vigente**.
Exige `quarter` devengado acreditado (`period_evidence`), broker/owner/fee_type/base
revisados, `metric`, `source_value` literal, `amount` decimal normalizado,
`received_confirmed: true`, `evidence`, `normalization_evidence`, `reason`.
Métricas admitidas: Payout broker, GROSS, TOTAL, Payout Medina, NET Payout REP.
Para Payout broker se exige igualdad con el decimal publicado. Para los otros
campos, el operador acredita conversión y significado: no existe parser silencioso.
La evidencia debe acreditar cobranza y equivalencia económica, no sólo parecido
entre montos. Empresa y representante jamás son equivalentes por defecto.

El trimestre devengado puede diferir del mes Revenue si existe evidencia;
no se impone una fecha de caja que el contrato no contiene. Un movimiento sin
clasificar entra a la bandeja Pending con trimestre **provisional** por MES/AÑO,
no como cobro comparable. Tras clasificarlo y sin obligación asociada aparece
Missing expected. No se suman esos importes en totales comparables.

`reconcile`: `target_id` identifica obligación; `expected_id` fija la versión,
`receipt_ids` contiene UUIDs de **versiones de clasificación** (no tickets),
`review_complete` confirma revisión del conjunto y `reason` registra motivo.
Cuenta/custodio/trimestre/broker/fee/base/beneficiario deben coincidir exactamente.
Varias filas físicas, incluso idénticas, conservan UUID y multiplicidad.
Cada movimiento completo se asigna una sola vez, incluso entre obligaciones;
no hay división parcial automática. Transferir requiere primero una revisión
explícita con lista que lo libere. Una versión anterior no se reactiva en retry.

Lock transaccional del módulo serializa escrituras y la comprobación de reservas;
revisiones obsoletas fallan. Un error revierte todo el comando, sin efectos parciales.
Correcciones de bases/clasificación o reemplazos publicados de Revenue invalidan
las comparaciones afectadas: Pending hasta volver a revisar. La historia y las
reservas de la conciliación anterior permanecen hasta revisión/liberación explícita.

## Estados, consulta y cobertura

| Estado | Significado |
| --- | --- |
| Matched | Base verificada, revisión completa y suma comparable exactamente igual. |
| Variance | Mismas condiciones, diferencia nominal cuantificable distinta de cero. |
| Pending | Evidencia insuficiente, movimiento sin clasificar, sin revisión completa o versión obsoleta. |
| Missing expected | Cobro clasificado sin obligación asociada verificable. |
| Missing actual | Base verificada y revisión completa sin movimiento comparable; actual null, no cero. |

Missing actual no implica deuda ni pago pendiente al representante. Una obligación
con base no verificable vinculada a cobros se mantiene Pending para revisar.

`GET /api/comisiones` y `/comisiones` muestran filtros `year`, `quarter`, `broker`,
`account_id`, `owner`, `fee_type`, `status`, `min_absolute_variance`,
`min_absolute_percentage`. Los dos últimos son strings decimales y filtran por
magnitud; la diferencia mostrada conserva signo. RPC adicional `limit` 1–500 y
`offset`; bandeja página de 100. Filtros usan igualdad literal, sin nombres difusos.

Totales sólo Matched/Variance y separados por base bruta/neta/payout; porcentaje
agregado es diferencia total / esperado total, N/D si base cero. Sin comparables
no se emite cero ficticio. Cobertura incluye conteos de estados de **todo el
conjunto filtrado**, antes de paginar. Los pendientes sin clasificación no pueden
atribuirse a un broker/owner/fee: al aplicar esos filtros se excluyen y deben
revisarse también en la bandeja global. Un movimiento pendiente es una unidad de
cobertura diferente de una obligación: estos conteos no son porcentaje de cuentas.

Tablas privadas con RLS forzado; funciones con ejecutor NOLOGIN/NOBYPASSRLS,
search_path vacío y comprobación de sesión/admin. API, bandeja y consultas SQL
rechazan lectores/anónimos. Son análisis revisados con originales/preparación;
no se creó una publicación para lectores. No modifica Revenue, AUM ni dashboard.
La bandeja es de consulta: altas, clasificación y confirmación se hacen por API/RPC;
no se implementa un editor gráfico ni importador de comisiones en esta etapa.

## Supuestos todavía pendientes de confirmación

- Catálogo Fee type/Status, excepciones a /4, devengo, saldos negativos y elegibilidad.
- Política de corte para cada trimestre y existencia/cobertura de archivos históricos.
- Codificación real de tasas/porcentajes, separadores y precisión de celdas Excel.
- Qué base representa Balance × tasa y cuándo Gross/Net/final REP son comparables;
  reparto empresa/representante, componentes aditivos y asignaciones de beneficiarios.
- Campo/métrica Revenue que acredita cobranza por tipo/base y evidencia de fecha;
  no se confirma por el nombre del campo, PAGO OK ni por coincidir el importe.
- Criterio de completitud de cobros, movimientos tardíos, fraccionamiento entre
  obligaciones (hoy se rechaza), reversos, ajustes y tipos distintos por movimiento.
- Escala, modo de redondeo final y tolerancia económica. Hoy comparación exacta
  preliminar, sin liquidación ni presentación redondeada usada como base.
- Muestras privadas y conciliación contra originales; adaptador XLSX, archivo
  privado efectivo y publicación de una proyección para lectores si se solicita.

Documentación oficial consultada para implementación:
[PostgreSQL numeric](https://www.postgresql.org/docs/current/datatype-numeric.html),
[Supabase funciones](https://supabase.com/docs/guides/database/functions),
[seguridad de API](https://supabase.com/docs/guides/api/securing-your-api).

## Módulo visual y exportación — 2026-11-17

`/comisiones` integra cuatro vistas: Resumen, Por representante, Por cuenta y
Conciliaciones. Mantiene Radix Themes/Recharts, sin dependencias nuevas. Filtros
persistentes en URL, tablas de 25 filas ordenables (decimales comparados con
BigInt), detalle de beneficiario e histórico limitado a snapshots existentes.
Loading y sin permisos usan los límites existentes de App Router; error y vacío
son explícitos. No se generan importes de ejemplo en el runtime.

`public.commission_dashboard(filters)` reutiliza el reporte revisado en una única
foto SQL estable y devuelve filas, resumen por base, propietarios y trimestres.
Todos los importes se agregan con numeric y se transportan como strings. El total
esperado incluye bases verificadas; real/diferencias y denominador porcentual
incluyen sólo pares conciliados. Cuentas conciliadas son UUID distintos; casos
pendientes cuentan filas, incluidos faltantes. Totales conocidos no acreditan
completitud. Bruto, neto y payout jamás se suman entre sí. Si hay varios trimestres,
se indica que el KPI esperado suma los trimestres filtrados.

Balance por beneficiario sólo se muestra con una misma fecha/trimestre y una
fila de Balance por cuenta; varias fotos, bases ausentes o componentes repetidos
lo dejan N/D, conservando el detalle. La tasa muestra original y proporción anual.
Los gráficos convierten a Number exclusivamente para píxeles; tooltip/tablas/CSV
mantienen texto exacto. La evolución requiere dos trimestres comparables e
interrumpe la línea ante trimestres sin snapshots.

El reporte está acotado a 10.000 filas antes del filtro adicional de base; si
excede el límite falla explícitamente y pide acotar filtros, nunca trunca los
KPIs o el CSV. Paginación y orden se aplican en servidor sobre ese conjunto.
Ampliar con agregación/paginación SQL directa sólo al acreditar volumen mayor.

El detalle administrativo permite clasificar Revenue con beneficiario, métrica,
base y evidencia explícitos, o seleccionar movimientos compatibles y guardar una
revisión completa. Reutiliza `manage_commission`: control de versiones, actor,
motivo, UUID idempotente conservado ante reintento, mismo origen y permisos en
API/SQL. No resuelve homónimos por similitud ni crea historia comercial.

`GET /api/comisiones?dashboard=1` consulta el nuevo reporte; el GET anterior sigue
compatible. `formato=csv&vista=resumen|representantes|cuentas|conciliaciones`
exporta todo el conjunto filtrado, sin limitarse a la página. Incluye diferencias,
estados, IDs de versiones, procedencia de expectativas y Revenue conciliado,
evidencia y actor/fecha de revisión. Los resúmenes incorporan también el detalle
trazable. `revision` rechaza con 409 una exportación cuyo conjunto cambió desde la
pantalla. UTF-8 BOM, comillas/CRLF, decimales canónicos exactos y N/D; textos
peligrosos para CSV llevan apóstrofo, sin alterar los negativos numéricos.
Respuestas privadas/no-store. Los datos de comisiones siguen siendo análisis
administrativo revisado; lectores/anónimos no reciben originales ni exportaciones.

**Límite operativo pendiente:** no hay adaptador de carga Excel/Storage ni
preparación/publicación de un archivo completo de comisiones. Los eventos
`expected` revisados vía API no equivalen a publicar una importación Excel. No
presentar el QA sintético del motor como validación de los pasos 6–8 de ese flujo.
La proyección publicada para lectores requiere ese circuito y revisión separada.
