# Plan: importación histórica de AUM y comisiones esperadas

> Actualización vigente de comisiones (2026-11-17): ver [commissions.md](commissions.md).
> El nuevo pedido autoriza motor trimestral Balance × tasa anual /4 y conciliación
> local revisada. Supera para este motor las restricciones de sólo planificación
> y la fórmula ACT/365 anteriores; el helper aislado previo se conserva sin integrar.

Actualizado: 2026-11-17, Buenos Aires. El inventario inicial documenta el checkout
`main` en `4a25954`. El trabajo local posterior de AUM histórico se conserva sin
recrearlo: M1 está implementada y validada sintéticamente según `progress.md`.
La actualización vigente reemplaza la fórmula simplificada y autoriza únicamente
las partes de Advisory con reglas confirmadas. No se consultan ni modifican bases
remotas; no se usan datos financieros reales.

Implementación actual de esta actualización: motor bruto aislado
`src/lib/commissions/advisory.ts`, pruebas sintéticas y diseño actualizado.
No hay importador, tablas, publicación ni pantalla de comisiones implementados.
El módulo no se conecta al runtime ni persiste importes. Las secciones de esquema,
flujos, conciliación y UX son diseño para incrementos posteriores. No se autorizan
liquidación, pagos, bancos ni conexión directa con Addepar.

## 1. Inventario inicial (anterior a M1)

### 1.1 Documentación y evidencia

Se revisaron `AGENTS.md`, `docs/product.md`, `docs/decisions.md`, `docs/progress.md`, `docs/validation.md` y los contratos de `docs/imports.md`, `docs/data-dictionary.md`, `docs/aggregate-queries.md`, `docs/auth.md` y `docs/operations.md`; `docs/ui-ux.md` aporta el contexto de interfaz. Hay registros históricos superados: algunas cabeceras todavía dicen que no existe entorno remoto o administrador. Las entradas posteriores registran base compartida Preview/Production y alta admin. Esos registros son antecedentes, **no verificaciones remotas de esta etapa**. No hay evidencia nueva de conciliación de Excel real.

### 1.2 Inventario completo de migraciones

Se inspeccionaron las ocho migraciones SQL, en este orden; ninguna fue modificada ni ejecutada:

| Archivo en `supabase/migrations/` | Aporte y efecto vigente relevante |
| --- | --- |
| `20261111174240_financial_schema.sql` | Esquema `app_private`, 15 tablas iniciales, `month_start`, `exact_decimal` (`numeric` finito sin escala fija), cuentas/aliases, vigencias, alcances, lotes, originales, AUM, 29 originales Revenue, auditoría, triggers de inmutabilidad, publicación y vistas `aum_current`/`revenue_current`. |
| `20261111180338_auth_authorization.sql` | Perfiles/sesiones, RLS, vistas administrativas invoker, proyecciones y wrappers, ejecutor `NOLOGIN/NOBYPASSRLS`, bucket privado y políticas restrictivas contra sobrescritura/borrado. |
| `20261112143232_import_preparation.sql` | `preparation_only`, `begin_import`, `prepare_import_chunk`, cursores, configuración congelada y límites SQL; preparar no publica. |
| `20261114012532_account_resolution_publication.sql` | Revoca escrituras API directas de importaciones/hechos/aliases. Mueve preparación a funciones privadas del ejecutor. Añade `row_resolutions`, `fa_rows`, `review`, `import_cell`, `import_references`, `import_comparison`, `manage_import` y `advisor_at`; permite FA revisado, rechaza solapamientos y conserva lock común. Sustituye los guards/publicador iniciales. |
| `20261114015146_aggregate_queries.sql` | `aggregate_report`, agregación independiente por fuente/cuenta/mes, cobertura, filtros y paginación con revisión; proyección publicada segura para lector. |
| `20261114022000_dashboard_projection.sql` | Reemplaza el cuerpo de `aggregate_report`, conserva firma/permisos; agrega ranking, participaciones, opciones y fecha de publicación. |
| `20261115174622_accounts_administration.sql` | Bajas lógicas, motivo de auditoría, `model_reviews` (18 tablas privadas en total), `account_months`, directorio/detalle y administración preview/save. Protege cuentas/aliases exclusivos de preparación; permite identidad acreditada en historia publicada reemplazada. |
| `20261115190934_import_retry_after_preparation.sql` | Retry de carga compara convenciones originales excluyendo `configuration` añadida; no duplica lote tras preparar/publicar. Retira membresía temporal del operador al ejecutor. |

`supabase/migrations/README.md` explica el operador administrado sin SUPERUSER y el permiso temporal necesario al cambiar funciones propiedad del ejecutor. Las futuras migraciones deben ser nuevas, creadas por CLI según su help vigente, y conservar propietarios, grants y retirada del permiso temporal; no reescribir estas ocho.

### 1.3 Flujo real XLSX/CSV → publicación

| Paso | Implementación comprobada |
| --- | --- |
| Contrato | `src/lib/imports/contracts.ts`: `Source = aum/revenue/fa`, headers 6/29/7, `Options` exige un `period`, custodio, hoja, formato y delimitador. Períodos seleccionables 1900–2200. |
| Carga | `src/components/import-preparation.tsx` y `src/app/api/importaciones/route.ts`: multipart acotado, admin/origen, custodio/código contrastados en base, hash de bytes; `begin_import` asigna versión bajo lock. Después sube objeto sin upsert; si ya existe verifica hash. Storage y SQL no comparten transacción. |
| Lectura | `src/lib/imports/read.ts::readBook`: `read-excel-file`, `csv-parse`, `fflate`, `saxen`. CSV UTF-8 textual y línea física inicial; XLSX conserva coordenadas, escalar OOXML como texto, tipos, fórmula/caché/estilo. Rechaza macros, DTD, ZIP inválido/excesivo, celdas combinadas y formatos `.xls/.xlsm/.xlsb`. No evalúa fórmulas. |
| Validación | `src/lib/imports/validate.ts::prepare`: una hoja; headers por posición con normalización solo de headers. Identificadores textuales exactos, sin rellenar ceros. Mes/año de cada fila AUM/Revenue debe coincidir con el mes elegido. Revenue valida `CUSTODIO` contra código declarado. Deriva solo AUM y Payout broker; fórmulas con caché utilizable generan advertencia, sin resultado bloquean. |
| Precisión | `src/lib/imports/decimal.ts`: conversión por strings, expansión textual de exponentes XLSX, suma mediante BigInt; 60 dígitos enteros/30 decimales de entrada, sin redondeo. Dinero no pasa por Number. |
| Preparación | `src/app/api/importaciones/[id]/route.ts`: descarga y verifica hash; relee y valida el libro por petición; persiste hasta 250 filas/~1 MiB mediante `prepare_import_chunk`. Cursor y configuración se confirman atómicamente. El navegador espera cada petición; no hay trabajador persistente. Estado final `needs_resolution` o `failed`, sin afectar punteros activos. |
| Identidad | `src/components/import-resolution.tsx`, `src/app/(workspace)/correspondencias/page.tsx`, `src/app/api/importaciones/[id]/gestion/route.ts` y `manage_import(resolve)`: selección explícita de UUID/custodio y evidencia por fila; cuenta nueva solo si el administrador la solicita. Registra aliases por fuente/header/custodio y `row_resolutions`. Sugerencias exactas no son unión automática entre fuentes. |
| Revisión | `manage_import(review)` exige todas las filas válidas y resueltas, alcance completo y puntero esperado. Materializa hechos y compara filas/valores/total contra preparación. Congela revisión con token, actor y versión activa esperada; promueve a `ready`. Una colisión AUM después de resolver aliases falla por unicidad. |
| Publicación | `manage_import(publish)` → `app_private.publish_import`: transacción de un alcance; lock asesor `71482026`, alcance/lote, control de puntero esperado y guards, estado publicado, nuevo puntero y auditoría. Retry activo idempotente; superseded derivado. Existe además entrada heredada `public.publish_import` vía `publish_authorized`, que deberá contemplarse al impedir bypass de publicación agrupada. |
| Corrección | Nueva importación completa del mismo alcance y comparación con la activa; no append ni UPDATE de hechos publicados. Recuperar una versión requiere reimportar como versión nueva. No hay clonación/restauración automática de versiones en UI. |

