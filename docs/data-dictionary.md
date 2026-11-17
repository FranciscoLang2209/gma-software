# Diccionario de datos — etapa 2

> Actualización vigente de comisiones (2026-11-17): ver [commissions.md](commissions.md).
> El nuevo pedido autoriza motor trimestral Balance × tasa anual /4 y conciliación
> local revisada. Supera para este motor las restricciones de sólo planificación
> y la fórmula ACT/365 anteriores; el helper aislado previo se conserva sin integrar.

Fecha: 2026-11-11. Migración `20261111174240_financial_schema.sql`, nombre generado por Supabase CLI 3.1.0. Esquema `app_private`, fuera de los esquemas expuestos por la API. PostgreSQL 17; prueba ejecutada en 17.11 nativo, con datos sintéticos. No hay base remota ni archivos reales validados.

## Convenciones comunes

- `id`: UUID interno, `gen_random_uuid()` salvo el perfil, cuyo UUID es el de Auth. Ningún nombre de persona es único ni sirve de identidad.
- `created_at`: `timestamptz`, instante de creación. `created_by`: UUID de `auth.users`, obligatorio en entidades y lotes. Filas y hechos heredan al responsable por lote. El perfil permite autor nulo solo para bootstrap controlado futuro.
- Todas las FK usan `ON DELETE RESTRICT`. Sin cascadas. Filas, hechos y lotes no se borran; auditoría es append-only. Asignaciones/membresías no se borran y sus cambios quedan auditados. No hay limpieza automática ni retención acordada.
- Dominio `month_start`: fecha finita, primer día del mes. No representa la fecha de la operación individual. El mes de un FA es el de su entrega; no acredita vigencia comercial.
- Dominio `exact_decimal`: `numeric` sin escala forzada, excluye NaN e infinitos. No hay redondeo de almacenamiento, `float`, moneda implícita ni prohibición de negativos. Los valores originales se retienen. La API futura debe transportar decimales como strings y no calcularlos con `number` de JavaScript. El formato visual y los límites de entrada se definirán con muestras.
- Ausentes: `NULL`, sin default cero. Un total parcial requiere mostrar cantidad de valores presentes y faltantes. `SUM` ignora ausentes, por lo que nunca basta solo con el total.
- `*_original`: texto sin reinterpretar; no ejecutar fórmulas/macros. `original_cells` conserva headers exactos y strings o JSON null; `cell_metadata` permite registrar tipo de celda, fórmula como texto, valor almacenado y limitaciones de extracción. Conservar el archivo original es necesario para fidelidad completa del Excel.

## Entidades e identidad

| Tabla | Campos específicos y significado |
| --- | --- |
| `user_profiles` | `id` FK Auth; `role` = `admin` o `reader`; `enabled` inicia false. Sin alta, actualización ni autoasignación desde los roles API. No se usa metadata editable del usuario. |
| `custodians` | `code` texto único explícito; `name` etiqueta. No se resuelve por similitud de nombres. |
| `clients` | `name` etiqueta, duplicados permitidos. Cliente separado del comercial. |
| `commercial_advisors` | `name` etiqueta, duplicados permitidos. Sin deducción automática desde FA o Revenue. |
| `commercial_groups` | `name` etiqueta del equipo, duplicados permitidos. |
| `accounts` | `custodian_id` obligatorio; `client_id` nullable; `service` inicialmente `sin_clasificar`. UUID identifica una cuenta en un custodio: no fusionar cuentas de custodios diferentes. |
| `account_identifiers` | `account_id`, `custodian_id` nullable mientras está pendiente; `source` (`aum`, `revenue`, `fa`, `manual`); `namespace` explícito; `value_original`; `value_normalized` generado; `resolution_status` (`pending`, `resolved`); `evidence` obligatoria para resolver; `source_row_id` opcional. |

