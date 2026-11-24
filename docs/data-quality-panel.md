# Calidad de datos — panel administrativo (Fase 8)

Actualización 2026-11-24: aplicada en GMA con autorización del dueño como
20261124202631_data_quality_admin_panel. Archivo renombrado desde 20261124193823
para coincidir con MCP, SQL idéntico. La migración REF también está aplicada.
Ver [progreso](progress.md) para comprobaciones remotas y límites; las menciones
de pendientes siguientes describen el cierre local anterior a esta autorización.

Implementado localmente el 2026-11-24. Ruta /calidad-datos y navegación solo para
administradores. No se consultó ni modificó GMA durante esta fase; no hubo
despliegue. La migración nueva y la pendiente de Fase 5 permanecen locales.

## Qué permite revisar

- Registros y porcentaje de relación técnica por fuente y grano.
- Pendientes de correspondencia, errores/advertencias, cuentas sin cliente/custodio,
  orígenes/cuentas inexistentes, importes ausentes y tasas Master pendientes.
- Identificadores con formato sospechoso y candidatos de conflicto dentro del
  mismo source + namespace + custodio; son diagnósticos, no fusiones confirmadas.
- Cobertura mensual observada y filas históricas sin alcance, incluidos padres
  bloqueados que no llegaron a generar lotes hijos.
- Historial paginado de importaciones, cargas históricas y cambios auditados,
  con actor, fecha, evidencia y comparación anterior/posterior.
- Originales privados y coincidencias exactas acreditadas; enlace al lote y a su
  página de Correspondencias para seleccionar destino y aprobar una equivalencia.
- Aplicación explícita de una equivalencia Revenue ya acreditada a varias filas
  del mismo lote, ACCOUNT literal y custodio, con vista previa y confirmación.

Se reutilizan MetricCard, Select, DatePicker en español, StatusBadge, tablas, formularios y estilos del
sistema. No se añade biblioteca ni un segundo circuito de publicación.

## Alcance y significado de los recuentos

Fuentes: AUM, Revenue, FA, REF actual, snapshots Master, Comisiones, cuentas,
identificadores manuales y fuente sin identificar. Cada grano tiene su propia fila:
hechos publicados activos, preparación, catálogos, identificadores, referencias,
cargas históricas y filas sin alcance. No se suman montos ni se deduplican Revenues.

Una relación técnica significa cuenta/custodio/origen o resolución registrada según
el grano. No certifica identidad económica, servicio, comparabilidad de fees ni
cobertura esperada. Una cuenta sin cliente canónico puede tener FKs válidas.
Porcentaje calculado con numeric y enviado como texto; No aplica se separa del
denominador. Sin registros no se fabrica 100% de calidad.

Los problemas pueden solaparse; no se suman como registros únicos. Los controles
con cero se calculan sobre la consulta existente, no sustituyen fallos de conexión.
La métrica Registros controlados incluye distintos tipos de registros, explicados
en la tabla; los diagnósticos virtuales de cobertura se cuentan por separado.

Meses, custodio y fuente se combinan con AND donde son aplicables. Master usa el
solapamiento del rango de tasas registrado. Catálogos, identificadores, REF actual
y filas sin período identificable siguen visibles: no se les inventa una fecha.
Sin custodio es una opción explícita. Tipo de problema filtra la cola, manteniendo
la base completa de controles por fuente. Historiales no se filtran por ese tipo.

Cobertura: se construyen los tres meses de cada cuenta/trimestre con hechos
observados y se comprueba AUM/Revenue independientemente. Incluye ausencia de
fuente o importe; no interpreta ausencia como cero. No presupone continuidad fuera
de ese universo, no acredita cuentas esperadas y no reemplaza el cálculo ROA.

Los snapshots Master publicados se conservan como referencias históricas; no son
eventos de Comisiones ni una foto AUM. Las preparaciones Master que solo existen
como manifiestos privados en Storage no tienen un índice SQL: se retoman por UUID
en su circuito existente y no se presentan como parte del inventario de la base.
Una carga histórica antigua sin fuente queda Sin identificar, sin atribuirla a AUM
o Revenue por descarte.

## Consulta y paginación

GET /api/calidad-datos y Server Components usan la misma quality_report con el
cliente SSR del usuario. Consulta/snapshot SQL único: resumen completo y página de
25 registros. Historiales incluyen reemplazados y cargas sin hijos; no se limitan
a las últimas 50 importaciones. Offset máximo 1.000.000, siempre con revisión para
páginas posteriores. Cambios de datos, filtros o catálogo invalidan la revisión:
409 y reinicio explícito, sin páginas parciales o datos de otra versión.

Originales de preparación/publicados se obtienen de import_rows; REF muestra su
referencia publicada y enlaza al archivo REF privado, sin llamar original Excel
a sus etiquetas. Master muestra fila/procedencia del snapshot y abre su preparación
por el UUID de Storage cuando está registrado. Catálogos/aliases muestran registro
y evidencia. Los payloads no se incluyen en logs ni se abren al lector.