Límites efectivos: original 2 MiB, XLSX expandido 12 MiB/200 entradas ZIP, 10 hojas, 5.000 filas por hoja, 64 columnas, 4.096 caracteres por celda. SQL limita además preparación a 5.000 filas **por lote**. La inspección de gestión limita páginas a 0–200 de 25 filas. La carga masiva no se resuelve solo cambiando el selector de mes o subiendo un límite.

La API calcula filas y resúmenes desde el original en servidor. Las RPC son invocables directamente por un admin autenticado y reciben JSON preparado: no debe confundirse la ruta Next con una garantía SQL de que cualquier resumen recibido se recalculó desde Storage. Para la ampliación, validar en SQL consistencia, pertenencia y completitud del manifiesto, sin confiar en listas de lotes o totales enviados por el navegador.

### 1.4 Granularidad, reportes, FA y permisos

- `import_scopes`: clave única `(source, period, custodian_id)`; cada lote pertenece exactamente a ese alcance mediante FK compuesta. Un único `active_batch_id`; AUM único `(batch_id, account_id, period)` y FK de cuenta/custodio. Una cuenta pertenece a un custodio. No crear un alcance «histórico global» superpuesto.
- Revenue mantiene una fila por fila física de origen, todas las repeticiones legítimas y negativos. Solo `payout_broker_usd` está tipado; las otras 28 columnas originales, incluida información de pagos/payout, siguen siendo texto. El hash de fila es diagnóstico, no deduplicación.
- Los aliases resueltos son únicos por `(source, namespace, custodian_id, value_normalized)`; normalización actual = identidad exacta. AUM usa namespaces `Holding Account Number` y `Account Number bd_REV`; Revenue `ACCOUNT`; FA `ACC # Addepar` y `ACCOUNT`.
- FA materializa `fa_rows` versionados con columna comercial elegida y vigencia explícita `[desde,hasta)`. No crea cliente/equipo por nombre; `OLD Owner Name payout` no crea historia. `advisor_at` aplica FA activo o asignación manual al último día del mes, sin solapamientos.
- `aggregate_report` y `account_months` agregan AUM/Revenue por separado antes de relacionar. Rango: AUM de último mes seleccionado, Revenue sumado. FULL JOIN conserva solo-fuentes; ausencias son null/N/D, sin arrastre. Comercial/equipo por cierre mensual; cliente/servicio proceden del estado de `accounts`, sin historia propia.
- `src/lib/queries/server.ts`, `contracts.ts`, `presentation.ts`, `src/app/api/consultas/route.ts`, `src/components/report-screen.tsx`, `summary-overview.tsx`, `commercial-overview.tsx` y `account-screen.tsx` consumen esa capa. Numeric viaja como texto; Number del gráfico sirve solo para coordenadas. Consultas hasta 120 meses, páginas hasta 250; CSV completo hasta 10.000 filas, revisión común y protección de fórmulas textuales. Importar más de diez años no implica que una consulta pueda abarcar toda esa historia en un solo rango.
- `src/lib/auth/access.ts`, `src/lib/imports/server.ts`, `src/proxy.ts` y migraciones 2/4/7 protegen servidor, RPC, tablas y Storage. Perfil habilitado y sesión vigente en `auth.sessions`; roles admin/reader, sin autoasignación ni autorización por user_metadata. Runtime usa JWT de usuario y clave publicable, sin service_role.
- Lector: proyecciones publicadas sin preparación, auditoría privada ni payload original/archivo. Admin: prepara/resuelve/revisa/publica/corrige. Tablas privadas con RLS forzado; wrappers invoker y ejecutor acotado sin BYPASSRLS ni propiedad de tablas. Descarga `src/app/api/fuentes/[id]/route.ts` mediante `source_file`, solo admin, autenticada y sin URL firmada. Bucket sin upsert/delete por API.

Evidencia existente reutilizable: `tests/imports.test.ts`, `tests/database/{schema,auth,imports,publication,queries,accounts,managed-migrations}.test.sql`, `publication-concurrency.sql`, `concurrency.sql`, `scripts/test-{auth-http,import-workflow,dashboard}.mjs`, `scripts/test-database.sh`, `scripts/benchmark-imports.ts` y generador sintético `tests/fixtures/imports/build.ts`. Se inspeccionaron contratos/casos relevantes; **no se reejecutaron suites en esta etapa documental**. Los resultados de `validation.md` pertenecen a sus fechas y entornos.

## 2. Arquitectura propuesta y reutilización

Extender el circuito existente, con una operación padre de archivo y lotes hijos normales:

```text
Original privado + operación de carga
  → lectura/validación existente, con detección de períodos
  → manifiesto fijo de particiones por fuente/período/custodio
  → lotes existentes + import_rows + correspondencias acreditadas
  → revisión de todos los hijos y comparación con cada versión activa
  → una RPC / una transacción publica el conjunto completo
  → mismas vistas activas y reportes para AUM
```

Comisiones añade una fuente y hechos propios al mismo circuito; usa una proyección trimestral específica porque su semántica no es AUM ni Revenue. No crear un segundo parser, otro bucket, otro sistema de roles, un motor genérico de ETL o tablas duplicadas de cuentas/custodios.

| Reutilizar | Extender/agregar |
| --- | --- |
| Lector XLSX/CSV, originales/coordenadas/metadatos, validadores numéricos, hash y Storage privado | Opciones discriminadas: mes único actual, historia AUM por fila y comisiones con período aplicable explícito; parserVersion nuevo, compatible con lotes anteriores. |
| Scopes/batches/rows, cursores, resoluciones, evidencia, revisión y publicador interno | Operación padre, manifiesto, revisión y publicación conjunta, bloqueo de publicación individual de sus hijos. |
| UUID/aliases por fuente/namespace/custodio y sugerencias existentes | Fuente `commissions`, namespace `ACCOUNT`; confirmación masiva revisable de referencias exactas ya acreditadas, sin reglas de coincidencia por nombre. |
| `exact_decimal`, auditoría, guards, ejecutor/RLS y formato decimal | Hechos de comisiones, beneficiarios independientes, cálculo exacto y política financiera versionada de conciliación cuando se apruebe. |
| Componentes de etapas/tablas/estados, filtros UUID, paginación y exportación segura | Resumen de archivo por mes/custodio; módulo de comisiones con esperado/comparable/no clasificado y cobertura trimestral. |

## 3. Cambios de esquema y migraciones necesarias

Objetos de comisiones **propuestos**, no SQL disponible. M1 ya existe localmente en `20261117133211_historical_aum_uploads.sql`; conservar las nueve migraciones y compatibilidad mensual/histórica. El inventario de ocho de la sección 1 es antecedente de la planificación inicial.

### M1 — Operación de archivo y atomicidad multiperíodo