Normalización v1 = identidad textual exacta: `value_normalized = value_original`. No recorta espacios, cambia mayúsculas, elimina signos ni rellena ceros. Es deliberadamente conservadora hasta validar namespaces. `00123` y `123` son distintos. Un archivo que ya perdió ceros no permite reconstruirlos.

Índice único parcial para equivalencias resueltas: `(source, namespace, custodian_id, value_normalized)`. No puede apuntar a dos cuentas. FK compuesta garantiza que cuenta y equivalencia tengan el mismo custodio. Las observaciones pendientes pueden repetirse; con custodio desconocido nunca se resuelven ni se vinculan a una cuenta. La resolución requiere evidencia y custodio explícitos, aunque un número parezca único. Una referencia global futura necesitará un namespace confirmado y una migración; no se presupone.

## Vigencias comerciales

| Tabla | Campos específicos |
| --- | --- |
| `account_assignments` | `account_id`, `advisor_id`, `valid_from`, `valid_to`, `valid_during` generado, `is_primary`, `evidence` obligatoria, `source_row_id` opcional. |
| `advisor_group_memberships` | `advisor_id`, `group_id`, mismos campos de vigencia, principalidad y evidencia. |

Intervalos diarios **[desde, hasta)**: incluye `valid_from`, excluye `valid_to`; null en `valid_to` significa sin límite superior. Inicio obligatorio y fin estrictamente posterior. Fechas finitas. Ejemplo: `[2026-01-01,2026-02-01)` y `[2026-02-01,)` son adyacentes, no se solapan. `valid_during @> fecha` evita límites ambiguos.

Exclusiones GiST con `btree_gist`: para filas principales no puede haber dos intervalos solapados por cuenta ni dos equipos principales por comercial. Se permiten referencias secundarias sin atribución automática; no implican reparto porcentual. La atribución al cierre mensual sigue pendiente de decisión del negocio. Para corregir una vigencia se actualiza explícitamente con auditoría antes/después; la exclusión vuelve a comprobarse. FA actual y `OLD Owner Name payout` no crean historia fechada.

## Importaciones y versiones

Se agrega **`import_scopes`** a las 14 tablas propuestas para tener una unidad inequívoca de reemplazo, una fila que bloquear en concurrencia y un único puntero activo. Evita replicar un booleano de vigencia en miles de hechos.

| Tabla | Campos y restricciones |
| --- | --- |
| `import_scopes` | `source` (`aum`, `revenue`, `fa`), `period`, `custodian_id`: combinación única; `active_batch_id` nullable, FK compuesta a un lote del mismo alcance. Identidad del alcance inmutable. No puede vaciarse un puntero publicado. |
| `import_batches` | `scope_id`, `source`, `period`, `custodian_id` con FK compuesta al alcance; `version` entero positivo único por alcance; `idempotency_key` UUID único por alcance. |
| Archivo del lote | `storage_bucket` fijo `app-papa-imports`, `storage_object_path` clave interna, nunca URL pública, `file_name_original`, `file_sha256` SHA-256 hexadecimal de los bytes, `file_size_bytes` no negativo. Metadatos inmutables; correcciones crean otro lote. |
| Validación del lote | `row_count`, `blocking_error_count`; `metric_total_usd` decimal nullable, `metric_value_count` conteo de valores presentes; `totals` JSON de conciliación adicional; `errors` array JSON; `parsing_conventions` JSON para formatos/acuerdos/versiones del parser. Importes en JSON se transportan como texto decimal. |
| Responsables y estado | `status`, `reviewed_at/by`, `published_at/by`, `created_at/by`. Pares fecha/usuario coherentes; publicado exige ambos campos. |
| `import_rows` | `batch_id`, `sheet_name`, `row_number` desde 1 según posición real del archivo, no ordinal filtrado; únicos por lote/hoja/fila; `original_cells`, `cell_metadata`, `status` (`pending`, `valid`, `error`), `errors`, `created_at`. Originales/coordenadas inmutables incluso en preparación. En CSV usar nombre explícito documentado por el parser. |