La historia de cambios muestra la fecha de operación y el período de la entidad
cuando existe. Un evento sin motivo conserva ese hecho; la evidencia puede estar
en el registro auditado. No se inventan responsables ni fechas.
Las imágenes anterior/posterior se formatean como texto dentro de PostgreSQL:
los importes numeric no pasan por Number de JavaScript ni pierden precisión al
mostrar JSON. Se verifica también un importe sintético con 18 decimales.

## Resolución y aplicación de aliases

La selección de un destino y aprobación individual se hace en Correspondencias,
reutilizando manage_import, sus conflictos, evidencia, resolución y auditoría.
El enlace conserva lote y página, aunque el lote no esté entre sugerencias recientes.
Las listas orientativas de 200 cuentas/aliases de esa pantalla siguen siendo
sugerencias; permiten UUID explícito fuera de la lista, validado por la base.

POST /api/calidad-datos usa quality_apply_alias. La primera petición, sin revisión,
solo prepara vista previa. Requiere una equivalencia ACCOUNT de Revenue ya
acreditada en ese custodio, lote needs_resolution/preparation_only sin errores,
evidencia de 10–2.000 caracteres y filas compatibles. No elige destino por nombre,
trim, similitud ni número de otro custodio.

La vista previa devuelve literal, cuenta/custodio/mes, alcance total, filas ya
resueltas, pendientes y cambios de evidencia/actor, más hasta 25 números de fila
de ejemplo. La aplicación requiere esa misma evidencia, revisión y checkbox de
confirmación. Un cambio entre preview y aplicación devuelve 409.

La RPC serializa con el lock del circuito de revisión, bloquea lote/alias y resuelve
cada fila mediante manage_import dentro de una sola transacción. Un fallo revierte
resoluciones y auditoría de todo el conjunto. El reintento idéntico por el mismo
actor/evidencia no duplica resoluciones ni auditoría mientras el lote sigue editable.
No cambia importes, hechos publicados, clientes, asignaciones ni punteros activos;
no revisa ni publica automáticamente. Otros literales, lotes y custodios no entran.

AUM/FA no tienen esta operación por lotes: sus duplicados/asignaciones requieren el
circuito específico. Referencias ya acreditadas a otro UUID bloquean, sin redirigir
historia. Los dos pares reales ambiguos de la auditoría siguen pendientes de
evidencia, dry-run, adaptador versionado y aprobación de una reparación publicada.
La preparación de Fase 4 no se convierte en un apply remoto desde este panel.

## Seguridad y migración

Migración local 20261124202631_data_quality_admin_panel.sql creada con CLI 3.1.0.
Agrega una vista privada invoker y dos RPC: wrapper público invoker e implementación
privada bajo app_papa_executor NOLOGIN/NOBYPASSRLS. Guards de administrador/sesión
actual, search_path vacío y permisos mínimos; RLS existente intacto. Anónimo,
lector, service_role y administrador deshabilitado no acceden al diagnóstico ni
a la operación. No se concede USAGE de auth ni acceso directo a la vista al cliente.

Página exige requireAccess(true); API reutiliza importAccess, origen para POST,
límites de cuerpo y respuestas private/no-store. Sin service_role, secretos nuevos,
metadatos editables para autorizar ni fallback demo ante una base fallida.

Antes de desplegar el conjunto, revisar y aplicar las migraciones locales pendientes
en orden con autorización específica. No se aplicaron remotamente. No hay UPDATE
de historia financiera ni tablas nuevas que poblar. Para retirar la funcionalidad,
revertir solo su runtime y retirar RPC/vista en una migración posterior revisada;
conservar resoluciones/auditoría generadas, sin borrarlas para simular rollback.
En esta fase solo se generaron resoluciones sintéticas, descartadas con sus clústeres.

## Verificación

Evidencia detallada y límites en [data-quality-validation.md](data-quality-validation.md).
Pruebas de contrato en [data-quality.test.ts](../tests/data-quality.test.ts), SQL de
roles/diagnósticos/rollback en [data-quality.test.sql](../tests/database/data-quality.test.sql),
capacidad en [data-quality-capacity.test.sql](../tests/database/data-quality-capacity.test.sql)
y recorrido en [test-data-quality-http.mjs](../scripts/test-data-quality-http.mjs).

La consulta inicial excedía 8 s con 38.400 hechos. EXPLAIN mostró un nested loop
entre la matriz trimestral y los agregados mensuales, subestimados bajo RLS.
Tres meses explícitos y FULL JOIN por claves evitan recorrer el agregado por cada
casilla. La prueba final conserva todos los registros bajo el límite local de 8 s.
Se reutiliza la huella acotada por fila del proyecto. No se desactiva RLS ni se sube
el timeout para esconder el problema; un tiempo sintético no es un SLA remoto.

Documentación consultada: [Supabase Database Functions](https://supabase.com/docs/guides/database/functions),
[changelog](https://supabase.com/changelog.md), [PostgreSQL WITH](https://www.postgresql.org/docs/17/queries-with.html)
y [auto_explain](https://www.postgresql.org/docs/17/auto-explain.html).
Se aplicaron las guías PostgreSQL, React y verificación del flujo completo.

Siguiente etapa: Fase 9, estados vacíos y causas diferenciadas en el resto de la
aplicación, sin modificar producción ni alterar las reglas financieras.