- Nueva `app_private.import_uploads`: UUID, clave de solicitud única, fuente, bucket/path, nombre/hash/tamaño originales, actor/fecha, estado, configuración de selección/convenciones/parserVersion, manifiesto, errores globales, revisión y publicación. Metadatos de archivo y manifiesto congelados al confirmar preparación. RLS forzado, auditoría y prohibición de borrado; escritura solo por ejecutor con admin vigente.
- `import_batches.upload_id` nullable con FK restrictiva; unique parcial `(upload_id, scope_id)` para un hijo por alcance. Lotes anteriores quedan standalone, sin inventar agrupaciones por hash. Mantener metadatos de archivo actuales en hijos por compatibilidad, contrastados contra el padre; todos referencian **el mismo objeto inmutable**, sin copiar bytes por mes.
- Manifiesto por partición: fuente/período/custodio, hijo, hojas, número de filas, valores presentes, total decimal de control y huella de coordenadas; global: filas válidas, erróneas/no enrutables, vacías y hojas elegidas/excluidas con motivo. Conservar errores y coordenadas de filas no enrutables en la operación, accesibles al admin junto al original; no asignarlas a un mes ficticio.
- Rechazar coordenadas repetidas `(upload_id, sheet_name, row_number)` entre hijos mediante validación bajo lock del padre (o constraint auxiliar si lo exige la implementación); la unicidad actual por batch no alcanza. Antes de review comprobar igualdad del conjunto de coordenadas preparado con el manifiesto congelado, no solo suma de totales. No se elimina una partición fallida para poder publicar las otras.
- Operaciones acotadas de inicio/preparación/revisión/publicación del padre con wrappers invoker y ejecutor existente. Conservar RPC mensuales standalone. Los guards y **todas** las entradas a publicación (`manage_import`, `public.publish_import`/`publish_authorized`, publicador interno) deben impedir publicar un hijo por separado. La autorización del publicador conjunto debe derivar de revisión persistida y locks, no de un flag JSON/GUC controlable por el cliente.
- Índice de hijos por upload y listado reciente del padre; mantener índices actuales de scopes/hechos. No cambiar `aum_monthly`, su unicidad ni sus FK.

### M2 — Comisiones en el mismo importador

- Ampliar checks de fuente en `import_scopes` y `account_identifiers`; `import_batches` ya hereda fuente por FK. Añadir `commissions` a contratos TS y ramas SQL explícitas. Hoy hay `else` que tratan cualquier fuente no-AUM/Revenue como FA: revisar `import_references`, inspect, review, `guard_batch`, `import_comparison` y publicación para rechazar fuentes desconocidas y materializar cada fuente expresamente.
- Propuesta de alcance de comisiones: `(commissions, quarter_start, custodian_id)`, usando el `period` mensual existente para el primer día de enero/abril/julio/octubre. Constraint adicional para esa fuente en scopes; FK conserva la coherencia del lote. **Es una propuesta de snapshot trimestral completo**, pendiente de confirmar cobertura de las entregas. No usar el mes de fecha de saldo como trimestre aplicable implícito.
- Añadir `commission_periods`, `commission_snapshots`, `commission_beneficiaries` y una resolución de beneficiario separada de `row_resolutions.advisor_id`. Definición en sección 5. Conservar resolución de cuenta existente. Vista privada invoker `commissions_current` por puntero activo y nuevas proyecciones seguras.
- Extender guards para un hecho por fila, conteos/totales/ausencias correspondientes a comisiones, inmutabilidad y consistencia de cuenta/custodio/período/fila/lote. No almacenar suma de tasas ni usar `metric_total_usd` para porcentajes: su métrica propuesta será esperado trimestral solo cuando la regla esté aprobada; `totals` mantiene por separado saldo de origen, base acreditada, bruto, ajustes, final y cobertura como cadenas. Antes de aprobación: total de esperado N/D.
- Nuevas políticas/grants mínimos para hechos, beneficiarios/resoluciones y vistas; lector solo proyecciones de publicados. Ajustar visibilidad de cuentas/aliases para cuentas que tengan **solo comisiones publicadas**, sin exponer entidades exclusivas de preparación ni payloads. Revisar `account_detail`/catálogos sin introducir comisiones dentro de AUM/Revenue.

### M2b — Políticas, movimientos y revisiones de cálculo

- Reutilizar lotes, filas, cuentas, custodios y beneficiarios de M2. No crear una
  tabla `commission_rows` adicional a `commission_snapshots`: `import_rows` ya
  conserva cada fila física. Los movimientos usan el mismo circuito de originales
  y publicación; el Excel de 14 columnas no contiene esos movimientos.
- Añadir `commission_flows` y `commission_calculations` según sección 5 con `exact_decimal`/NUMERIC finito,
  referencias restrictivas, RLS forzado, auditoría e inmutabilidad. Las tasas y
  saldos históricos no se actualizan in situ. Borradores incompletos permanecen
  privados; lectores solo acceden a proyección publicada sin originales.
- Cálculo inicial permite bruto ACT/365 y estados pendientes. Una política de
  prorrateo no confirmada nunca habilita final automático. Política versionada:
  tasa aplicable y su base, inclusión de fechas, días restantes, denominador,
  tratamiento de fees, moneda y redondeo. No incorporar conversión cambiaria.
- Confirmación/recalculo transaccional por cuenta/período: lock ordenado por
  alcance, revisión de dependencias activa esperada y clave idempotente única
  `(calculation_scope, input_revision, formula_version, policy_version)`.
  Un puntero activo por alcance; carreras con revisión vieja fallan; reintentos
  devuelven la misma revisión. Correcciones conservan cálculo y dependencias previos.
- Identidad económica de flujo acreditada por fuente/namespace/ID original y
  revisión; coordenada única protege retry de una fila, no detecta por sí sola
  reimportación en otro archivo. Si no hay ID estable, revisar correspondencia
  explícita antes de sumar. Nunca deduplicar por importe/fecha/contenido.
  Clave única `(calculation_id, flow_revision_id)` impide doble uso dentro del
  cálculo. Compartirlo entre componentes exige reparto aprobado con suma conservada.

### M3 — Conciliación reproducible, después de definiciones financieras

- Configuración versionada/inmutable de conciliación: métrica Revenue elegida, filtros de Fee type/Status y clase Revenue, moneda/base, correspondencias de beneficiario, período devengado/cobrado, ajustes, tolerancia/redondeo y versión de fórmula. Puede empezar como configuración congelada de una ejecución; no necesita un motor genérico de reglas.
- `commission_reconciliations`: UUID, trimestre/custodio, creador/fecha, configuración y versión, lotes exactos usados de comisiones y Revenue, estado de cobertura y resultados por clave de comparación. Detalle hijo con importes exactos/conteos/estado y trazabilidad a líneas de comisiones y filas Revenue; referencias restrictivas e inmutabilidad una vez confirmado. Justificación: conservar qué se comparó aunque una corrección publique versiones nuevas.
- Si hay clasificación/asignación manual de Revenue, conservarla versionada y auditada por `revenue_entry_id`, sin modificar `revenue_entries`. Un registro no se puede imputar íntegro a más de un destino en una ejecución; si se aprueba reparto, pesos/importes exactos y suma conservada. La clasificación de una versión Revenue no se copia a otra por ticket/hash sin evidencia.
- RPC de consulta trimestral y confirmación de ejecución, políticas y grants del ejecutor. Resultados actuales pueden calcularse al consultar; solo una conciliación confirmada necesita persistencia. Una corrección crea otra ejecución, sin sobrescribir la anterior; mostrar si cambiaron sus lotes respecto de los activos.

No se propone cambiar tablas de AUM/Revenue para añadir una tasa actual a la cuenta ni una columna «cobrado» calculada sin clasificación. Tampoco agregar índices de todas las combinaciones: evaluar planes y volumen en la fase de capacidad.

## 4. Estrategia de archivos AUM multiperíodo (diseño base de M1)

### Contrato inicial

Primera entrega: formato largo actual de seis columnas, una hoja seleccionada con varias filas `mes/año` y un custodio **declarado** para toda esa hoja. No requiere inventar otro formato. Validar mes 1–12, año 1900–2200 y formar fecha del primer día; nunca sustituirlo por mes de carga, nombre del archivo o último período disponible. Si los originales usan columnas anchas por mes o hojas con encabezados diferentes, requieren muestra privada y contrato explícito antes de soportarlos.