Estados del lote: `uploaded`, `validating`, `needs_resolution`, `ready`, `failed`, `published`. Preparación puede corregir validaciones y datos derivados antes de publicar; el flujo de UI/servidor se cierra en etapas 4–5. **Superseded es un estado derivado**: lote `published` cuyo id ya no es el puntero activo. El lote no cambia ni pierde sus hechos cuando es reemplazado. No se implementa un estado `superseded` mutable adicional.

Un archivo con varios custodios/meses se particionará en lotes explícitos por alcance, con la misma referencia de archivo si corresponde. No es posible crear un alcance global que solape alcances individuales. La ausencia de un custodio o un lote vacío no ordena eliminar datos. La publicación del archivo completo deberá envolver todos sus alcances revisados en una única transacción; ese orquestador del importador todavía no existe. No habilitar publicación parcial de un archivo con errores en otra partición.

### Operación interna de publicación

`app_private.publish_import(target_id, expected_active_id, actor)` es `SECURITY INVOKER`, con `search_path` vacío y sin EXECUTE para ningún rol API ni `service_role`. Solo se ejercita mediante el propietario de la base sintética. `actor` debe coincidir con `auth.uid()` y con un perfil administrador habilitado; no hay bootstrap automático. No otorgar acceso directo desde el cliente en la etapa siguiente.

1. Bloquea el alcance y luego el lote mediante `FOR UPDATE`. Comprueba que el puntero siga siendo `expected_active_id`; null es la revisión explícita de un alcance sin versión activa.
2. El lote debe estar `ready`, revisado, no vacío y sin errores. Todas sus filas deben estar válidas y sin errores, y la cantidad real debe coincidir con `row_count`.
3. Cada fila financiera tiene exactamente un hecho con cuenta resuelta y procedencia coherente. Los totales revisados y cantidad de valores presentes deben coincidir exactamente con el agregado almacenado, incluyendo null cuando todos los importes estén ausentes.
4. Marca el lote publicado y cambia el único puntero del alcance dentro de la misma transacción, con auditoría antes/después. Reintentar el lote ya activo no repite montos ni el evento de publicación. Un competidor con revisión obsoleta falla.
5. Desde ese momento no se pueden insertar, modificar ni borrar sus filas/hechos, ni modificar o borrar el lote. Las escrituras de detalle toman el lock del lote para serializarse con la publicación.

El hash no es una regla de deduplicación ni de identidad de Revenue. Un reintento de preparación reutiliza `idempotency_key`; otra revisión explícita puede referenciar los mismos bytes con otra versión. Para recuperar una versión histórica se prepara una nueva versión con sus originales/hechos, se concilia y se publica contra el puntero actual; nunca se borra la historia ni se edita una cifra publicada. La función de clonación y UI de recuperación pertenecen a la etapa 5.

FA se puede almacenar/validar, pero su publicación se rechaza explícitamente hasta implementar el flujo revisado de correspondencias y vigencias. El esquema no inventa qué referencia es comercial ni fechas. La función interna financiera tampoco valida semántica de Excel: la declaración `ready`, la cobertura de archivo completo y los convenios requieren el importador futuro y muestras reales.

## Hechos financieros

| Tabla | Campos específicos |
| --- | --- |
| `aum_monthly` | `account_id`, `custodian_id`, `period`; `source` generado `aum`; `batch_id`, `import_row_id` único; `value_usd` decimal nullable, `value_original` texto; `created_at`. |
| `revenue_entries` | Misma identidad/custodio/período/procedencia; `source` generado `revenue`; `payout_broker_usd` decimal nullable, los 29 campos originales de la tabla siguiente; `created_at`. |

FK compuestas impiden mezclar fuente, mes, custodio, lote, cuenta o fila de otro lote. Solo un hecho de cada fuente por fila física importada; esto no deduplica contenido, tickets o cuenta/mes. Si una fila requiere varios valores consolidados, debe revisarse el contrato antes de cambiar el modelo.

