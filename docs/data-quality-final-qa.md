# Calidad de datos — QA final, 2026-11-25

Solicitud: completar Fase 10, aplicar migraciones necesarias y entregar a main.
Alcance: código Fases 9–10 y esquema GMA; no incluye resolver identidades ambiguas,
reparar publicados, cargar archivos reales ni crear usuarios para probar permisos.

## Matriz de cobertura

| Caso solicitado | Evidencia reproducible |
| --- | --- |
| Formatos, espacios, invisibles, ceros, nombres inconsistentes | tests/normalization.test.ts, tests/reconciliation.test.ts; test-import-quality-http.mjs |
| Huérfanos, ambigüedad y mismo literal en distintos custodios | data-quality.test.sql, reference-filters.test.sql, multicustodian-history.test.sql |
| Revenue múltiple, AUM mensual y fuentes independientes | queries.test.sql, publication.test.sql, financial-metrics.test.sql |
| Trimestre incompleto, ROA y ponderación | quarterly-roa.test.sql, financial-metrics.test.sql; test-roa-http.mjs |
| Filtros individuales/combinados y estados vacíos | reference-filters.test.sql, availability.test.sql; test-availability-http.mjs |
| Reimportación, retry, conciliación idempotente y conservación | imports/publication/historical-*.test.sql; test-dashboard.mjs |
| Roles, sesión revocada y originales privados | auth.test.sql, managed-migrations.test.sql; test-auth-http.mjs y navegador |
| Rollback de operaciones implementadas | publication.test.sql, data-quality.test.sql, concurrencia e historia |
| Diagnóstico equivalente y capacidad con historia grande | quality-records-equivalence.test.sql, quality-history-capacity.test.sql |
| Pantallas, navegación, filtros, preview/confirmación | scripts/test-quality-browser.mjs, Chrome 1440/390 px |

Los nombres de SQL son relativos a tests/database. Las pruebas de rollback usan
operaciones implementadas de preparación/publicación y corrección versionada;
no acreditan un adaptador remoto de fusión de UUID o reparación de publicados.
El dry-run real sigue sin manifiesto aprobado: ver [data-repair.md](data-repair.md).

## Problema real encontrado y corrección

La sesión administrativa existente devolvía timeout al abrir Calidad, incluso con
fuente manual vacía. La consulta calculaba el historial completo y serializaba los
payloads de auditoría aunque la vista no los mostrara. EXPLAIN ANALYZE de lectura
privilegiada midió 4.679 ms para fuente vacía, 3.846 ms en auditoría. Se limitó cada
historial a su vista y la carga de before/after a las 25 filas visibles. Se mantiene
historia completa, paginación, revisión obsoleta y decimales como texto exacto.
La revisión incluye metadata y versión interna de tupla, sin exponerla al cliente.

Tras ese primer ajuste, la fuente vacía cargó en la sesión real; la vista completa
seguía excediendo el límite. EXPLAIN midió 7.328 ms sin RLS de sesión: aliases se
comprobaban fila por fila y Master descomprimía el snapshot repetidamente. La segunda
optimización preagrega identidades resueltas, entradas/resultados Master y límites
de cargas. Conserva el primer resultado Master por fila y las identidades pendientes
con destino NULL. La huella de revisión conserva todos los campos con serialización
de registro. No se elevan timeouts ni se amplían permisos de usuarios o desactiva RLS.

La lectura de coordenadas publicadas utiliza un índice que cubre ID, lote, hoja y
fila. La revisión ordena clave + hash, evitando ordenar 17 MB de filas completas.
El plan también recorría todas las filas publicadas para comprobar 1.589 lotes
editables sin hijos. La búsqueda de preparación se hace por lote con su índice
existente; no filtra ni descarta filas editables. Se mantiene el mismo conjunto
completo del diagnóstico, sin aplicar un período predeterminado que lo reduzca.

Chrome detectó además hidratación inconsistente en fechas: para un instante idéntico,
Node formateaba 17:00 y Chrome 5:00 p. m. en es-AR. dateLabel ahora fija hourCycle
h23; se verificaron ambos motores y una prueba de Buenos Aires a las 17:00 y 00:00.
Sin cambiar el instante, zona horaria o datos almacenados.