AUM no tiene columna custodio: no derivarlo de `Top Level Holding Account`, números de cuenta o nombre de hoja. Si una hoja mezcla custodios sin marcador acreditado no es publicable; pedir separación identificable en el origen. Extensión posterior a varias hojas: mapa explícito hoja→custodio, headers por hoja, todas las hojas de datos seleccionadas contabilizadas; nombres de hojas no acreditan custodio ni período. No es requisito inicial agregar Revenue/FA multiperíodo, aunque el padre permita esa ampliación después.

### Preparación, identidad y revisión

1. Registrar operación y original privado una sola vez; recuperar de un fallo Storage con la misma solicitud/hash/opciones. Antes de habilitar preparación confirmar objeto/hash; un registro SQL sin objeto no es carga completa.
2. Leer y validar el contenido seleccionado completo; fijar selección y convenciones. Detectar todas las particiones antes de publicar. Filas con mes inválido quedan como errores globales, nunca descartadas. Resumir hojas no elegidas y pedir confirmación explícita de selección; no tratar una partición con errores como una hoja excluible.
3. Crear hijos para meses presentes, por fuente/custodio/mes; cada fila va a un único hijo con coordenada original y `cell_metadata.period` real. Conservar el original completo para cada hijo, pero su preparación contiene exclusivamente las filas de su alcance.
4. Cambiar claves de detección AUM a **custodio + mes + namespace + referencia**; actualmente el índice de validación usa solo referencia porque la hoja es de un mes. Misma cuenta enero/febrero es válida; dos filas enero son conflicto, también entre hojas/chunks. Una vez resueltas, validar cuenta UUID/mes entre todos los hijos aplicables. No sumar ni elegir arbitrariamente la última fila.
5. Reutilizar aliases AUM acreditados con coincidencia textual exacta en ambos namespaces y mismo custodio. Para volumen histórico, proponer confirmación conjunta de referencias inequívocas, con conteo/UUID/evidencia y resultados por fila. Si dos referencias apuntan a distintas UUID, bloquear. Cuentas nuevas y vínculos entre fuentes requieren evidencia explícita; no crear una UUID por cada repetición mensual.
6. Resumen por mes/custodio: filas, UUID distintas, valores presentes/faltantes, total AUM de ese mes, errores, sin asignación, versión candidata/activa y omisiones de cuentas respecto a activa. Un total aritmético de filas de varios meses sirve, a lo sumo, como checksum interno, **nunca como AUM de la historia**.
7. Confirmar completitud y reemplazo de cada alcance. Si el archivo trae solo algunas cuentas de un mes con versión activa, bloquear hasta obtener foto completa revisada. No mezclar silenciosamente con el snapshot activo ni agregar append de cuentas. Meses/custodios ausentes no generan hijos vacíos ni se borran; los meses faltantes siguen siendo faltantes en reportes.

### Publicación conjunta y correcciones

La revisión del padre guarda lista inmutable de hijos y tokens, manifiesto, punteros esperados (incluido null), huella de resoluciones/modelo relevante, actor, motivo y comparaciones. Cambios de aliases, vigencias o reglas que alteren la revisión la invalidan; el token de lote actual solo protege directamente su puntero, por lo que no basta reutilizarlo sin esta ampliación.

Una llamada SQL verifica admin/sesión, toma lock común existente, padre, scopes ordenados por clave estable y lotes ordenados, verifica completitud y todos los punteros, y publica todos los hijos con el publicador compartido dentro de **la misma transacción**. Cualquier error revierte estados, hechos que se materialicen en esa llamada, punteros y auditoría de publicación de todos los hijos. Preparaciones/resoluciones anteriores pueden permanecer privadas; no equivalen a publicación parcial.

Retry de una operación ya publicada devuelve su resultado sin nuevas versiones/eventos, aunque posteriormente alguno de sus hijos haya sido reemplazado; informa esa situación y no reactiva el hijo histórico. El estado histórico «publicada» del padre es distinto de la vigencia actual de cada hijo. Una corrección posterior puede reemplazar solo un mes/custodio mediante nueva operación completa de ese alcance; no obliga a republicar toda la historia ni cambia los demás. Recuperar requiere nueva versión revisada con referencias al origen recuperado, no mover punteros hacia atrás.

### Capacidad masiva

Separar soporte multiperíodo de capacidad ilimitada. Conservar límites actuales hasta medir cuentas×meses, bytes, estilos/celdas vacías y memoria. La evidencia histórica de `progress.md` reporta pico sintético de ~530 MiB; no acredita hosting ni capacidad real. Releer todo el libro por cada chunk multiplica trabajo con la historia.

Para archivos que excedan límites, la fase de capacidad debe preceder a su admisión: ampliar **el mismo** lector/procesamiento a avance persistido y validaciones globales en staging, con checkpoint, exclusión de workers concurrentes, reintentos y presupuesto de memoria/tiempo. Decidir ejecución por peticiones reanudables o worker durable solo tras medir; nunca fire-and-forget ni prometer procesamiento tras cerrar navegador con el circuito actual. Alinear límites de upload, ZIP, lectura, SQL por lote/archivo, inspección, Storage y hosting; conservar topes contra abuso. No dividir un mismo snapshot en publicaciones parciales para sortear el límite.

## 5. Modelo de comisiones e historia

### 5.1 Contrato y semántica de columnas

Preservar las 14 columnas completas en `import_rows.original_cells`, headers por posición y bytes originales. No interpretar una columna desconocida por similitud.

| Header recibido | Tratamiento propuesto |
| --- | --- |
| `Broker` | Referencia original. No asumir custodio ni comercial; requerir mapeo acreditado si se usará para particionar. |
| `ACCOUNT` | Identificador textual; resolución por fuente `commissions`, namespace `ACCOUNT`, custodio explícito. |
| `IP`, `IP Des`, `NAME` | Texto original; no identidad de cuenta/beneficiario por nombre ni reglas financieras inferidas. |
| `Owner Name payout` | Referencia del beneficiario según el pedido; conservar texto y resolver explícitamente si se agrupa por persona. No implica comercial FA. |
| `Fee type` | Original; falta catálogo y qué tipos entran en la fórmula/conciliación. |
| `Adv Fee / Retro` | Tasa siempre anual según regla confirmada; no confundir periodicidad con codificación. Original + decimal normalizado en proporción cuando se confirme unidad. |
| `Status` | Original; falta definir elegibilidad. No excluir filas por un texto supuesto. |
| `Balance as 30 Sep of 30 Sep` (ejemplo) | Una columna de saldo elegida expresamente y fecha de saldo confirmada; preservar header literal. Falta año: el ejemplo no permite deducirlo. No tomar el primer header que empiece con Balance ni derivar trimestre automáticamente. |
| `Gross anua USD`, `Net annual USD` | Originales; candidatos para controles cuando se confirme su base, sin sustituir fórmula por nombre. |
| `Payout final REP`, `Final REP` | Originales; no se sabe si son tasas, importes o etiquetas ni qué pasos de payout representan. |

El header variable de saldo se registra en un mapeo revisado hacia `source_balance_usd`, junto a fecha explícita y convención numérica. Varias columnas Balance, headers duplicados o fecha contradictoria bloquean hasta selección inequívoca. La selección no destruye las demás columnas.

### 5.2 Hechos propuestos

`commission_periods`: UUID, inicio/fin explícitos, días computados, convención
`ACT/365-fixed`, versión y evidencia de calendario/conteo. El divisor es **365
incluso en año bisiesto**. Propuesta de representación `[inicio, fin_exclusivo)`:
el último día incluido queda visible; requiere aprobación de inclusión de extremos
antes de derivar días automáticamente. No inferir trimestre desde el corte del saldo.