**Prueba estructural de unicidad de AUM vigente:** `(batch_id, account_id, period)` es único; cada cuenta pertenece a un custodio; cada lote coincide con un alcance único `(aum, period, custodian_id)`; el alcance tiene un único puntero activo. Por lo tanto, las filas de `aum_current` tienen como máximo una por `(account_id, period)`, incluso mientras coexisten versiones históricas y preparadas. No se usa un índice parcial que dependa del estado de otra tabla ni flags de vigencia desincronizables.

`aum_current` y `revenue_current` filtran por el puntero activo. Ambas vistas tienen **`security_invoker = true`**, permanecen privadas; etapa 3 concede lectura con RLS a la sesión administrativa y al rol interno de proyección. Toda consulta futura debe usar esas versiones; sumar tablas históricas directamente duplica versiones.

### Revenue: mapeo completo

Todos estos campos son `text` nullable; no convertir un campo ambiguo por su nombre.

| Header original | Columna |
| --- | --- |
| CUSTODIO | `custodian_original` |
| MES | `month_original` |
| AÑO | `year_original` |
| ACCOUNT | `account_original` |
| NAME | `name_original` |
| Advisor Name | `advisor_name_original` |
| ADV NAME SEC | `adv_name_sec_original` |
| Rel. 2nd | `rel_2nd_original` |
| Nacho GMA | `nacho_gma_original` |
| IP | `ip_original` |
| IP PAYMENT | `ip_payment_original` |
| PAGO OK | `pago_ok_original` |
| B/S | `buy_sell_original` |
| ASSET | `asset_original` |
| QUANTITY | `quantity_original` |
| DESCRIPTION | `description_original` |
| CUSIP | `cusip_original` |
| PRICE | `price_original` |
| TICKET | `ticket_original` |
| TICKET (O) | `ticket_o_original` |
| SERVICE CHARGE | `service_charge_original` |
| GROSS | `gross_original` |
| TOTAL | `total_original` |
| Payout broker | `payout_broker_original` |
| Payout Medina base | `payout_medina_base_original` |
| Final payout Medina % | `final_payout_medina_percent_original` |
| Payout Medina | `payout_medina_original` |
| % Payout REP | `payout_rep_percent_original` |
| NET Payout REP | `net_payout_rep_original` |

Solo `Payout broker` tiene además interpretación confirmada como `payout_broker_usd`. Cuando está presente el decimal debe existir original no vacío. Los separadores y formatos de archivo no están confirmados: no hay conversor en esta etapa.

**Porcentajes:** permanecen texto original, sin columna decimal derivada aún. Convención técnica para una futura conversión autorizada: proporción decimal (`0.15` = 15 %). No decidir si un original `15`, `0.15` o `15%` usa puntos porcentuales o fracción sin un convenio explícito en `parsing_conventions`. No se aplican estos porcentajes a cifras ni se calcula advisory.

Los 6 headers de AUM y 7 de FA enumerados en `product.md` quedan completos en `import_rows.original_cells`. AUM deriva solamente mes/año, equivalencia explícita y `Value (USD)`; FA no deriva asignaciones automáticamente.

## Auditoría y acceso mínimo

`audit_events`: `id`, `occurred_at`, `actor_id` nullable para operaciones de sistema, `database_role`, `action`, `entity_table`, `entity_id`, `before_data`, `after_data`. Triggers registran cambios en perfiles, entidades, equivalencias, asignaciones, alcances y lotes; la publicación agrega un evento explícito con responsable y punteros. Antes/después es información privada, no un log público. Hechos y filas conservan origen y responsable del lote y quedan congelados al publicar. SQL administrativo sin claims deja `actor_id` nulo y registra el rol de base; no se presenta como usuario identificado.