El EXPLAIN bajo el ejecutor, sin sesión ni claims falsos, mostró el problema restante:
RLS estima tres hechos frente a 36.693 y elige recorridos anidados de conjuntos
completos. Se favorece hash/merge sólo dentro de quality_report mediante configuración
de esa función. Los laterales por lote conservan su acceso indexado. El ajuste no
cambia población, filtros ni resultado. Por sí solo fue insuficiente en la sesión
real. El ejecutor compartido expandía también políticas recursivas de proyección
para lectores, aunque Calidad es exclusivamente administrativa. Se aisló esta RPC
en app_papa_quality_reader: NOLOGIN/NOBYPASSRLS/NOINHERIT, sin membresías ni escritura,
sin acceso a Auth ni CREATE. Sólo SELECT de las 17 tablas y cinco vistas requeridas y tres
helpers puros/de acceso; cada tabla conserva RLS forzado y una política SELECT que
exige admin habilitado con sesión. No se modifican las políticas o el ejecutor
de informes financieros, ni los permisos de clientes. Equivalencias continúa
bajo el ejecutor original y sus controles de escritura. quality-executor.test.sql
verifica rol, ACL, ausencia de escritura y rechazo de lector; la suite conserva
pruebas de sesión revocada/ausente y anon/service_role. La inspección del plan usó una transacción forzada a rollback:
no quedó membresía, helper ni migración diagnóstica registrada.

El historial pagina con revisión de sus propias filas. La revisión de la cola sigue
incluyendo todos sus campos; cambiar una clasificación invalida esa revisión. Los
controles por fuente se siguen calculando en las tres vistas. Las pruebas distinguen
un cambio de catálogo que no cambia filas de importaciones de un nuevo evento que
sí invalida la revisión de auditoría.

Para filtrar auditoría sin descomprimir los 102 MB de before/after, audit_events
agrega quality_context generado y almacenado a partir de esos originales. Contiene
sólo source/options.source, custodio, período y lote; conserva la prioridad de after
y el fallback a before. Un helper inmutable de JSON, sin privilegios elevados,
calcula esa proyección; los originales y la regla append-only siguen intactos.
La auditoría general y con filtro AUM cargaron en la sesión real después del ajuste.

La prueba de equivalencia compara todas las columnas y multiplicidades frente a la
vista anterior, incluyendo aliases ambiguos, otros custodios, NULL, Master con
resultados repetidos y padres sin hijos. El helper existe sólo en PostgreSQL temporal.
El test de historia combina 38.400 hechos, 1.600 lotes vacíos y 50.000 eventos sintéticos, payload expandido >100 MB, y verifica
fuente vacía, páginas, filtros, exactitud decimal, historia inmutable y stale tras
nuevo evento. La historia real no se modifica.

## Evidencia y límites

Node 24.22.3, PostgreSQL local 17.12. 98 unitarias, typecheck y build correctos;
Auth HTTP completo correcto. Backend financiero de integración: PostgreSQL real
local, con Auth/PostgREST/Storage contractuales sintéticos e identificados. No hay
fallback de producción a mocks. Logs privados /tmp/gma-phase10-*.log son temporales;
los scripts y asserts versionados son la evidencia reproducible.

Se repitieron los seis bloques de audit-data-quality.sql en GMA sólo lectura:
18.800 AUM, 17.893 Revenue; cero huérfanos/conflictos de custodio/originales ausentes;
433 + 225 alcances sin discrepancias; totales exactos conservados en los 44 meses.
Se mantienen 12 Revenue sin importe, 839 cuentas sin cliente, 663 sin servicio,
dos pares candidatos ambiguos, 34 REF sin cuenta y 20 Master sin cuenta. No se
transformaron negativos ni se deduplicaron los 2.398 cuenta-mes de Revenue múltiple.