`commission_snapshots`: reemplaza la propuesta anterior `commission_rows`, sin
crear ambas. Una fila por registro físico, `id`, `batch_id`, `import_row_id` único,
cuenta UUID/custodio por FK compuestas existentes, `commission_period_id`,
beneficiario nullable con estado pendiente, tipo/componente y elegibilidad.
Conservar `source_balance_usd`, original y `balance_as_of` independientes de
`assets_billed_on_usd`: esta última base solo existe tras confirmación semántica
con evidencia, actor y fecha. Nunca tomar AUM como sustituto.
`annual_rate` exacta y original; `0.01` = 1% internamente, con unidad de entrada
obligatoria. Preservar las 14 columnas en `import_rows`, bytes y coordenadas.
Fee bruto reproducible referenciado a la revisión de cálculo; no duplicar un
campo editable en snapshot y cálculo. Vista del snapshot puede exponerlo.

`commission_flows`: UUID/revisión, cuenta/custodio, período, fecha efectiva, tipo
(depósito/retiro/fee de cuenta), importe original y normalizado, moneda, signo
según convención explícita, días restantes, `applicable_rate` y su base/unidad,
política/versión, fuente/evidencia y revisión reemplazada. Ajuste exacto nullable
si falta política. Una tabla tipada conserva los tres movimientos, sin tres tablas
redundantes. Cuenta/período/fecha y moneda deben ser coherentes; no convertir
fees en retiros automáticamente. No reconstruir flujos desde variación de AUM.

`commission_calculations`: UUID, alcance de cuenta/período/custodio y componentes
aprobados, `input_revision`, snapshots/flujos exactos referenciados, política y
fórmula versionadas, fecha/actor, bruto, total ajustes nullable, final nullable,
convención/escala de redondeo y estado de completitud con todos los motivos.
Guardar también las fracciones exactas de divisiones periódicas, o expresión e
inputs exactos para recomputar antes del único redondeo; un NUMERIC intermedio
redondeado por división no basta para garantizar exactitud en todos los límites.
Dependencias y resultados confirmados inmutables. Recalcular crea una revisión
nueva, no UPDATE del cálculo anterior. No confundir revisión de datos con versión
de fórmula ni con versión de archivo.

`commission_beneficiaries`: UUID, etiqueta y metadatos auditados; no unique por nombre. Resolución por fila con UUID/evidencia/actor y mismo guard de lote publicado. Reutilizar mecánica de resolución/auditoría sin introducir al beneficiario en `commercial_advisors` por inferencia; si el negocio demuestra equivalencia, registrar vínculo explícito, no fusión de entidades. Permitir conservación de referencia sin resolver, mostrando cobertura; la conciliación por beneficiario queda pendiente en esos casos.

**Cardinalidad pendiente:** no imponer unique por cuenta/trimestre; pueden existir varios Fee type, beneficiarios o componentes. Tampoco sumar todas las líneas como si fueran independientes: pueden repetir el saldo completo o representar repartos alternativos. Conservar líneas físicas; una repetición/componente ambiguo bloquea su publicación financiera hasta aclarar aditividad/clave. No deduplicar automáticamente por contenido. El criterio de unicidad económica se definirá con la muestra y el dueño; `import_row_id` único protege procedencia, no resuelve esta decisión.

### 5.3 Dos historias distintas

1. **Aplicabilidad de negocio:** trimestre explícito al que corresponde la estimación y fecha del saldo del Excel. Una fecha de observación no demuestra vigencia de una tasa. Para MVP, snapshot completo por trimestre/custodio, no tabla de tasa actual de cuenta con arrastre automático.
2. **Historia de correcciones:** distintas versiones del mismo alcance con publicación, responsable, originales y auditoría. Solo la versión activa entra en consulta actual; versiones reemplazadas siguen explicando conciliaciones anteriores.

Si solo aparece un Excel actual, importar exclusivamente su alcance acreditado. Años previos muestran **sin tasa/saldo histórico acreditado**, aunque existan AUM y Revenue: no aplicar tasa actual al AUM pasado ni al saldo actual para reconstruir comisiones antiguas. No clonar cuatro trimestres con una única foto salvo declaración explícita y evidencia del negocio para cada alcance.

Si aparecen archivos anteriores, cargar sus snapshots por el mismo circuito y conservar fecha de observación/aplicabilidad de cada uno. Si se confirma un contrato de tasas con vigencias en vez de snapshots, evaluar entonces entidad de condiciones contractuales con `[desde,hasta)`, evidencia y exclusión de solapamientos por cuenta/componente/beneficiario; seguirá faltando la base de saldo propia de cada estimación. No implementar ese segundo modelo sin necesidad demostrada ni inventar prorrateos dentro del trimestre.

## 6. Cálculo esperado y conciliación trimestral

### 6.1 Advisory confirmado y política pendiente

```text
gross_fee = assets_billed_on × annual_rate × period_days / 365
gross_flow = deposits − withdrawals
net_flow = deposits − withdrawals − account_fees
proration_adjustment = flow_amount × applicable_rate × remaining_days / total_period_days
final_fee = ROUND(gross_fee + SUM(proration_adjustments), rounding_policy)
```

Las tasas Addepar son **anuales**. Se elimina la división directa por cuatro.
Ejemplo sintético: USD 1.000.000 × 0.01 × 90/365 → bruto mostrado USD 2.465,75;
91 días → 2.493,15; 92 días → 2.520,55. En año bisiesto el numerador usa los días
reales del período y el divisor continúa en 365. La base Assets Billed On debe
estar acreditada: Balance del Excel solo puede utilizarse tras confirmar esa
equivalencia, con corte y período explícitos. Tasa anual confirmada no acredita
unidad de celda, elegibilidad, tasa histórica, reparto ni base neta del beneficiario.

**Prorrateo bloqueado:** `applicable_rate` NO equivale automáticamente a
`annual_rate`. Falta decidir si es tasa anual convertida al período u otra tasa
Addepar; también extremos de días restantes, signo y tratamiento de fees de cuenta,
base bruta/neta y relación de flujos con el saldo ya facturado. No sumar flujo
individual más gross_flow/net_flow: estos dos son resúmenes alternativos para
explicación, no otros movimientos. Confirmar que el saldo inicial no incluye ya
un ajuste, evitando cobrar dos veces el mismo flujo. Conservar toda evidencia.

Aritmética exacta: entradas decimales canónicas como strings, fracciones BigInt
para división por 365 en el motor aislado, sin dinero por Number ni floats.
`calculateGrossAdvisory` acepta días explícitos, sin inferir calendario. Devuelve
fracción exacta y `grossFeeDisplay` de presentación; **nunca finalFee**. Redondeo
de presentación requiere escala explícita (0–30), modo half-away-from-zero como
opción técnica documentada, no regla financiera aprobada por defecto. No usar ese
bruto mostrado como entrada al final. Final futuro: sumar bruto y todos los
ajustes exactos **por cuenta** antes de redondear una única vez; escala/modo deben
aprobarse y congelarse en la política. No redondear al importar ni por flujo.

| Estado | Condición y valor permitido |
| --- | --- |
| `complete` / Completo | Base, tasa, calendario, elegibilidad, componentes y flujos validados; política aplicable confirmada, redondeo aprobado. Final visible como expectativa, nunca deuda automática. |
| `gross_only` / Solo bruto | Bruto conocido; falta evidencia de movimientos o certificación de su ausencia. Final N/D. |
| `pending_rate` / Tasa pendiente | Tasa histórica ausente/no confirmada. Bruto/final N/D. Cero confirmado sí es válido. |
| `pending_balance` / Base pendiente | Assets Billed On ausente/no acreditado aunque exista Balance o AUM. Bruto/final N/D. |
| `pending_flows` / Flujos pendientes | Entrega identificada incompleta o sin validar. Mostrar bruto si existe; final N/D. |
| `pending_convention` / Convención pendiente | Hay flujos pero falta política de prorrateo, o falta convención de período/redondeo. Final N/D. |