Todas las tablas tienen RLS habilitado y forzado. La etapa 3 agrega políticas: acceso
directo a tablas/vistas administrativas solo con perfil admin activo y sesión vigente;
ningún usuario puede escribir perfiles. Los lectores usan proyecciones publicadas sin
originales mediante RPC acotadas, bajo rol interno sin BYPASSRLS ni propiedad de tablas.
Las vistas permanecen `security_invoker=true`. El lookup privado de rol/sesión es la
única función con privilegios del propietario de migración. Ver [auth.md](auth.md)
para grants, bootstrap y condiciones efectivas por superficie.

La segunda migración crea `app-papa-imports` privado, SELECT/INSERT solo admin,
sin sobreescritura ni borrado por API. La app descarga con JWT del usuario, sin emitir
URLs firmadas. El servicio Storage real y la configuración alojada siguen pendientes.
Los fixtures nativos solo crean su contrato SQL; no equivalen al servicio Supabase.

## Ampliación de preparación — etapa 4

Tercera migración `20261112143232_import_preparation.sql`: `import_batches.preparation_only` boolean, default false para conservar contratos anteriores; `begin_import` siempre lo establece true. Trigger impide pasarlo a false, revisar o marcar ready/published por UPDATE/RPC. No se escribe ningún hecho financiero ni se cambia `active_batch_id` en este flujo.

`parsing_conventions.options`: fuente/período/custodio/código/delimitador declarados al cargar. `configuration`: misma información más hoja, convención y `parserVersion=1`, fijada al primer chunk confirmado. `totals`: `processed` (cursor de filas persistidas), `rowCount`, `distinctAccounts`, `total` decimal como texto o null, `valueCount`, `missingValues`, `duplicateRows`, `blockingErrors`, `headers`, `sheets`, `warnings`, `errors`. La proyección HTTP selecciona `totals.total`, no el campo PostgreSQL numeric serializado como number por PostgREST.

`import_rows.original_cells`: posiciones 1-based textuales como claves, valores string/null. `cell_metadata`: `cells` (tipo/valor/fórmula/caché/estilo por posición), `account` (referencia principal sin normalización), `amount` (decimal string/null), `period`, `fingerprint` diagnóstica y `warnings`. Sin cuenta UUID inferida. `errors`: código, columna opcional y mensaje; status valid/error describe sintaxis/validación, no resolución de identidad.

RPC invoker nuevas: `begin_import(...)` asigna versión con lock de alcance y clave de solicitud; `prepare_import_chunk(...)` guarda hasta 250 filas más resumen/cursor de forma atómica con lock de lote. Ambas vuelven a comprobar admin/sesión; no tienen EXECUTE para anon/service_role/PUBLIC. Índice `batches_file_sha256` no único para advertencias. Los datos permanecen sujetos a RLS, inmutabilidad de originales y auditoría previa. Límites y semántica completos en [imports.md](imports.md).

## Ampliación — etapa 5 (2026-11-13)

Cuarta migración: `20261114012532_account_resolution_publication.sql`, generada por CLI. El esquema tiene ahora 17 tablas. La API no concede escritura directa sobre importaciones/hechos/identificadores a authenticated.

| Objeto | Contrato |
| --- | --- |
| `row_resolutions` | Una resolución por source_row_id, batch_id, account_id/custodian_id consistentes, advisor_id opcional para FA, evidence, created_by/at. FK compuestas de procedencia; cambios auditados. Inmutable tras publicar. En ready la RPC ya no permite resolver. |
| `fa_rows` | Hechos de asignación por versión: batch_id/import_row_id, account_id único dentro del lote, advisor_id nullable, commercial_column, valid_from/to y daterange [desde,hasta). Solo son efectivos si el lote es activo; publicación verifica solapamientos con otros FA activos/asignaciones manuales. |
| `import_batches.review` | JSON de revisión: token UUID, expected_active_id, comparison (decimales como texto), complete_scope, commercial_column y vigencia. reviewed_by/at registran actor/instante. |
| `manage_import` | Operaciones inspect/resolve/review/publish; wrapper público invoker y ejecución privada con rol interno sujeto a RLS. Nunca acepta UPDATE financiero libre. |
| `advisor_at(account,period)` | Asignación vigente al último día del mes. Sin cobertura retorna null; no arrastra FA actual. Helper privado compartido por conciliación y consultas agregadas; consumido por Resumen y Análisis comercial desde etapa 7. |