La lectura privilegiada de SQL no sustituye la prueba de sesión. La UI remota usa
la sesión administrativa ya abierta del dueño, sin exportar cookies o JWT y sin
capturar datos financieros. El lector se prueba localmente con RLS y HTTP; no se
creó ni suplantó una sesión remota de lector. Sin auditoría axe/manual exhaustiva.
No se certifica completitud económica, una importación real nueva ni backup
restaurable. Los hallazgos de negocio y de advisors se conservan explícitamente.


## Migraciones y conservación remota

Aplicadas exclusivamente a gma-software-prueba, conexión app papa. Las 32 anteriores
no se reejecutaron; historial final 41/41 versiones coincidentes. MCP asignó las
versiones y se renombraron sólo los archivos nuevos conservando SQL idéntico;
MD5 de los nueve archivos coincide con statements remotos.

| Versión | Cambio |
| --- | --- |
| 20261125234324 | report_availability_diagnostics |
| 20261125234545 | quality_report_bounded_history |
| 20261125235409 | quality_records_set_diagnostics |
| 20261125235909 | quality_origin_covering_index |
| 20261126000550 | quality_preparation_indexed_scan |
| 20261126000815 | quality_report_hash_joins |
| 20261126001116 | quality_admin_read_executor |
| 20261126001358 | quality_history_scoped_revisions |
| 20261126001636 | quality_audit_generated_context |

Recuentos y huellas de once proyecciones originales idénticos antes/después:
AUM, Revenue, identificadores, resoluciones, alcances, filas/puntero REF, tasas ROA,
Master, cuentas y auditoría. En auditoría se excluye únicamente la nueva columna
derivada quality_context al comparar con el esquema anterior; todos los campos
anteriores, incluidos before/after, responsables y fechas, se incluyen. La huella
de todas las 59.359 filas/campos de quality_records también coincide exactamente.
No se publicaron hechos ni se crearon eventos para QA remoto.

Verificados remotamente: RLS habilitado/forzado en todas las tablas privadas,
ejecutores sin login/bypass/super/CREATEROLE y cero membresías INHERIT/SET. El nuevo
lector interno carece de escrituras privadas, SELECT de sesiones Auth y CREATE.
Wrapper invoker y función privada definer, search_path vacío; EXECUTE denegado a
anon/service_role. Advisors sin hallazgos nuevos: un WARN de
[protección de contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
14 auth_rls_initplan, 16 multiple_permissive_policies, 49 FK sin índice y cinco
índices sin uso. No se cambió Auth ni se activaron planes pagos.

## Comandos y cierre

Verificados: npm test (98/98), npm run lint, npm run typecheck, npm run build,
npm run test:auth:http, bash scripts/test-database.sh y
node scripts/test-dashboard.mjs --browser. El último requiere playwright-core y
Chrome disponibles: GMA_PLAYWRIGHT_MODULE puede apuntar al módulo del runtime;
GMA_CHROME_EXECUTABLE al ejecutable instalado. No se añadieron dependencias.
El runner sólo admite orígenes 127.0.0.1 y el fixture sintético del arnés.

Últimos logs: /tmp/gma-phase10-{unit,types,build}-final.log,
/tmp/gma-phase10-lint-delivery.log, /tmp/gma-phase10-auth-http.log,
/tmp/gma-phase10-db-complete.log y
/tmp/gma-phase10-http-browser-complete-release.log. Chrome: 14 vistas × 1440/390,
sin errores JS/consola ni overflow global; preview/confirmación conserva las
métricas publicadas. Reinspeccionadas capturas sintéticas de escritorio/móvil.
El antecedente intermitente ROA no se reprodujo en el recorrido integral y sus
muestras API/SSR; no se atribuye una causa sin evidencia.

QA remoto comprobó Calidad completa, fuente vacía, importaciones, auditoría completa
y filtro AUM con sesión admin existente. Son lecturas puntuales exitosas; no se
certifica SLA ni concurrencia remota. El recorrido final de pantallas financieras
se verifica en el despliegue del commit entregado. Los resultados de commit/push y
READY se informan en la entrega; no se inicia ninguna fase de reparación automáticamente.