Guardar todos los motivos concurrentes: prioridad visual propuesta tasa → base →
convención → flujos → solo bruto → completo. Sin movimientos explícitamente
certificados, total ajustes exacto cero; no hace falta prorratear, pero sí período
y redondeo aprobados. Ausencia de filas NO certifica ausencia de movimientos.
El helper bruto solo emite pending_rate/pending_balance/gross_only y no evalúa
estos requisitos completos. No activar cálculo final ni prorrateo por esa vía.

### 6.2 Qué puede representar Revenue

| Campo real / columna SQL | Evidencia actual | Uso permitido en el plan |
| --- | --- | --- |
| `Payout broker` / `payout_broker_usd` | Métrica USD confirmada, tipada y sumada actualmente. | Mostrar Revenue registrado del trimestre. Su equivalencia con cobro de la comisión/beneficiario debe aprobarse; no todo Revenue tiene por qué ser advisory/retro. |
| `NET Payout REP` / `net_payout_rep_original` | Solo texto original; nombre sugiere nivel REP, sin semántica/tipo confirmados. | Candidato a investigar para neto del representante. No sustituir Payout broker global ni convertirlo sin convenio. |
| `Payout Medina`, `Payout Medina base`, `Final payout Medina %`, `% Payout REP` | Textos originales de diferentes bases/porcentajes desconocidos. | Solicitar definición de niveles de reparto y beneficiarios; no encadenar porcentajes automáticamente. |
| `GROSS`, `TOTAL`, `SERVICE CHARGE` | Textos; sin base/unidad confirmadas para esta conciliación. | Controles candidatos, no cobros acreditados. |
| `PAGO OK`, `IP PAYMENT` | Sin definición validada de pago, fecha o destinatario. | No certifican efectivo cobrado ni trimestre de cobro. |
| `DESCRIPTION`, `ASSET`, `B/S`, `IP`, `Advisor Name`, `ADV NAME SEC`, `Rel. 2nd`, `Nacho GMA` | Referencias conservadas; sin clasificador validado ni equivalencia de beneficiario. | Evidencia para clasificación futura explícita; no inferir por coincidencia parcial/nombre. |
| `MES`, `AÑO`, `CUSTODIO`, `ACCOUNT` | Período mensual y alcance ya validados/resueltos. | Agregar registros publicados por cuenta/custodio/mes; falta definir si MES/AÑO es devengamiento o cobro. |

El contrato Revenue no incluye una fecha de cobro inequívoca ni un `Owner Name payout` confirmado. Sin evidencia adicional, el módulo puede comparar **expectativas con Revenue registrado**, pero no certificar «cobrado», «impago» o «deuda».

### 6.3 Grano y algoritmo propuesto

1. Confirmar calendario (propuesta: Q1 ene–mar, Q2 abr–jun, Q3 jul–sep, Q4 oct–dic), trimestre aplicable del snapshot, período de Revenue y tratamiento de cobros tardíos/ajustes. No decidir que saldo al 30/9 corresponde al trimestre siguiente o al que termina ese día.
2. Seleccionar únicamente versiones activas de comisiones para ese alcance y Revenue de los meses acordados. Conservar los IDs de todos los lotes y configuración de clasificación para reproducibilidad; lectura en un snapshot SQL coherente.
3. Agregar esperado por **cuenta + custodio + trimestre** solo con componentes aditivos acreditados. Agregar Revenue elegible independientemente al mismo grano. FULL JOIN conserva solo-esperado y solo-Revenue. No unir líneas de comisión con detalle Revenue y sumar después.
4. Inicialmente conciliar por cuenta si está aprobada la base comparable. Varias líneas/beneficiarios no autorizan repetir el total Revenue de la cuenta en cada línea. Para conciliar por beneficiario/componente debe existir clasificación inequívoca o reparto acordado; de otro modo mostrar esperado por beneficiario y real «sin atribución», sin diferencia individual.
5. Reportar Revenue comparable, excluido por regla explícita y pendiente de clasificar con conteos e importes/conocidos. Su partición debe conservar el total Revenue original y todas sus repeticiones/negativos. Ni tickets ni hash se usan como identidad económica para deduplicar.
6. Diferencia propuesta: `real_comparable − expected_final_fee` (signo visible). Diferencia porcentual: `(real_comparable − expected_final_fee) / expected_final_fee × 100`; cobertura opcional separada: `real_comparable / expected_final_fee × 100`, solo con base positiva, cobertura y clasificación suficientes; escala/modo de división y tolerancia explícitos. Base cero/nula, signos no interpretables o cobertura incompleta → porcentaje N/D. Un subtotal parcial no se presenta como diferencia final de cobranza.
7. Estados: pendiente de reglas/clasificación, esperado ausente, Revenue ausente/incompleto, comparable, dentro/fuera de tolerancia aprobada. «Dentro de tolerancia» no acredita cobro bancario. Publicación de los tres meses no acredita por sí sola que todas las cuentas tengan cobertura contractual.

La ausencia de Revenue para una cuenta no es cero. Solo podría interpretarse cero elegible tras certificar cobertura de ese alcance, ausencia de movimientos y clasificación según regla explícita; el flujo actual no publica archivos vacíos ni acredita esa certificación. No añadirla tácitamente para que cierre el reporte.

Interfaz propuesta `/comisiones`: trimestre/custodio/cuenta/beneficiario; bruto, ajustes y final separados, tasa anual, Assets Billed On, corte y días; detalle de depósitos/retiros/fees con fecha, días restantes, tasa aplicada, origen y versión. Estado de cálculo y motivos visibles; cobro real solo si la semántica está acreditada, Revenue comparable/no clasificado y diferencias USD/% cuando proceda. Desglose enlaza inputs, fracciones, política, revisión, único redondeo y correcciones anteriores; nunca presentar un subtotal incompleto como ingreso definitivo. Beneficiario es filtro independiente de comercial/equipo; FA no determina quién cobra. Lector accede a la proyección publicada aprobada, sin originales/preparados; admin ve procedencia y preparación. Reutilizar componentes visuales y exportación segura con el nuevo contrato, sin alterar la métrica global Revenue.

## 7. Riesgos y decisiones pendientes

| Riesgo | Control / decisión requerida |
| --- | --- |
| Historia AUM se rechaza o se detecta como duplicada | Parser por período real y claves de duplicado con mes; unicidad final por UUID. |
| Reemplazar foto completa por extracto parcial | Revisión de omisiones y confirmación por cada mes/custodio; bloquear entregas parciales. |
| Publicación parcial por loop HTTP o RPC heredada | Una transacción SQL de padre completo; bloquear publicación individual en todas las entradas. Fallo de cualquier hijo revierte todo. |
| Retry publica historia reemplazada o hash elimina ingresos legítimos | Idempotencia por solicitud/operación y alcance, estado histórico separado de vigencia; hash solo diagnóstico. |
| Cuenta igual en custodios distintos, ceros perdidos, aliases incompatibles | Texto exacto, namespaces por fuente y custodio acreditado; conflictos pendientes con evidencia. |
| `Broker` o nombre de persona se interpreta como custodio/comercial | Mapeo explícito; no equivale a una definición por coincidencia textual. |
| Precisión del XLSX, porcentajes visuales, división/redondeo | OOXML textual, proporción decimal con convención, numeric/strings; confirmar escala de porcentaje/cobro y conservar caché/original. |
| Cambios retroactivos de tasa/saldo/beneficiario | Snapshot por trimestre y versiones; no arrastre; nuevas conciliaciones conservan dependencias anteriores. |
| Doble conteo por varias comisiones o join con Revenue | Aditividad y clave económica confirmadas; agregar fuentes independientemente; real sin duplicación por beneficiario. |
| Cuadre aparente con base bruta contra neto REP | Acordar quién percibe Balance×tasa y qué campo Revenue es comparable; mantener no clasificado. |
| FA actual rellena historia | Mantener fechas explícitas y sin asignar; beneficiario separado. Cliente/servicio actuales no se presentan como historia acreditada. |
| Cambios de FA/modelo después de revisar | Invalidación de revisión si cambia salida relevante; historial de conciliación congela dependencias/resultado. |
| Aumento de volumen y locks largos | Benchmark sintético representativo, procesamiento reanudable, límites explícitos y medición de transacción conjunta; no bajar atomicidad para ocultar límites. |
| Filtración de datos/originales | RLS/grants/DTO explícito por rol, no-store, sin logs de filas, Storage privado; textos inertes y exportación protegida. |
| Preview escribe producción | Según decisiones posteriores comparten base. Probar localmente o en destino aislado autorizado; un Preview no es sandbox de datos. |
| Retención o limpieza destruye evidencia | Sin borrados automáticos; definir retención/backups y ensayar recuperación SQL + objetos privados. |