`account_identifiers.namespace` utiliza exactamente el header de cuenta de cada fuente (junto con source y custodian_id). No declara namespaces globales ni equivalencias automáticas entre fuentes. Los originales posicionales siguen intactos; import_cell resuelve headers por totals.headers al materializar las 29 columnas Revenue. `superseded` es una proyección del puntero, no una modificación de la versión publicada.


## Ampliación — etapa 6 (2026-11-13)

Quinta migración: `aggregate_report` devuelve JSON con parámetros tipados, total global,
series mensuales, cobertura de publicación y filas agregadas paginadas. No crea nuevas
tablas ni cambia datos publicados. `numeric` se serializa como texto, ausencias como null.
Políticas de lectura dimensional y FA activo adicionales solo para el ejecutor de proyección;
no habilitan tablas/originales al lector. Contrato completo, conteos, filtros, comparación,
revisión e índices en [aggregate-queries.md](aggregate-queries.md).


## Proyección — etapa 7 (2026-11-13)

Sexta migración reemplaza el cuerpo de la misma RPC sin cambiar firma, propietario ni permisos. Filas con participaciones numeric/null, ranking por AUM para dimensiones distintas de cuenta, opciones observadas acotadas y última publicación del alcance. Totales, fuentes, grano y atribución sin cambios. Contrato y condiciones de denominador en `aggregate-queries.md`; evidencia local/sintética y límites en `validation.md`.


## Cuentas y administración — etapa 8 (2026-11-15)

Séptima migración `20261115174622_accounts_administration.sql`. `active` boolean en custodians/clients/commercial_groups/commercial_advisors/accounts: baja lógica, sin filtrar ni borrar historia. Se impiden borrados por trigger y escrituras directas del modelo desde authenticated. Las exclusiones GiST [desde,hasta), FK restrictivas y control de FA activo siguen vigentes.

`audit_events.reason` conserva el motivo de cada cambio manual nuevo. `model_reviews` (18.ª tabla privada): token UUID, actor, entidad/UUID objetivo, input, motivo, revisión, preview antes/después, timestamps de creación/aplicación. RLS forzado; acceso solo ejecutor con admin vigente y mismo actor, sin API de tabla ni limpieza automática. Preview comprueba constraints mediante una mutación reversible en subtransacción; save aplica el input registrado, nunca un payload nuevo enviado al confirmar. Lock 71482026 compartido con publicación, revisión basada en eventos auditados, vencimiento 30 minutos, idempotencia y motivo atómico. Más de 5000 cuenta-meses afectados se rechaza.

Políticas de identidad permiten al ejecutor consultar procedencia publicada, incluso versiones reemplazadas, sin otorgar tablas/payloads al lector. RLS de cuentas y asignaciones excluye cuentas exclusivas de preparación; aliases requieren origen publicado o equivalencia manual sin fila de origen.

`account_months` agrega cada fuente independientemente por cuenta/mes y aplica `advisor_at`/membresía al cierre. `account_directory` proyecta todas las cuentas con filtros históricos, búsqueda literal, orden/UUID y revisión de página; no suma AUM mensual. `account_detail` expone series del rango, identidades, asignaciones manuales/FA activo, membresías y procedencia; pagina Revenue por mes/UUID, manteniendo cada registro legítimo. Admin recibe original_cells + headers del lote y archivo/hoja/fila; lector no recibe payload ni archivos. `manage_model` permite list/preview/save en siete tipos predefinidos, sin SQL arbitrario ni importes financieros. Wrappers invoker y funciones privadas de ejecutor NOLOGIN/NOBYPASSRLS, con search_path vacío y EXECUTE revocado a PUBLIC/anon/service_role.

## Operación histórica AUM — 2026-11-17

- `app_private.import_uploads`: UUID/clave de solicitud global; `file_name`,
  `file_hash`, `file_size`, `storage_object_path`, `options`, `manifest` inmutables;
  `created_by/created_at`; `status` (`preparing`, `ready`, `publishing` transaccional,
  `published`), `review` (token + hijos/tokens/punteros + actor), `published_at`.
  Sin borrado ni modificación del original/manifiesto; publicada inmutable.
- `import_batches.upload_id`: FK restrictiva nullable, unique parcial
  `(upload_id, scope_id)`. Un hijo AUM por período del manifiesto, mismo custodio
  declarado y mismo original. Versionado/scopes/hechos financieros sin cambios.
- `public.admin_import_uploads`: vista invoker solo SELECT; RLS solo admin vigente.
  Escrituras únicamente por RPC del ejecutor; no grants de escritura al cliente.
- `public.manage_historical(uuid,text,jsonb)`: wrapper invoker de operación padre.
  Revisión/publicación recorre hijos persistidos y manifiesto, no una lista del
  navegador. `public.manage_import(inspect)` añade `batch.upload_id` para regresar
  desde correspondencias a la operación padre.

El hash de fila/archivo sigue siendo diagnóstico/procedencia; no acredita una
identidad de cuenta ni deduplica snapshots. Las coordenadas son únicas dentro del
original y la publicación mantiene las FK/unicidad de `aum_monthly` existentes.


## Comisiones Advisory — diseño actualizado, no migrado (2026-11-17)

- `commission_periods`: fechas, días explícitos, ACT/365 fijo y evidencia del conteo.
- `commission_snapshots`: reutiliza `import_rows`/lotes/UUID; conserva balance de
  origen y fecha separados de Assets Billed On acreditado, tasa anual original y
  proporcional, beneficiario independiente y período histórico. Sustituye el nombre
  propuesto `commission_rows`, sin crear dos tablas para el mismo hecho.
- `commission_flows`: depósitos/retiros/fees, fecha efectiva, importe/moneda/original,
  período, días restantes, applicable_rate/política, ajuste nullable y procedencia.
- `commission_calculations`: bruto, ajustes/final nullable, versión de fórmula y
  política, revisión exacta de inputs, redondeo por cuenta, motivos/estado y actor.
  Conservar previas, dependencias y fracciones para recomputación sin redondeo previo.
- `commission_beneficiaries`: UUID auditado, resolución explícita; no fusionar por
  nombre con comerciales. Cuentas/custodios/archivos/auditoría se reutilizan.

Todas son entidades propuestas: no existen aún tablas/RPC/DTO públicos de comisiones.
Fórmulas, estados, restricciones, migraciones M2/M2b/M3 y pruebas preparadas en
`historical-imports-and-commissions-plan.md`. Solo el helper bruto aislado existe.

## Comisiones trimestrales: implementación local vigente

`app_private.commission_events`: una fila inmutable por comando revisado.
`id` UUID idempotente; `operation` expected/receipt/reconcile; `target_id`
obligación estable o movimiento Revenue; `previous_id` versión anterior;
`revision` secuencial; `input` JSON con originales, coordenadas, hash, evidencia y
motivo; `result` JSON con decimales **textuales**, bases, estados y referencias;
`created_by`/`created_at` procedencia de operación. `commission_current` selecciona
última versión por operación/target bajo RLS invoker. Tabla con RLS forzado,
escritura por ejecutor admin; API/lectores sin acceso a preparación u originales.

No se guarda AUM como Balance ni se altera `revenue_entries`. Una clasificación
referencia UUID del movimiento y versión publicada; una conciliación referencia
versión esperada y versiones de clasificación, preservando cada fila física.
Resultados esperados/anuales, cobros y diferencias permanecen separados por
base gross/net/representative_payout. Fórmula, precisión, controles Excel,
contrato de entrada y límites en [commissions.md](commissions.md).