### Confirmaciones financieras que bloquean resultados reales

1. **Muestras/estructura AUM:** formato largo, hoja(s), custodio acreditado, meses/años y foto completa por alcance; cantidad máxima de filas/bytes. No se requieren para cerrar este plan, sí para validar capacidad/importación real.
2. **Base y unidad:** tasas anuales ya confirmadas. Falta codificación de `Adv Fee / Retro`, equivalencia Balance = Assets Billed On, base bruta/neta/payout, y significado/unidad de Gross/Net annual y campos REP. `/4` queda descartado.
3. **Fechas y flujos:** año/corte del saldo y trimestre aplicable, calendario y extremos incluidos; cambios dentro del período. Fórmula bruta ACT/365 confirmada; falta applicable_rate, cómo derivar días restantes, origen/cobertura de movimientos y tratamiento de fees/gross_flow/net_flow. No activar prorrateo final hasta confirmación.
4. **Cardinalidad:** varias filas por cuenta/beneficiario/tipo, saldo repetido, componentes aditivos o alternativos, duplicados y repartos. Necesario antes de aceptar un total agregado de comisiones.
5. **Elegibilidad:** significado de Status/Fee type, excepciones, ceros y ajustes negativos.
6. **Identidad:** custodio de ACCOUNT, significado de Broker e IP, correspondencias acreditadas; cómo identificar beneficiarios y si coinciden con algún comercial sin fusionarlos por nombre.
7. **Real comparable:** campo monetario Revenue, unidad/base, qué registros corresponden a estas comisiones, qué referencia acredita beneficiario, y tratamiento de cobros tardíos/reversiones/diferencias de período. ¿MES/AÑO describe devengamiento o cobro?
8. **Historia:** ¿existen Excels anteriores con tasas **y saldos**? ¿Desde cuándo se acredita cada condición? Mientras no existan, esperado histórico N/D.
9. **Conciliación:** escala y modo de redondeo único final por cuenta (momento confirmado), precisión de tasas, tolerancia absoluta/relativa y cobertura necesaria para llamar comparable a un trimestre. Diferencia contable no prueba deuda ni pago.

## 8. Plan incremental de implementación

Los incrementos de importación/publicación/UX siguientes requieren nueva solicitud; este pedido implementa solamente el motor bruto aislado y prepara su validación. Orden sugerido: AUM histórico puede avanzar con sintéticos mientras se aclaran las comisiones; la falta de tasa histórica no debe bloquear cargar AUM acreditado.

| Etapa | Resultado acotado | Condición de cierre |
| --- | --- | --- |
| 0. Plan original completado | Inventario, propuesta y preguntas documentadas. | Revisión documental y diff; sin SQL/código funcional. |
| 1. AUM multiperíodo local completado | M1, mismo lector, una hoja/un custodio, mes/año por fila, manifiesto, resolución y publicación conjunta. Flujo mensual anterior compatible. | Unitarias/SQL/HTTP sintéticas, rollback entre meses, bypass y carreras; ningún publicado cambia durante preparación. |
| 2. Capacidad histórica | Medir volumen representativo sintético; ampliar topes/procesamiento persistido solo donde haga falta. Varias hojas con mapa de custodios únicamente si las muestras lo requieren. | Ensayo de máximo aprobado, interrupción/retoma, memoria/tiempos y atomicidad dentro de límites; si no alcanza, rechazar con mensaje y dejar pendiente capacidad, sin declarar importada toda la historia. |
| 3. Comisiones: preparación | Contrato de headers/mapeo de Balance/fechas/unidades y M2; conservar originales, resolver cuenta/beneficiario, revisar componentes. | Pruebas sintéticas y decisiones mínimas registradas. Si falta base financiera, quedarse en preparación sin publicar esperado como confirmado. |
| 4. Esperado publicado | M2b, snapshots/flujos/cálculos versionados, bruto ACT/365 y política/elegibilidad aprobadas; estados y desglose en módulo de consulta. | Exactitud/ausencias/versionado; AUM distinto o ausente no altera esperado; sin reconstrucción histórica. |
| 5. Conciliación | Clasificación Revenue y base aprobadas, M3, consulta/ejecución reproducible y exportación. | Totales conservados, no duplicación, cobertura, tolerancias y corrección de versiones comprobadas. Si no hay mapping, mostrar pendiente, no cobros atribuidos. |
| 6. Validación operativa | Muestras privadas por administrador, conciliación contra archivos, permisos de servicios y recuperación. | Dueño confirma alcances/resultados; despliegue/aplicación remota autorizados por separado. Ningún fixture real en Git. |

Puntos de edición futura: contratos/lector/validador/API y componentes de importación mencionados; migraciones nuevas y pruebas; nueva proyección/módulo de comisiones y navegación `src/components/navigation.tsx`; contrato de reportes específico. Revisar `src/lib/model/contracts.ts`, políticas de cuentas y preview de administración para que cambios relevantes a beneficiarios/conciliación tengan revisión suficiente sin alterar AUM/Revenue. Actualizar diccionario/imports/producto/decisiones/progreso/validación con cada incremento.

## 9. Criterios de aceptación y pruebas propuestas

Todas las cifras/cuentas son sintéticas identificadas. Esta matriz conserva los criterios de aceptación del plan; los checks efectivamente ejecutados y pendientes de esta actualización se distinguen en la matriz específica posterior y en `validation.md`.

| Área | Casos mínimos y resultado esperado |
| --- | --- |
| Multiaño | Misma UUID en dic/2024, ene/2025 y ene/2026 se publica en tres scopes; mantiene meses originales, un valor por cuenta/mes; meses intermedios no se rellenan. |
| Duplicados AUM | Dos filas de un mismo mes, incluso con aliases distintos de la misma UUID o en hojas/chunks distintos, bloquean todo. Misma cuenta en meses diferentes pasa. No suma duplicados. |
| Manifiesto | Filas sin mes/año, custodio no acreditado, coordenada repetida o hijo/hoja omitido bloquean la operación; conjuntos/counts/totales por alcance coinciden. Una hoja de errores no se puede quitar de una operación ya fijada para publicar el resto. |
| Atomicidad | Inyectar fallo después de publicar el primer hijo: ningún puntero/estado/auditoría de publicación cambia. Un hijo failed o sin resolución impide todos. |
| Bypass/concurrencia | Intentar publicación individual por cada RPC heredada y llamadas directas; denegación. Dos archivos con scopes superpuestos, revisión obsoleta y cambios de modelo relevantes: una revisión desactualizada falla, sin mezcla parcial. Locks ordenados. |
| Reintentos | Repetir upload/chunk/review/publish tras pérdida de respuesta mantiene operación/hijos/conteos. Retry tras reemplazo posterior no reactiva historia ni duplica auditoría. Cambiar bytes/configuración con misma clave falla. |
| Corrección aislada | Sustituir ene/2025 de custodio A mantiene todos los otros meses y custodio B, conserva anterior inmutable; recuperación mediante versión nueva. Archivo vacío/mes ausente no borra. |
| Identidad | `00123` ≠ `123`; mismo número en dos custodios produce cuentas distintas; comisión ACCOUNT se enlaza a UUID existente solo con evidencia, incluso si coincide con Revenue. Identificador numérico/científico/calculado bloquea; no se inventan ceros. |
| Formatos | XLSX/CSV, orden de headers distinto, Balance variable y varias columnas, fechas sin año/ambiguas, fórmulas sin caché/error, ZIP/macros/DTD/celdas combinadas, UTF-8 y línea física CSV. Sin ejecución de fórmulas/conexiones. |
| Exactitud | `0.1 + 0.2 − 0.05 = 0.25`; casos ACT/365 de 90/91/92 días, incluido bisiesto; conservar fracción antes del redondeo final; grandes importes/decimales sin float; porcentaje texto/nativo con unidad explícita; ninguna reducción de escala no autorizada. |
| Saldo propio | Modificar o retirar AUM no cambia esperado. Saldo o tasa faltante → N/D; cero explícito conserva cero. Negativo se conserva y se trata según regla aprobada. |
| Historia de comisiones | Solo snapshot actual disponible: trimestres anteriores N/D pese a Revenue/AUM. Corrección de tasa/saldo/beneficiario crea versión nueva; ejecución previa conserva resultado/origen; no aplica retrospectivamente sin evidencia. |
| Cardinalidad | Varios beneficiarios/componentes: aditividad acordada y sin doble saldo ni doble real. Repetición ambigua bloquea, sin deduplicación silenciosa. Mismo nombre no fusiona beneficiarios/comerciales. |
| Revenue comparable | Dos filas idénticas legítimas y ajuste negativo permanecen. Elegible + excluido + sin clasificar conserva filas y total de Payout broker. Otra métrica confirmada no redefine el Revenue global. |
| Conciliación | Solo-esperado, solo-Revenue, meses sin publicar, importes ausentes, beneficiario no resuelto, cero/base negativa; diferencias/porcentajes solo según cobertura. Prueba de trimestre/año, cobro tardío y reglas de redondeo aprobadas. |
| Reproducibilidad | Cambiar un lote activo o clasificación genera nueva revisión/ejecución; la conciliación anterior sigue consultable con sus lotes/regla. Páginas/exportación no mezclan revisiones. |
| Seguridad | Anónimo, lector, admin, perfil deshabilitado/sesión vencida; HTTP y RPC directas, grants/RLS/Storage. Lector no ve uploads, preparados, originales, errores privados o nombres/path de archivo; cuentas solo-comisiones publicadas sí son visibles por proyección; cuentas solo-preparación no. |
| Capacidad/UX | Volumen acordado, límite y exceso, interrupción/retoma, worker concurrente si existe, publicación transaccional máxima, paginación de historial/filas; teclado/estados/navegador adaptable; error no muestra datos demo ni cero inventado. |
| Regresión | Ejemplo AUM 100→120 y Revenue 10+12 conserva cierre 120/flujo22 en resumen, cuentas y CSV. FA y permisos anteriores sin cambios; 120 meses/10.000 filas siguen explícitos mientras no se amplíen. |

Reutilizar runners existentes: unitarias del parser/contratos, `test:db` con PostgreSQL efímero y operador administrado, carreras con dos sesiones y fallos inyectados; `test:auth:http`/`test:dashboard` para Next→RPC→datos; benchmark separado. Ejecutar lint/typecheck/build cuando se implemente código. Validar servicios reales y Excel privado en una fase distinta, sin confundir contratos Auth/Storage sintéticos con servicios efectivos. Recuperación debe incluir SQL/datos/roles/ACL y bytes Storage; restaurar solo esquema no alcanza.

### Matriz preparada del motor y persistencia

| Caso sintético | Oráculo / condición de aceptación | Estado actual |
| --- | --- | --- |
| 90, 91, 92 días | Base 1.000.000, tasa 0.01 → bruto 2465.75 / 2493.15 / 2520.55 a 2 decimales. | Ejecutable en `tests/advisory.test.ts`. |
| Bisiesto | Q1 2024, 91 días explícitos, divisor 365; no 366. Conteo calendario requiere extremos aprobados. | Bruto ejecutable; calendario pendiente. |
| Tasa cero, base/tasa faltantes | Cero explícito válido; null nunca cero ni final. | Ejecutable. |
| Precisión/redondeo | >2^53 conserva centavos; ±1.005 → ±1.01 solo para presentación; conservar fracción original. | Ejecutable para bruto; final pendiente. |
| Depósito inicial/medio | Vector de laboratorio NO productivo: período 90 días, flujo 10000, applicable_rate explícita 0.0025, días restantes 90/45 → ajuste exacto 25 / 12.5. No deriva tasa anual. | Preparado; bloqueado hasta política. |
| Retiro y múltiples flujos | Con signos aprobados, retiro −4000, tasa 0.0025, días 45/90 → −5. Junto con depósito inicial 25 → ajustes 20. | Preparado; bloqueado hasta política. |
| Fee de cuenta/neto negativo | Depósitos 100, retiros 200, fees 5 → gross_flow −100, net_flow −105; conservar originales. Ajuste del fee queda N/D hasta decidir tratamiento. | Preparado; bloqueado hasta política. |
| Ausencias y convención | Movimientos sin cobertura → pending_flows; applicable_rate desconocida → pending_convention; final null, aun con bruto conocido. | Diseño de estados; pendiente integración. |
| Redondeo final por cuenta | Dos componentes exactos 0.005 + 0.005 → 0.01, nunca 0.02; sumar fracciones sin redondear líneas. | Preparado para motor final futuro. |
| Corrección histórica | Tasa sintética 0.01→0.02 conserva resultado anterior; persistencia futura crea revisión nueva con saldo/tasa/flujos de su período. | Pureza del bruto ejecutable; auditoría SQL pendiente. |
| Concurrencia | Dos sesiones con mismo alcance/revisión: una operación efectiva, retry devuelve misma revisión; inputs corregidos invalidan revisión vieja. | Preparado para test SQL futuro M2b. |
| Reimportación/doble flujo | Mismos bytes + misma solicitud: mismas filas; nueva versión reemplaza alcance, no append; flujo revisionado una vez por cálculo, repetición ambigua bloquea. | Preparado para SQL/HTTP futuro; no implementado. |

Los vectores de prorrateo son pruebas dimensionales con tasa suministrada, no una
confirmación de la tasa aplicable real. No se crean tests verdes que aparenten
validar una convención aún desconocida. Ningún final de ejemplo se publica.

## 10. Verificación y continuidad

La actualización Advisory conserva el trabajo local de AUM histórico. Las pruebas
nuevas cubren exclusivamente el helper bruto aislado; los controles SQL/HTTP de
comisiones son diseño pendiente, sin migraciones ejecutables ni bases remotas.
Resultado de las verificaciones efectivamente ejecutadas en `validation.md` y
`progress.md`. No se validaron muestras reales, convenciones Addepar ni cobros.

Referencias técnicas de la planificación original (no reconsultadas aquí):
[PostgreSQL numeric](https://www.postgresql.org/docs/17/datatype-numeric.html),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
Esta actualización no introduce integraciones ni dependencias.

Próximo prompt: «Con las convenciones financieras documentadas y una muestra
sintética aprobada, implementá únicamente preparación de comisiones (M2),
reutilizando el importador y conservando las 14 columnas. Separá Balance de
Assets Billed On hasta confirmación; no actives prorrateo, publicación de fee final
ni conciliación sin las reglas/evidencias pendientes. Sin cambios remotos».
