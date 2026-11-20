# Validación — evidencia local y pendientes

## ROA: aplicación remota autorizada — 2026-11-20

Destino contrastado por herramienta: `gma-software-prueba` (`zwdqnrbqqszjrtkhyqnz`),
ACTIVE_HEALTHY, PostgreSQL17.11.0.019. Conexión Supabase **app papa**. Migraciones
anteriores25 ya aplicadas; solo `quarterly_roa_backend` pendiente. `apply_migration`
respondió success y el listado posterior registra **20261120155740**. Archivo local
alineado al timestamp MCP sin cambiar SQL; SHA256
`f28582da1acd0eb6307220eb3954f1bb238a56c9784d7ea8b9af4ee340315a66`.

Lecturas antes/después: 18.800 filas AUM,17.893 Revenue,658 alcances,0 eventos
Comisiones; mismos conteos. Hash de punteros activos
`cae48d302a007b2ae7955e9947d9e865`, definición de aggregate_report
`3b93aa4880f708c948ced2692acfe012`, idénticos. Son checks de invariantes técnicas,
no una conciliación de importes de negocio. Nuevas versiones/invalidaciones de tasas:
0/0. No se publicaron ni alteraron hechos financieros durante la migración.

RLS habilitado y forzado en ambas tablas ROA; authenticated sin SELECT directo.
Wrappers públicos invoker, funciones privadas del ejecutor NOLOGIN/NOBYPASSRLS;
EXECUTE authenticated y sin EXECUTE anon/service_role en las cuatro funciones.
Ejecutor sin CREATE en app_private. Única membresía visible: postgres otorgada por
supabase_admin, admin=true, inherit=false,set=false; no membresía temporal con
INHERIT/SET concedida por el operador de la migración. Invocar RPC sin sesión
produce insufficient_privilege, comprobado sin suplantar usuarios reales.

Security advisors antes/después: únicamente `auth_leaked_password_protection`
(WARN preexistente). No se cambió Auth ni se activó un plan pago. Ver
[remediación Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Performance posterior:48FK sin índice (INFO),14auth_rls_initplan (WARN),5índices
sin uso (INFO),16multiple_permissive_policies (WARN). No se declara que sean nuevos
ni resueltos; no se modifican reglas/índices sin evidencia de carga específica.
Referencias: [FK](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys),
[initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan),
[índices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index),
[políticas](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies).

También se repitió la **suite SQL local completa**, correcta con permisos de operador
administrado, consultas/importaciones/cuentas/comisiones, capacidad, concurrencias y
restauración. `/tmp/gma-roa-ui-db-final.log`; no se sustituyen pruebas remotas de
usuario con estos fixtures. HTTP integral y navegador corresponden al build final.
No se probaron roles autenticados en Supabase real ni se publicaron tasas reales.

Git: `main` estaba alineada con origin antes del cambio; commit de código **609b054**
y push aceptados por GitHub. Hooks de commit/push de Block Secrets correctos sobre
63 archivos; sin credenciales/fuentes financieras agregadas. Las26 versiones SQL
locales coinciden exactamente con el listado remoto. Vercel inició por integración
Git el build de producción de609b054; no se ejecutó una promoción o deploy manual.
El estado final de hosting se informa por separado: no equivale a una prueba
funcional autenticada ni a conciliación de datos de negocio.

## ROA frontend: validación local — 2026-11-20

Sin datos reales en fixtures, screenshots o logs. Node24.22.3, PostgreSQL17.12 y
Chrome instalados previamente; sin instalación de dependencias ni cambio del lockfile.
Se reutilizaron herramientas Playwright/axe externas al repositorio para revisión.

- `npm test`: **49/49**; tres pruebas nuevas de presentación: período explícito,
  filtros conservados, rechazo de entradas inválidas, revisión/paginación y cruce
  de año sin propagar revisión de otro trimestre. Log `/tmp/gma-roa-ui-unit-final.log`.
- Lint sin warnings, typegen/tsc y build Next de producción correctos. Ruta dinámica
  `/rentabilidad` incluida. Logs `/tmp/gma-roa-ui-lint-final.log`,
  `/tmp/gma-roa-ui-types-final.log`, `/tmp/gma-roa-ui-build-final.log`.
- `npm run test:dashboard -- --serve`: recorrido HTTP/SQL integral correcto sobre
  PostgreSQL efímero, con Auth/PostgREST/Storage sintéticos explícitos. Regresiones
  de consultas, cuentas, comisiones, importación histórica y publicación correctas.
  Casos nuevos ROA: lectura HTML por admin/reader, ausencia de originales/evidencia,
  selección inicial, vacío, trimestre abierto, filtros inválidos, revisión vencida,
  401/403 y redirecciones SSR para anónimo/perfil deshabilitado/sesión vencida;
  timeout504 e indisponibilidad503 sin mensaje privado ni sustitución de cifras.
  El transporte verifica además que la consulta de opciones no reciba parámetros
  exclusivos de ROA. Log `/tmp/gma-roa-ui-http-final.log`.
- Chrome headless real: admin/reader ×1440/768/390; sin overflow global, selectores
  identificados, apertura por teclado, filtro servicio, envío de formulario,
  paginación fijada a revisión, vacío/error y navegación. Sin errores JS.
  `/tmp/gma-roa-ui-browser-final.log`; resultados axe/screenshot en `/tmp/gma-roa-ui`.
- Fixture financiero sintético adicional publicado solo en ese clúster temporal:
  dos trimestres calculables y referencia anual publicada desde Comisiones por API
  administrativa. AUM100.000/Revenue150/ROA0,60%/Fee0,50%/diferencia0,10pp, categoríaOK.
  Tres gráficos presentes y valores exactos en tablas. Dos roles ×1440/390, sin
  overflow ni errores JS. Conjunto mixto acotado por cliente: ROA0,14%, Fee global
  N/D y referencia en Advisory. `/tmp/gma-roa-ui-calculable-final.log`.
- Axe WCAG2/2.1/2.2AA + best-practice: cero infracciones detectadas en seis escenarios
  de cobertura incompleta y cuatro calculables. Quedan resultados `incomplete` de
  contraste en contenido recortado/desplazado de tablas; no son una certificación
  de accesibilidad completa. Se inspeccionaron screenshots desktop/móvil y se
  corrigieron dos regiones con nombre duplicado, badge desbordado a768px,
  superposición de columnas y contraste ámbar4,24:1 cambiando a `highContrast` Radix.

Límites: sin lector de pantalla manual, pruebas en Safari/Firefox ni conciliación
con Excel privado. Consultas de evolución por trimestre con revisiones independientes;
no prueban un snapshot transaccional común. No se declara completitud económica,
ni ausencia de movimientos por una fila faltante. CSV sigue sin soporte del contrato.
Los checks anteriores son locales/sintéticos; no prueban Auth/PostgREST/Storage remotos.

## ROA trimestral: backend/motor local — 2026-11-19

Entorno: Node 24.22.3 y PostgreSQL 17.12 nativo ya disponibles, CLI Supabase 3.1.0
del lockfile. Se localizaron los binarios fuera del PATH inicial; no se instalaron
paquetes ni se actualizaron versiones. La nueva migración se generó con
`supabase migration new quarterly_roa_backend`, tras consultar su ayuda y las
referencias oficiales de funciones, numeric y changelog citadas en el plan.
Solo clústeres sintéticos efímeros, sockets privados/sin TCP; sin bases remotas.

Checks ejecutados:

- Unitarias completas: **46/46 correctas**, incluidas cuatro nuevas de contratos,
  publicación, adaptador y errores ROA; logs `/tmp/gma-roa-unit-final.log`.
- ESLint con cero warnings, `next typegen` + `tsc --noEmit` y build Next de producción
  correctos. Build contiene `/api/rentabilidad` y `/api/rentabilidad/tasas`, sin nueva
  página. Logs `/tmp/gma-roa-lint-final.log`, `/tmp/gma-roa-types.log` y
  `/tmp/gma-roa-build-final.log`. No se cambiaron componentes de interfaz.
- Suite SQL completa correcta: esquema desde cero con operador CREATEROLE/BYPASSRLS
  sin SUPERUSER, sin membresías/CREATE residuales del ejecutor, RLS/grants nuevos,
  consultas/cuentas/comisiones/importaciones anteriores, concurrencia y restauración.
  Log `/tmp/gma-roa-db-complete.log`.
- SQL ROA: tres fotos 100.000/120.000/140.000 → promedio120.000, Revenue150 →
  ROA0,50%; duplicados legítimos y aliases no multiplican montos. Agregado0,19%
  distinto del promedio de ratios; 0,40/0,60 inclusivos y comparación de un decimal
  inmediatamente superior sin redondeo; negativos, cero, null, solo-fuente y vacío.
  Filtros AND, asignación por conjuntos al cierre, exposición del equipo /3, servicios
  sin clasificar antes del filtro, páginas/revisión y preparación sin efectos.
- Advisory: verified de Comisiones no expone tasas automáticamente; publicación
  explícita con evidencia, ponderación por exposición mensual, diferencia en pp con
  una sola división y sin mezcla de poblaciones; tasa parcial, trimestre distinto,
  corrección/obsolescencia, retry viejo sin reactivación, historia e inmutabilidad.
  Lector/admin reciben la misma proyección; originales y eventos siguen ocultos,
  metadata no eleva roles y sesión inválida falla. La prueba focal final también
  comprueba trimestre abierto aun cargando anticipadamente sus tres fotos:
  `/tmp/gma-roa-focused-final.log`, correcto.
- Capacidad sintética: **800 cuentas × 3 meses**, 250 filas por página, total sobre
  800 cuentas, promedio80.000.000/Revenue240.000/ROA1,2%, primera/última página
  conciliadas, con statement_timeout local8s. Primera llamada medida ~62,8ms en el
  recorrido completo previo al último campo; la repetición del estado final midió
  ~63,8ms. No equivale a latencia Supabase ni a un SLA real.
  No se añadieron índices o timeouts al reporte existente.
- Concurrencia ROA con dos conexiones: dos publicaciones diferentes contra una
  misma revisión producen una ganadora y un rechazo; dos retries simultáneos del
  UUID ganador no crean otra versión. Las concurrencias existentes también pasan.
- Regresión explícita: `aggregate_report` conserva definición y JSON antes/después
  de operaciones ROA/tasas en el fixture. SHA-256 de las tres migraciones locales
  que contienen el aggregate vigente conserva los valores registrados al inicio;
  comparación byte a byte del último cuerpo idéntica. No se sustituyó ese reporte.

HTTP: recorrido completo inicial Next → transporte Auth/PostgREST/Storage sintético
→ PostgreSQL local correcto (`/tmp/gma-roa-http.log`). Las pruebas nuevas verifican
401/403, no-store, filtros400, revisión409, roles, origen, fuente de tasa inexistente,
publicación/retry y omisión de evidencia/originales; también timeout504 y fallo503.
Una repetición (`/tmp/gma-roa-http-final.log`) pasó ROA y Comisiones pero falló en
la publicación del circuito previo de importaciones con409 en vez de200; no se
determinó la causa ni se modificó ese circuito para ocultarlo. El reintento aislado
completo fue correcto: `/tmp/gma-roa-http-retry.log`. Tras agregar la proyección
del UUID público de tasa para recuperar una revisión, se repitieron correctamente
SQL focal, 46 unitarias, lint y build. Los recorridos integrales del estado final
SQL y HTTP también pasaron completos con salida0:
`/tmp/gma-roa-db-final-state.log` y `/tmp/gma-roa-http-final-state.log`.
`git diff --check` y revisión de whitespace de once archivos nuevos correctos.
Los arneses eliminan sus clústeres/servidores al finalizar, incluso ante error.

`supabase db advisors --type all --fail-on warn`, tras consultar ayuda, apuntó
solo al stack local127.0.0.1:54322 y falló ECONNREFUSED: stack Supabase no iniciado.
**Advisors no aprobado**; log `/tmp/gma-roa-advisors.log`. RLS SQL sintético no
sustituye servicios Supabase reales. No se ejecutaron advisors ni migraciones
remotos, despliegues, muestras/conciliaciones reales, UI nueva ni commit/push.
Pendientes económicos y contrato provisional en [quarterly-roa.md](quarterly-roa.md).

## Consulta de 32 meses: timeout y recuperación — 2026-11-18

Lectura remota de logs: cancelaciones por tiempo agotado. Presupuesto web de roles
8 s intacto. Sentencia administrativa del reporte sin envoltura de sesión: EXPLAIN
ANALYZE 16.606,5 ms antes / 2.730,2 ms después de acotar la huella de revisión.
Comparación real completa: igualdad JSON excluyendo únicamente revision, 32 meses.
Estos tiempos no prometen latencia de la sesión autenticada ni son QA visual.
Migración 20261119011514 aplicada sólo a GMA; cuerpo, owner, search_path y ACL
comprobados después. Sin cambios de datos publicados. Security advisor sin avisos
nuevos y health vacío; se conserva el WARN previo de contraseñas filtradas.

Local sintético: 42 unitarias, lint, build/TypeScript y suite SQL completa correctos.
Nuevo report-capacity.test.sql: 800 cuentas, enero 2024–agosto 2026 + mes previo,
AUM del cierre 80.000 y Revenue 800, meses ausentes N/D, misma proyección completa
que antes y revisión estable entre páginas distantes. Regresiones existentes cubren
correcciones financieras, vigencias, REF, roles y cambios de revisión.

HTTP integral repetido sin concurrir con la suite SQL: correcto. Timeout inyectado
57014 muestra aviso y formulario de fechas con desglose conservado; elimina offset
y revision al reenviar. API devuelve 504 sin mensaje SQL privado. Otros errores
siguen genéricos. El primer HTTP falló con 502 al preparar un lote; causa no
establecida, segundo recorrido completo correcto sin cambiar importaciones.
No se obtuvo sesión real ni se reintentó navegador bloqueado. Despliegue
dpl_GhsuSWVXwDp5LREWpSccmBm3tnFU READY y alias canónico confirmado; logs de
build confirman outputs desplegados. No equivale a probar una consulta autenticada.


## Aplicación versionada de referencias REF — 2026-11-18

42 unitarias, lint completo, build/TypeScript y suite PostgreSQL temporal completa
correctos. La suite de migraciones conserva operador CREATEROLE/BYPASSRLS sin
SUPERUSER. Regresión en historical-aum-resolution.test.sql verifica cuatro cuentas
de dos custodios con iguales etiquetas: identidades separadas, cifras AUM exactas,
ninguna asignación histórica. Retry no duplica versión/auditoría; par contradictorio
y error de Grupo aplicable revierten todo; nueva versión conserva anterior y
rechaza revisión obsoleta. Authenticated no puede ejecutar el helper de escritura.

HTTP integral completo pasado con Next compilado y PostgreSQL reales temporales,
Auth/Storage simulados. AUM+REF seguido de REV mantiene UUID por custodio; snapshot
visible en Análisis/Detalle y JSON, y CSV completo con etiquetas
que empiezan por = protegidas con apóstrofo. Cifras 240/10 sintéticas conservadas.
La suite SQL verifica además búsqueda por la etiqueta Client REF en el directorio.
Clúster y servidores eliminados. Logs /tmp/gma-ref-snapshot-{unit,lint,build,db,http}.log.

Migración 20261118211139 y snapshot aplicados sólo en GMA mediante conexión del
operador, sin JWT ni claims simulados. 807 filas originales / 773 cuentas / 34
sin UUID, 66 cuentas sin REF, una con Owner ausente. Original inalterado y SHA
igual al conservado en carga AUM. Retry remoto conserva un evento de publicación.
actor_id NULL y database_role postgres describen la vía real; autorización del
dueño y uploader de fuente conservados en campos separados.

Controles remotos posteriores: huellas de recuentos/sumas mensuales de AUM y
Revenue idénticas a las conciliadas con Excel; 44 meses por fuente. Enero–agosto:
los tres desgloses de etiquetas REF conservan ambas sumas exactas. 629 cuentas
observadas, 629 vinculadas, 486 etiquetas Client entre cuentas con AUM. No se
crearon identidades de clientes ni asignaciones con fechas inventadas.

RLS forzado en las tres tablas; anon/authenticated/service_role sin EXECUTE del
helper; authenticated sin SELECT directo de filas/originales. El ejecutor sólo
lee y las RPC publican proyecciones. Advisor de seguridad antes/después sin avisos
nuevos, conserva advertencia preexistente de contraseñas filtradas desactivada.
Sin modificar Auth, planes ni política de retención. UI remota todavía sin QA
visual por bloqueo guardado del navegador; no se buscó otra vía de sesión.

La consulta SQL completa del reporte con las nuevas CTE fue ejecutada además sobre
datos reales como lectura administrativa: enero–agosto devuelve ocho meses, 629
cuentas con REF y 27 grupos comerciales; AUM y Revenue coinciden con sumas
independientes. Se excluyó sólo la envoltura de control de sesión al ejecutar la
sentencia SELECT, sin crear JWT ni función alternativa persistente. No prueba una
sesión web real. Despliegue dpl_Ci6MfaHzau2vKpc93pgDgQ7KxRge READY y alias canónico
gma-software.vercel.app confirmado por Vercel; build remoto completado.

## Relectura de fuentes y contexto comercial — 2026-11-18

XML/ZIP de los cuatro Excel con Decimal y texto original, sin ejecución de
fórmulas/vínculos/macros. SHA-256 de AUM/REV/REF iguales a los almacenados en la
carga histórica publicada. Huellas de los recuentos y sumas mensuales exactas,
44 meses por fuente, coinciden entre Excel y consultas remotas GMA de sólo lectura.
Se conservaron 18.800 AUM, 17.893 Revenue y 12 importes Revenue ausentes originales.

REF: 807 pares unívocos, 773 cuentas financieras con Client, 66 sin REF, 34 REF
sin hechos financieros. Grupo consulta Owner Name payout de su fila en las 807
fórmulas; cada una de las 28 etiquetas actuales con grupo válido tiene un único
grupo. Advisor Name tiene 50 etiquetas, 22 comunes; no acredita identidades iguales.
Una de las 773 cuentas tiene Owner ausente; ninguna tiene error de Grupo. D68 es
error conservado de una referencia sin hechos. No se crearon asignaciones fechadas.

Master: 412 filas ACCOUNT; 409 coincidencias literales candidatas con REF, tres
sin coincidencia (258, 383, 384), una diferencia Owner (266 vs REF419). No se usa
la similitud de nombres ni espacios para forzar identidades/custodios.

openpyxl independiente read_only/data_only y keep_links=False confirma los cuatro
recuentos y los 12 vacíos. Hashes antes/después iguales. Informe y detalles fuera
del repo en analisis-faltantes-2026-11-18. Cambios de esta continuación documentales;
revisión de contenido y git diff --check, sin repetir suite de aplicación ni afirmar
clasificación publicada o QA visual remoto.

## Faltantes después de la importación histórica — 2026-11-18

Lecturas remotas administrativas, sin mutaciones, sólo en GMA:

- AUM: 18.800 filas, 745 cuentas, 433 alcances activos, cero importes NULL.
- Revenue: 17.893 filas, 749 cuentas, 225 alcances activos, 12 importes NULL.
- Ambos históricos cubren 2023-01 a 2026-08; cero alcances activos en septiembre.
- 655 cuentas compartidas por UUID, 90 sólo AUM, 94 sólo Revenue. Cero aliases
  contradictorios AUM/bd_REV ↔ Revenue/ACCOUNT dentro del mismo custodio.
- 18.800 filas AUM comprobadas contra import_cell de su original y aliases de
  ambos orígenes: cero diferencias de identidad. Cero cuenta/mes AUM duplicados.
- Los 658 alcances activos coinciden en recuentos y sumas exactas con las métricas
  de sus lotes revisados. Verifica integridad interna, no completitud del negocio.
- 839 cuentas sin cliente, ninguna asignación comercial ni FA activo. Agosto:
  546 cuentas con AUM, todas sin cliente. No se completó clasificación por nombres
  ni se extendieron condiciones actuales al histórico.

Validación local con datos exclusivamente sintéticos:

- 42 unitarias correctas; cinco de presentación, incluidas dos nuevas sobre
  redondeo y avisos. Casos: centavos con acarreo, negativos, cero, N/D, valores
  mayores al entero seguro de Number y detalle con precisión original.
- Lint completo y build Next con TypeScript correctos. Node 24.22.3 ya disponible
  en el runtime; ejecutados los entrypoints del package.json con Node porque npm
  no estaba en PATH. Prebuild local ejecutado antes de compilar; sin dependencias.
- HTTP completo correcto, Next compilado → RPC → PostgreSQL temporal: cierre sin
  AUM conserva NULL; aviso visible; enlace al último cierre del rango conserva
  filtro de cuenta; avisos de cliente/comercial e importe ausente; indicador
  redondeado y tabla exacta. Conserva las regresiones de importación/publicación,
  roles/RLS, originales privados, correcciones, comisiones y exportación.
- Primer intento HTTP falló por una aserción que no contemplaba el comentario
  separador de texto de React; se ajustó y el recorrido completo pasó. No fue una
  falla de datos. Clúster y servidores temporales eliminados.

Logs locales: /tmp/gma-data-diagnostics-unit.log,
/tmp/gma-data-diagnostics-build.log y /tmp/gma-data-diagnostics-http.log.
No hay nuevo despliegue ni QA visual remoto. Los datos reales no se modificaron.

## Regresión del Resumen enero–noviembre — 2026-11-18

- Suite HTTP sintética completa pasada con la aplicación Next compilada existente:
  Resumen enero–noviembre renderiza sin «Consulta no disponible»; API devuelve once
  meses, Revenue exacto, cierre AUM NULL y últimos tres meses NULL. Cubre también
  importación/publicación, cuentas, comisiones, exportaciones y roles existentes.
- Control negativo aislado: queries.test.sql falla con la función anterior porque
  intenta invocar advisor_at; pasa con la migración nueva. Clústeres temporales
  eliminados al finalizar. git diff --check correcto.

- Suite SQL completa pasada con migración 20261118185015: proyección, filtros,
  fuentes independientes, precisión, FA/vigencias, roles, concurrencia/restauración.
- queries.test.sql sustituye advisor_at por un error dentro de la transacción:
  todas las consultas siguen funcionando sin llamadas escalares por cuenta/mes.
  Enero–noviembre conserva once meses, Revenue 38.15 sintético y AUM final NULL;
  septiembre–noviembre no se convierten en cero ni reciben saldos arrastrados.
- EXPLAIN ANALYZE sobre datos reales, lectura administrativa: consulta optimizada
  1045.990 ms. Conciliación independiente remota del Revenue del rango correcta;
  cierre noviembre NULL y meses faltantes conservados. No equivale a una prueba
  autenticada desde el navegador; ese acceso sigue bloqueado por permiso guardado.
- Migración aplicada sólo en GMA. Verificados owner app_papa_executor, SECURITY
  DEFINER, search_path vacío y ACL originales. Sin cambiar límites de espera,
  hechos publicados ni número de filas de ambas fuentes.

## Excepciones revisadas de carga manual — 2026-11-17

40 pruebas unitarias correctas, typecheck/lint de archivos modificados y build
Next correctos. Regresiones nuevas conservan original/repetidos/NULL, agrupan
cuentas por custodio y rechazan decisiones mal tipadas/sin motivo, cuentas de
16 dígitos/científicas/calculadas, períodos incorrectos y montos con error. AUM
sin importe continúa bloqueado. Suite SQL completa correcta en clúster temporal,
incluyendo roles, concurrencia y restauración. El sandbox impidió inicialmente
memoria compartida de PostgreSQL; ejecución local autorizada fuera del sandbox.

REV real solo en memoria/local, sin subirlo: 17.893 filas/225 alcances conservados,
597 bloqueos antes y cero después de decisiones autorizadas, 12 montos NULL;
comparación de originales, fingerprints e importes exactos de todas las filas,
huella del Excel sin cambios. 584 avisos numéricos corresponden a 21 cuentas;
error descriptivo y repeticiones siguen conservados. Sin fixtures financieros en Git.

HTTP Next→PostgreSQL sintético completo correcto: nueva prueba registra decisiones,
rechaza cambiarlas en retry, prepara y publica un XLSX con cuenta numérica literal,
error descriptivo conservado y 2 movimientos/1 importe conocido; la tabla final
conserva un NULL y la consulta agrega 0.1, sin transformarlo en cero. Original
denegado a lector. Auth/Storage del arnés simulados; SQL y servidor Next reales.

## Alta de catálogo en la aplicación real — 2026-11-17

Se completó desde Chrome autenticado el flujo revisar/confirmar de cinco altas
de custodios solicitadas por el dueño: CS, JPM, PICTET, RJ y UBS. Cada revisión
indicó cero cuenta-meses afectados; cada guardado mostró confirmación de
auditoría y el listado terminó en 12 registros, con los cinco nuevos activos.
GWM existente se conservó; GMW no se creó por confirmación del dueño de que es
un error de escritura. Sin carga/publicación financiera ni modificación de Excel.
Verificación operativa de interfaz, sin suite de código por no cambiar runtime.

## Análisis de fuentes reales, sólo lectura — 2026-11-17

Lectura local de los cuatro libros proporcionados: ZIP/XML sin evaluar fórmulas,
valores numéricos originales como texto y Decimal con precisión 80 para controles.
Sin macros en los libros; vínculo externo REF no seguido. Resultados guardados de
fórmulas inspeccionados como caché, nunca recalculados. Originales sin modificar.

Recuentos de filas y cruces AUM/REF/REV corroborados independientemente con
openpyxl 3.1.5 del runtime: read_only=True, data_only=True, keep_links=False.
Assertions de pares únicos REF, correspondencia de ambos identificadores AUM,
acuerdo de custodios compartidos, conservación de filas/suma exacta AUM por
mes/custodio y unicidad cuenta/mes. Evidencias por coordenadas y controles privados
fuera del repositorio; documento técnico sin cuentas/nombres/montos reales.

Lectura con readBook/prepare actuales: AUM rechaza límite de filas, Revenue rechaza
límite expandido; REF se lee y bloquea identificadores numéricos/error de fórmula.
Primera llamada del arnés tuvo argumentos bytes/filename invertidos; se corrigió
y se registraron sólo los resultados finales con la firma correcta. Sin cambios
de implementación, instalación de paquetes, build, base remota o publicación.

Se revisó consistencia documental y git diff --check. Esta etapa no certifica
completitud ni importación financiera real. Falta implementar el flujo propuesto,
resolver/acreditar excepciones, confirmar unidades de tasas, medir capacidad y
conciliar con revisión del dueño antes de publicar. Ver source-import-analysis.md.

> Actualización vigente de comisiones (2026-11-17): ver [commissions.md](commissions.md).
> El nuevo pedido autoriza motor trimestral Balance × tasa anual /4 y conciliación
> local revisada. Supera para este motor las restricciones de sólo planificación
> y la fórmula ACT/365 anteriores; el helper aislado previo se conserva sin integrar.

**Estado vigente, 2026-11-15 (Buenos Aires): etapa 10 con Supabase real y Preview READY parcialmente verificados; puesta en uso pendiente.** Hay pruebas reales anon/lector, Storage privado, consulta/exportación vacía y revocación; no publicación remota ni conciliación real. SMTP/invitación diferidos por el dueño. La evidencia nueva está al final; los apartados anteriores son registros históricos.

## Registro inicial — etapas 2 y 3

Ejecutada el 2026-11-11, fecha local de Buenos Aires. Solo datos sintéticos identificados. No se leyeron Excel reales, variables secretas ni bases remotas. El directorio sigue sin repositorio Git; no hubo commits.

## Entorno y reproducción

- Supabase CLI 3.1.0 existente, `--version` y help de raíz, `migration new`, `db` y `db advisors` inspeccionados. Migración creada por la CLI y completada en SQL.
- PostgreSQL **17.11 (Homebrew)**, `btree_gist` disponible. Docker CLI existe pero el daemon no está iniciado.
- `npm run test:db` crea un clúster propio bajo `/tmp/app-papa-db.*`, con socket en directorio privado y TCP deshabilitado. Bases `app_papa_synthetic` y `app_papa_synthetic_restore`; ambas se eliminan con el clúster al terminar. No acepta URL de conexión ni usa el entorno de la app.
- `tests/database/bootstrap.sql` crea contratos mínimos: tres roles, `auth.users(id)` y `auth.uid()` basado en un claim de prueba. **No es una instancia Supabase ni valida el servicio Auth**. Restricciones, locks, transacciones y RLS se ejecutan en PostgreSQL real, sin mocks de esos mecanismos.
- Se aplicaron todas las migraciones desde una base vacía con `ON_ERROR_STOP`. Luego se exportó `pg_dump --schema-only --no-owner --no-privileges` y se restauró sin errores en otra base vacía. Esta restauración prueba objetos SQL; no prueba backups de datos ni objetos Storage.

## Resultados ejecutados

| Check | Resultado |
| --- | --- |
| Identificadores `00123` iguales en dos custodios | Permitidos, cuentas UUID distintas y ceros conservados. |
| Equivalencia resuelta repetida en mismo source/namespace/custodio | Rechazada por unicidad parcial. |
| Observaciones repetidas con custodio desconocido | Permanecen pendientes, sin cuenta. Resolver sin custodio se rechaza. |
| Personas con igual nombre | Permitidas, sin deduplicación automática. |
| Asignaciones y equipos principales solapados | Rechazados por exclusión GiST. Intervalos adyacentes aceptados y límite pertenece a una sola asignación. |
| Período diferente al primer día del mes | Rechazado. |
| Original no textual | Rechazado; hoja/fila/originales no pueden modificarse luego de capturados. |
| AUM duplicado por cuenta/mes/lote, con dos filas de origen distintas | Rechazado, sin sumarlo. |
| Revenue con mismo ticket/contenido en distintas filas | Se conservan ambas; se admite ajuste negativo y valor ausente. |
| Precisión | `100.000000000000000001` se conserva y agrega exactamente; NaN se rechaza. |
| Cuenta/custodio/período ajenos al lote | Rechazados por FK compuestas en las variantes probadas. |
| Conciliación de total incorrecto y filas inconsistentes | Publicación rechazada, lote/puntero sin cambios publicados. |
| Preparación | No aparece en vistas vigentes. |
| Reintento de publicación activa | Idempotente, sin repetir evento de publicación. |
| Corrección AUM | Solo reemplaza el custodio revisado; el otro mantiene su foto y la versión anterior sigue consultable en historia. |
| Historia | Actualizar hechos/originales de un lote publicado, borrar lotes/auditoría o limpiar puntero activo se rechaza. Borrar custodio con referencias se rechaza. |
| Agregación | Revenue se agrega por cuenta/mes antes del FULL JOIN; no multiplica AUM. Suma del fixture: AUM 220.000000000000000001, Revenue 2.9 con 3 valores presentes en 4 filas. |
| Concurrencia | Dos procesos PostgreSQL compiten por el mismo alcance y revisión inicial. Uno publica; el otro falla por revisión obsoleta. Quedan un lote publicado, un hecho vigente y un evento publish. |
| RLS y permisos | Todas las tablas con RLS habilitado y forzado. Anónimo no consulta; authenticated no cambia roles ni ejecuta publicación. service_role sin USAGE del esquema. Incluso con GRANT de lectura temporal, authenticated no ve filas preparadas ni vistas vigentes: default deny real. GRANTs de prueba se revierten. |
| Vistas | Ambas tienen `security_invoker=true`. |
| Diccionario | Comparación automatizada de los 29 headers de Revenue en orden contra `product.md` y columnas SQL; 15 tablas y ausencia de cascadas. |
| Runner | `bash -n scripts/test-database.sh` correcto. |
| Aplicación existente | `npm run lint`, `npm run typecheck`, `npm test` (3/3) y `npm run build` correctos. No se modificó la UI ni se conectó la base. |

Las pruebas SQL están en `tests/database/schema.test.sql`; la competencia entre sesiones usa `tests/database/concurrency.sql` y el runner. Los identificadores y valores de fixtures son inventados; no hay archivos financieros de muestra.

## Check no disponible y límites

Se intentó `npx --no-install supabase db advisors --type all --fail-on warn`. Falló con `DbConnectError / ECONNREFUSED 127.0.0.1:54322`; la CLI indicó iniciar Docker y `supabase start`. No se declaró limpio el asesor, no se reintentó contra proyectos remotos ni se inició un servicio ajeno. La inspección y las assertions locales de seguridad cubren el cierre actual, sin sustituir advisors ni una auditoría integral.

No se ejecutaron `supabase db reset`, `db pull`, `db lint`, PostgREST, Auth real, Storage real, invitaciones, políticas admin/lector completas, login, publicación desde la app ni E2E. La prueba de restauración SQL no es recuperación operativa de una versión financiera ni de archivos; la versión anterior sí quedó disponible e inmutable en la prueba. No hay benchmark, prueba de carga, recuperación ante caída de proceso o aislamiento serializable. La concurrencia ejecutada cubre dos publicadores bajo READ COMMITTED.

Pendientes antes de datos reales: crear un entorno Supabase dedicado autorizado, aplicar las migraciones y ejecutar advisors; cerrar/probar permisos por rol y Storage privado en la etapa 3; acordar formatos y correspondencias comerciales, implementar parser y conciliación con muestras privadas y un período real. El contrato `app-papa-imports` todavía no es un bucket creado. No se valida importación real ni se promete cobertura financiera completa.

## Etapa 3 — autorización, 2026-11-11

### Reproducción local ejecutada

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
npm run test:auth:http
```

`npm ci` debe ejecutarse con servidores apagados; se verificó también reinstalación limpia de esta etapa. Las pruebas SQL se ejecutan en PostgreSQL 17.11 temporal sin TCP ni URL externa. El bootstrap ahora incluye `auth.sessions`, `auth.jwt()` y las tablas mínimas `storage.buckets/objects` con RLS: **son contratos SQL sintéticos, no servicios Supabase**. Se crearon mediante fixtures, nunca en un proyecto conectado.

`tests/database/auth.test.sql` pasa: anónimo sin RPC ni filas; lector consulta AUM/Revenue activos y agregados exactos, sin preparación/originales, sin permisos de publicación/reemplazo/carga/configuración/asignación/rol; admin prepara, consulta originales, publica, reemplaza conservando historia, resuelve correspondencias y cambia vigencias. Se verificó publicación mediante la RPC pública bajo `authenticated`, no solo como superusuario.

Se probaron fuentes SELECT/INSERT admin, lectura/carga denegadas a lector/anónimo y UPDATE/DELETE bloqueados incluso creando otra política permisiva sintética. Esto verifica el motor RLS sobre el contrato de `storage.objects`; no verifica el gateway HTTP de Storage ni URLs públicas/firmadas reales.

La proyección corre como `app_papa_executor`, comprobado NOLOGIN/NOBYPASSRLS y sin membresía de `authenticated`. Una consulta directa bajo ese rol y JWT lector filtra el lote en preparación mediante RLS. La vista invoker no entrega payloads al lector, ni siquiera de Revenue publicado. Deshabilitar perfil, vencer `not_after`, eliminar sesión y carecer de perfil niegan lectura sin renovar el JWT sintético. `user_metadata.role=admin` no eleva a lector. Ningún rol de app modifica perfiles ni fabrica auditoría directamente.

Las pruebas anteriores de integridad y las dos sesiones concurrentes siguen pasando. `pg_dump --schema-only --no-owner --no-privileges` y restauración comprueban estructura; **no conservan ni validan propietarios/grants de recuperación de producción**. Un backup real debe preservar roles/ACL/propietarios y archivos y volver a probar esta matriz.

`test:auth:http` inicia su propio Next de producción y un proveedor HTTP local sintético en puertos efímeros; termina ambos. Usa el SDK SSR real con cookies, JWT HS256 ficticios y endpoints controlados: comprueba cableado y autorización de Next, no firma/implementación de Auth real. Probó cinco rutas privadas, acceso lector/admin, API de fuentes 401/403/200, Storage no invocado para lector, `no-store`, OTP con `create_user:false`, código inválido, invitación POST, bloqueo de Server Action desde otro origen, logout SSR, cookie anterior/identidad inválida rechazadas y JWT vencido con refresco fallido y limpieza de cookies. El proveedor de prueba nunca es fallback de producción.

`npm run build` produce diez rutas dinámicas más Proxy. Lint sin warnings, tipos y tres pruebas de configuración correctos. Auditoría producción ejecutada sin avisos; los siete avisos moderados de desarrollo preexistentes no se corrigieron en esta etapa. Revisión de TSX según checklist React: autorización dentro de operaciones, servidor por defecto, sin estado/efectos adicionales, etiquetas/input de código y botones Radix existentes. Sin prueba visual/lector de pantalla nueva.

Config TOML y plantillas revisadas: signup/anónimos cerrados, solo esquema public expuesto, Storage y correo local previstos. Esto no acredita configuración remota efectiva. Advisors local intentado con CLI 3.1.0 y falló por ECONNREFUSED en 54322 (stack no iniciado); queda pendiente.

### Verificación externa obligatoria pendiente

No hay proyecto dedicado enlazado, Auth/Storage/PostgREST local iniciados, SMTP real ni despliegue. Se listaron los tres enlaces Supabase conectados; solo proyectos ajenos, sin leer ni modificar sus tablas. El runtime no tiene credenciales privilegiadas. No se crearon usuarios ni se enviaron correos.

En destino dedicado, completar `auth.md` y verificar con anónimo, lector y admin reales:

- Signup directo y OTP con creación: rechazos efectivos y ninguna cuenta nueva.
- Invitación de un solo uso, correo/código, refresco real, vencimiento, logout, perfil sin habilitar y revocación.
- REST `admin_*` y RPC: lector sin preparación/originales y sin escrituras; admin autorizado, actor correcto e importaciones sintéticas; `app_private` no expuesto.
- Agregados publicados coincidentes con detalle seguro, sin multiplicar AUM ni incluir versiones anteriores.
- Descarga/listado/carga de Storage y API de fuentes; URL pública denegada; lector sin capacidad de emitir URL firmada. Revisar/caducar enlaces firmados preexistentes si los hubiera.
- Advisors y revisión de propietarios/policies/default grants del entorno real, caché y cookies HTTPS en despliegue.

No se declaró importación real conciliada ni seguridad de un entorno remoto validada. El importador Excel y su UI siguen fuera de esta etapa.

## Etapa 4 — preparación XLSX/CSV, 2026-11-12

### Checks ejecutados

- Lectura de AGENTS, producto/decisiones/progreso/validación, guía y esquema/código existente. `git status --short` sigue indicando que no es repositorio; no se inicializó Git. Búsqueda de extensiones en proyecto/Downloads sin abrir archivos ajenos: ninguna muestra identificada de estas fuentes; no se confirmó necesidad de .xls.
- Documentación primaria y changelog de Supabase, Storage/RPC/RLS, read-excel-file, csv-parse, fflate y saxen consultados; versiones/actividad/engines en npm y código instalado revisados. Cuatro dependencias directas exactas con lockfile. `npm install`, `npm ls --depth=0` y `npm audit --omit=dev`: instalación/árbol correctos y **0 vulnerabilidades de producción reportadas**. Se mantienen siete avisos moderados de desarrollo ya registrados. Sin nueva reinstalación limpia `npm ci` en esta etapa; no se declara ejecutada.
- `npm run lint`, `npm run typecheck`, `npm test` (**13 pruebas: 3 anteriores + 10 de importaciones**), `npm run build` y `npm run test:auth:http`: correctos en el estado final. Doce rutas dinámicas más Proxy, incluidas las dos rutas nuevas del API. `node --check scripts/test-auth-http.mjs` y `bash -n scripts/test-database.sh` correctos.
- Fixtures exclusivamente sintéticos generados para las tres fuentes en CSV/XLSX, con casos problemáticos. Los headers de código se comparan automáticamente con los 6/29/7 headers de producto. Pruebas cubren decimales exactos (incluido 88259496234518.57), suma 0.1 + 0.2 - 0.05 = 0.25, convenciones contradictorias/ausentes, negativos, ausencias null, tipos XLSX, identificador numérico bloqueado, fórmula con/sin caché, múltiples hojas y fila física, headers normalizados/colisionados/faltantes, CSV multilínea/comillas/delimitador/UTF-8, .xls rechazado, macros, ZIP que supera expansión y límites de bytes/filas. Texto CSV con `=` permanece inerte. Valores escalares XLSX conservan su representación original; booleano usado como importe se rechaza.
- Fixture de **5.000 filas AUM**: 122.461 bytes comprimidos; lectura + validación final **133 ms** en esta máquina, otras ejecuciones observadas entre ~117 y 255 ms. La primera y última fila comparten referencia y ambas reciben conflicto, cruzando el límite de 250. Total de control exacto 50. No se midió memoria máxima, carga concurrente, todas las combinaciones de límites ni tiempos de Storage/hosting con archivos representativos. Esta medición no acredita capacidad de producción.
- `npm run test:db`: migraciones desde cero en PostgreSQL 17.11 temporal sin TCP; las anteriores restricciones/permisos/publicaciones concurrentes/restauración de schema-only siguen pasando. Nuevo `imports.test.sql` prueba anónimo/lector/admin con roles y RLS reales de PostgreSQL: carga idempotente, mismos bytes en otro alcance permitidos como advertencia, dos chunks con reintento sin duplicación, configuración congelada, Revenue idéntico conservado, totales numeric exactos, rollback de todo un chunk si una fila falla, fallo vacío sin cero, preparados ausentes de `published_metrics/published_totals`, prohibición de ready/publicación y de desactivar bandera por UPDATE. No es un mock de RLS, pero Auth/Storage siguen siendo contratos SQL sintéticos, no servicios Supabase.
- `test:auth:http` inicia Next de producción y proveedor HTTP **sintético explícito** con el SDK SSR real. Comprueba POST/GET directos sin sesión o con reader denegados antes de Storage, origen ajeno denegado, carga admin y reintento con un único lote, bytes originales en endpoint privado simulado, inspección de hojas, parser de servidor, tres filas de Revenue (dos iguales y un negativo) con total string **0.15**, ceros de ACCOUNT conservados, repetición de procesamiento sin agregar filas y ausencia de la cuenta preparada en HTML del dashboard. Otro archivo de **251 filas** confirma primer chunk 250/validating y segunda petición 251/needs_resolution, bloqueo de cambio de convención después del primer chunk, total exacto 25.1 y paginación de última fila. También rechaza >2 MiB y .xls con instrucciones. Continúan pasando OTP/invitación/logout/refresco y accesos anteriores. Los mocks son solo contratos de red de prueba; nunca fallback de aplicación ni prueba de seguridad efectiva de Supabase remoto.
- Revisión React/TSX: servidor para autorización/consultas, parser solo Node, props mínimas, estado de UI en eventos y sin efectos, campos etiquetados, botones deshabilitados durante peticiones, mensajes de error/status, región desplazable enfocable y tabla Radix existente con importes alineados a derecha.
- Chrome sobre build local y proveedor sintético: ingreso, Importaciones, apertura del historial y vista previa Revenue **3 filas / USD 0.15 / repetidas conservadas 1**, custodio y estado en español; revisión visual de espaciado y tabla. A 390 × 844 se verificó `documentElement.scrollWidth === innerWidth === 390`; viewport restaurado después. Sin errores de aplicación observados; los warnings capturados provenían de una extensión ajena (chrome-extension). No se hizo auditoría con lector de pantalla ni recorrido completo de teclado. Captura solo sintética en `/Users/franciscolang/.codex/visualizations/2026/11/12/01a1d02b-5685-7783-be53-9d31d2435600/importaciones-sinteticas.png`, fuera del repo.
- Intento de automatizar el selector Chrome: bloqueado por falta de «Allow access to file URLs» en la extensión; **no se modificó ese permiso**. Por eso no se acredita selección/subida completa mediante el navegador. La carga multipart y el recorrido completo sí se verificaron por HTTP. Navegador de revisión sin recursos remotos ni archivos reales. Servidores/proveedor temporales detenidos y script temporal de revisión retirado.
- CLI `migration new import_preparation` generó la tercera migración. `db advisors --type all --fail-on warn` intentado solo local: ECONNREFUSED en 127.0.0.1:54322; no se presenta como aprobado. No se aplicaron migraciones a servicios conectados ni se tocaron otros proyectos.

### Pendiente real

Auth, Storage, PostgREST y advisors en Supabase dedicado, navegador con selector habilitado, entorno de hosting y volumen representativo, muestras privadas de AUM/Revenue/FA y conciliación de un período real. Probar originales/enlaces/roles/JWT efectivos y recuperación tras una caída real del proceso en destino. La reanudación local se prueba mediante peticiones separadas y transacciones SQL; no se simuló una caída del hosting.

No se afirma conciliación financiera real, cobertura completa, publicación implementada en UI, correspondencias resueltas ni historia comercial fechada. Los números de cuentas almacenados como números quedan bloqueados; no todo daño previo de ceros en CSV es detectable. Fórmulas con caché pueden estar desactualizadas y requieren revisión en Excel. Fuentes multi-custodio/período, formatos ambiguos adicionales y porcentajes no primarios requieren contratos/muestras. Uso y límites completos en [imports.md](imports.md).

## Etapa 5 — correspondencias y publicación, 2026-11-13

Todos los datos de prueba son sintéticos. No se inspeccionaron fuentes reales, secretos, tablas remotas ni despliegues. El directorio sigue sin Git. Documentación primaria consultada: [changelog Supabase](https://supabase.com/changelog.md) (incluido cambio CLI 3 a destino local por defecto), [funciones/permisos](https://supabase.com/docs/guides/database/functions), [locks PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html). Sin actualización de dependencias.

### Reproducción y resultados

- `npm run lint`, `npm run typecheck`, `npm test`: correctos, **13/13** unitarias existentes de configuración/parsing. La lógica nueva de publicación se verifica en SQL, sin reproducir el motor de locks/transacciones en un mock.
- `npm run test:db`: aplica las cuatro migraciones desde cero en PostgreSQL 17 temporal sin TCP ni URL externa. Suites anteriores de esquema/Auth/preparación siguen pasando. Restauración pg_dump schema-only a otra base vacía correcta; no prueba backup de datos/Storage/ACL de producción.
- Nueva `tests/database/publication.test.sql`, ejecutada con `authenticated`, perfiles/sesiones sintéticos y RLS real: todas las filas deben estar resueltas, custodio/evidencia obligatorios; UUID separados por custodio con mismo ACCOUNT; resolución/retry sin duplicar cuentas o comerciales; escritura financiera directa denegada; confirmación de alcance/token obligatorios; filas idénticas Revenue y ajuste negativo conservados con suma exacta 0.15; número de cuentas sin comercial no se multiplica por detalle y su monto sigue en total; 29 columnas Revenue retenidas exactamente con orden invertido y decimal 0.123456789123456789; candidatos que no concilian revierten hechos; AUM con aliases distintos resueltos a igual UUID bloquea sin suma ni parcialidad; cero filas bloqueado aunque el resumen no declare errores.
- La misma suite inyecta una excepción en un trigger **después** de modificar el puntero activo: falla la publicación completa, lote sigue ready, sin datos públicos ni evento publish parcial. Al desactivar la inyección, el retry publica; repetirlo conserva un único evento. Mismo archivo con otra request genera otra versión; sustituye sin sumar. Corrección del custodio A cambia su total 0.15 → 2 y conserva custodio B=9: global 11, historia anterior intacta; retry de superseded falla.
- FA: se exige columna comercial y fechas explícitas, se conservan Owner/Broker/OLD Owner/Grupo, se puede resolver inicialmente sin comercial y completarlo con creación explícita/retry sin duplicar persona. Fecha desde 2026-02-15 y hasta exclusiva 2026-04-01: enero sin asignar, febrero asignado al cierre y abril sin cobertura. OLD Owner no crea account_assignments. FA superpuesto contra otro alcance activo se rechaza; resolución y cambios tienen auditoría.
- `tests/database/publication-concurrency.sql` + runner: preparan/revisan tres candidatos por la API pública bajo authenticated. Dos sesiones de **administradores distintos** compiten con expected_active=null: exactamente una publica y la otra devuelve revisión obsoleta. Una tercera candidata se vuelve a revisar contra el ganador y dos sesiones la publican simultáneamente: ambos éxitos, una fila Revenue activa con importe 3 y exactamente dos eventos publish en el alcance (ganador anterior + reemplazo), sin evento adicional por retry. También continúa la carrera anterior de publicación interna.
- `npm run build`: correcto, **14 rutas dinámicas** más Proxy. `npm run test:auth:http`: correcto con Next de producción y proveedor HTTP sintético. Anónimo/lector no llegan a RPC de gestión; lector se redirige desde Correspondencias. Admin despacha inspect/resolve/review/publish con sus parámetros; JSON mayor a 16 KiB, forma inválida y origen ajeno se rechazan. Conflicto de versión se traduce a 409 en español; respuestas privadas no-store. Regresiones de carga/251 filas/cursor, preview, OTP/invitación/logout/fuentes siguen pasando. Este proveedor solo prueba cableado y fronteras HTTP, no simula ni acredita atomicidad financiera/Supabase real.
- `node --check scripts/test-auth-http.mjs` y `bash -n scripts/test-database.sh`: correctos. Checklist React aplicado a las TSX modificadas: consulta/autorización en servidor, operaciones protegidas, datos acotados, estado en eventos, bloqueo de doble envío con ref/disabled, campos etiquetados, mensajes alert/status, originales inertes y tablas desplazables enfocables. Reutiliza Radix y CSS existentes; sin bibliotecas nuevas.
- `supabase db advisors --help` leído y `npx --no-install supabase db advisors --type all --fail-on warn` intentado solo local: **ECONNREFUSED 127.0.0.1:54322**. No se declara aprobado ni se apunta a otro proyecto.

### Límites de esta verificación

No se ejecutó Supabase efectivo (PostgREST/Auth/Storage), deploy, conciliación con Excel real, nueva auditoría npm, prueba de carga, browser E2E o inspección visual nueva de Correspondencias, lector de pantalla ni caída real de hosting. SQL usa contratos mínimos Auth/Storage; HTTP usa un proveedor sintético separado, nunca fallback de producción. El fallo inyectado prueba rollback del motor, no recuperación del hosting. No se validaron backups operativos de datos/archivos ni permisos remotos. La serialización global y resolución manual por fila son suficientes para el MVP acotado, no una promesa de rendimiento a volumen real. No se implementó dashboard ni se declara aptitud para operar con datos reales.


## Etapa 6 — consultas e indicadores, 2026-11-13

Solo datos sintéticos, PostgreSQL nativo temporal y proveedor HTTP sintético. No se leyeron archivos financieros reales ni secretos y no se consultaron/modificaron bases remotas. Documentación primaria: [changelog Supabase](https://supabase.com/changelog.md), [funciones y permisos](https://supabase.com/docs/guides/database/functions), [calendario y ventanas PostgreSQL](https://www.postgresql.org/docs/current/functions-window.html). Se revisaron las guías Supabase/PostgreSQL y el help de CLI antes de generar `migration new aggregate_queries`; no se cambiaron dependencias.

### Ejecutado y resultados

- `npm run lint`, `npm run typecheck`, `npm test`: correctos, **16/16**. Tres pruebas nuevas: parámetros tipados y consistencia JSON/CSV; rechazo de fechas/rangos/UUID/duplicados/valores desconocidos/página sin revisión; CSV con decimales de 18 posiciones, negativo, N/D, filtros y texto tipo fórmula inerte. Los montos no pasan por Number.
- `npm run test:db`: correctas las cinco migraciones desde cero y todas las suites anteriores, carreras de publicación y restauración schema-only. Nueva `tests/database/queries.test.sql` ejecuta la RPC bajo authenticated con admin/reader y RLS; ambos resultados iguales. No se simula SQL con un mock.
- Fixture obligatorio: A enero AUM=100 y Revenue 2+3+5=10; febrero 120/12; ambos meses cierre=120 y Revenue=22. Variaciones de febrero 20% para ambas fuentes; enero sin base devuelve null. Cero existente no desaparece ni produce porcentaje infinito. Cuenta solo-AUM, solo-Revenue, ajuste negativo, valor nulo, custodio separado, cierre ausente, mes completo ausente y conjunto totalmente vacío conservados. Comparación con población distinta da N/D.
- Fixture ampliado: global enero–febrero AUM=119 (subtotal conocido) y Revenue=38, cinco cuentas con fila AUM al cierre, cuatro valores, seis cuentas con Revenue; dos cuentas observadas sin foto de cierre. Sin comercial AUM=-1 y Revenue=16. Fuentes y conteos no se multiplican por tres aliases de A. Las cantidades faltantes no se convierten a importes cero.
- Cambio de equipo del comercial el 15/02: equipo 1 Revenue=10 del rango y AUM null; equipo 2 Revenue=12 y cierre=120. FA versionado de B válido 15/01–01/02 se lee para el lector exclusivamente por proyección; enero equipo 1 AUM=150 incluyendo A/B. Sin cobertura posterior queda sin asignar. Mayo prueba numeric `100.123456789123456789` y Revenue repetido `0.1 + 0.1 - 0.05 = 0.15` con tres registros.
- Conciliación SQL: seis dimensiones por ocho escenarios (global, cada filtro y combinación de todos), sumas de filas AUM/Revenue iguales al total con los mismos filtros; conteos distintos no se suman como importes. Total independiente de página, orden estable y siguiente página distinta. Una corrección real del fixture cambia Revenue 38→39 sin alterar AUM/otro custodio; la revisión anterior falla con 40001. Una versión sustituida y un candidato listo por 999 no se suman. Originales/tablas dimensionales siguen inaccesibles al lector; anónimo y sesión vencida denegados. Fechas, dimensión arbitraria y límite excesivo rechazados.
- `npm run build`: correcto, **15 rutas dinámicas** más Proxy, incluida `/api/consultas`. `npm run test:auth:http`: correcto sobre Next de producción con proveedor **sintético**; lector/admin reciben totales, JSON y CSV despachan los siete filtros y la misma paginación exactamente a la misma RPC. Anónimo/perfil inválido/sesión revocada no llegan a la consulta; claves desconocidas/duplicadas y páginas sin revisión se rechazan antes del backend. Se comprueban CSV, texto inerte, headers de revisión/siguiente página y no-store; errores de revisión/permisos/backend se traducen a 409/403/503 sin mensaje interno. Las suites anteriores de carga, gestión, login y fuentes siguen pasando.
- `node --check scripts/test-auth-http.mjs` y `bash -n scripts/test-database.sh`: correctos. Revisión de seguridad: wrapper invoker, implementación privada con dueño ejecutor sin BYPASSRLS, search_path vacío, EXECUTE revocado a PUBLIC/anon/service_role, sesión/rol vigentes y RLS; nuevas políticas de clasificación solo al ejecutor, sin grants al lector ni escrituras nuevas. Sin metadatos editables ni claves privilegiadas.
- `npx --no-install supabase db advisors --type all --fail-on warn`: intentado exclusivamente local; **ECONNREFUSED 127.0.0.1:54322**, stack Supabase sin iniciar. No aprobado. Git continúa sin inicializar; sin commits ni despliegue.

### Límites y validación pendiente

No se probaron PostgREST/Auth/Storage efectivos, archivos Excel reales, volumen representativo, EXPLAIN/benchmark de consultas agregadas, browser E2E, accesibilidad visual nueva, backups de datos/Storage ni deployment. No se agregaron índices sin evidencia: se revisaron los existentes contra las consultas y se documentaron candidatos condicionados a planes en aggregate-queries.md. El CSV es de la página solicitada, no una descarga completa automática; cada página conserva el total global. El dashboard aún no consume esta capa. Cobertura contractual pendiente: universo observado no acredita todas las cuentas esperadas ni un mes sin movimientos. Antes de uso real: destino dedicado, migraciones/permisos/servicios efectivos, cobertura/muestras/correspondencias/vigencias acordadas y conciliación de un período con originales privados.

## Etapa 7 — Resumen y Análisis comercial, 2026-11-13 (Buenos Aires)

### Cambios y frontera verificada

Pantallas de servidor → `queryReport` → misma RPC `aggregate_report` → versiones publicadas. Sexta migración agrega solamente proyección: rankings globales antes de LIMIT, participaciones numeric, opciones observadas y timestamp de publicación. Sin nuevas tablas financieras, escrituras desde el dashboard, paquetes, cambios de lockfile, datos reales ni destinos remotos. Se conserva el ejecutor NOLOGIN/NOBYPASSRLS, check de perfil/sesión, search_path vacío y wrapper invoker. RLS y permisos se ejecutaron en PostgreSQL real temporal; no se abrieron tablas dimensionales al lector.

### Checks ejecutados

- `npm run lint`, `npm run typecheck`, `npm test`: correctos, **19/19** pruebas. Nuevas pruebas: agrupación decimal exacta sin Number, ausencia/cero/negativos, redondeo de presentación de porcentaje con BigInt, parámetros de pantalla/mes de Buenos Aires, UUID y reinicio de página al cambiar filtro/desglose. No se recalculan importes o participaciones en JS.
- `npm run test:db`: correcto desde cero con las seis migraciones, SQL de etapas anteriores, concurrencia y restauración. Fixture de consultas extraído a `tests/database/query-fixture.sql` para compartir **los mismos hechos** con el navegador. Assertions nuevas: ranking global antes de paginar; participación sobre total filtrado de todas las páginas; 100 % en cuenta filtrada; participación N/D con negativos, importes ausentes, ajuste neto positivo y denominador cero; opciones/fecha seguras para lector. Siguen pasando 100/10 → 120/22, global 119/38, cierre ausente, cuenta con una fuente, exactitud, historia, aliases, revisiones y roles.
- `npm run build`: correcto con rutas privadas dinámicas. `node --check scripts/test-dashboard.mjs`: correcto. Revisión React: consultas/ensamble en servidor, un componente cliente para gráficos sin cálculos financieros, navegación/paginación por URL, sin efectos o estado duplicado de filtros; semántica nativa/Radix y nombres accesibles.
- `npm run test:auth:http`: correcto tras ajustar el contador de RPC para medir **llamadas nuevas no autorizadas**, pues las pantallas autorizadas ya consultan datos. Continúan checks de sesión, roles, no-store, originales privados, JSON/CSV, preparación y publicación. El rechazo intencional de CSRF no representa fallo de la suite.
- `npm run test:dashboard -- --serve`: correctas sus assertions HTTP contra **PostgreSQL temporal real** bajo sesión/rol lector. Next → RPC HTTP → SQL → JSON/HTML: cuenta A AUM 120 / Revenue 22; cambios mensuales 20 USD y 2 USD, 20 %; global 119/38; ranking equipo 2 120/12 en primera página sin cambiar el total; meses 03/2026 y 04/2026 nulos; exactitud 100.123456789123456789; vacío, filtro inválido y fallo de consulta sin errores internos. Auth y transporte son sintéticos; el arnés no equivale a PostgREST/Auth/Storage efectivos.
- Chrome con ese arnés: selección de cuenta y envío del formulario; URL con UUID; Resumen 120/22; detalle mensual 100→120; navegación a Análisis conservando filtros; equipo 2 120/12 y equipo 1 N/D/10, con drilldown a cuenta del equipo 1 N/D/10. Valores de participación 54,55 % y 45,45 % proceden del 12/22 y 10/22 SQL; valor exacto accesible en el detalle.
- Chrome: páginas de un registro por equipo; primera página equipo 2 y segunda **Sin asignar -1/16**, ambas con total 119/38. Marzo/abril ausentes tienen etiquetas N/D, hueco en AUM y barras ausentes, sin arrastre ni cero. Tabla de cobertura abierta: publicación/faltante por fuente/mes/custodio, datos sin comercial/equipo y hora local. Carga observada en navegación con Suspense; vacío observado para 2027; error activado deliberadamente en el arnés y observado como alerta, sin renderizar datos vacíos ni revelar el error interno.
- La revisión visual detectó dos ajustes y se verificaron en el build corregido: quitar ceros decimales finales sin alterar el valor y asegurar dominio con **cero** en Recharts. Cuenta negativa: AUM -20→-10, Revenue -2/-1, barras negativas distintas desde cero, sin torta; la escala anterior recortaba una barra. Etiquetas de último mes tienen margen interno.
- Adaptación observada a 390 y 320 px: `scrollWidth` del documento igual al viewport; gráfico y tabla contenidos localmente (324 px de ancho a viewport 390). Teclado: Enter en «Ir al contenido» enfoca `main#contenido`; Enter abre el detalle de Sin asignar. Selectores y formularios nativos; tablas desplazables con foco. No se afirma auditoría con lector de pantalla ni accesibilidad integral.
- Logs del navegador observados: avisos de una extensión (`chrome-extension://…`), sin errores de aplicación identificados en el recorrido. No se modificaron extensiones ni permisos.
- `supabase db advisors --type all` se intentó en destino **local** y falló por ECONNREFUSED 127.0.0.1:54322 (stack Supabase no iniciado). No aprobado. PostgreSQL temporal y suites de seguridad no sustituyen advisors ni servicios efectivos.
- Documentación oficial consultada: [funciones de Supabase](https://supabase.com/docs/guides/database/functions), [changelog](https://supabase.com/changelog.md), [funciones de ventana PostgreSQL 17](https://www.postgresql.org/docs/17/functions-window.html) y guía instalada de `page/searchParams` de Next 16.4. No hubo upgrade de dependencias.

### Repetir la comprobación visual

1. Con Node 24 y PostgreSQL locales: `npm ci` solo si faltan dependencias; luego `npm run build` y `npm run test:dashboard -- --serve`. Abrir la URL **/fixture-login** impresa. Todos los datos se llaman SINTETICO y están en clúster/servidores efímeros aislados. No configurar un Supabase remoto para este recorrido.
2. En Resumen, desde enero hasta febrero de 2026, elegir cuenta `20000000-0000-0000-0000-000000000001`, aplicar. Esperar AUM 120, Revenue 22, cambio AUM 20 (20 %), cambio Revenue mensual 2 (20 %), una cuenta y un cliente con AUM. Abrir importes de los gráficos: AUM 100/120; Revenue 10/12. URL solo con UUID para la cuenta, sin nombres/números externos.
3. Abrir Análisis filtrado y Equipos: equipo 2 120/12 y equipo 1 N/D/10. Abrir equipo 1: detalle cuenta N/D/10, sin reasignar enero al equipo actual. Volver a la vista sin filtro de cuenta; global 119/38, sin asignar -1/16. Clientes y Comerciales deben conservar ese global bajo iguales filtros.
4. Para comprobar paginación, agregar `agrupar=team&limite=1` a la URL comercial con el rango. Recorrer Siguiente: total 119/38 en todas las páginas. Si una publicación cambia la revisión, la página debe pedir reiniciar; no mezclar cifras entre revisiones.
5. En Resumen extender hasta mayo: marzo/abril N/D, huecos visibles; AUM cierre exacto USD 100,123456789123456789, Revenue rango USD 38,15. Cuenta `…0004` y enero–febrero: AUM -10 y Revenue -3, barras mensuales -2/-1 desde cero. Cuenta `…0006`: ceros reales visibles, porcentaje con base cero N/D.
6. Abrir cobertura por fuente/mes/custodio. Ver faltantes, importes ausentes y cuentas sin asignación por mes. Fuente publicada no debe aparecer como cobertura completa; FA contractual sigue N/D.
7. Rango enero–febrero 2027: estado vacío. «Limpiar filtros» elimina selección y vuelve al mes actual de Buenos Aires. La URL de control sintético impresa terminada en `/error` activa un fallo del proveedor: recargar aplicación debe mostrar alerta de consulta, no vacío. Abrir cualquier otra ruta del control restaura el proveedor. Ese control pertenece solo al arnés, no al producto.
8. Probar Tab/Enter, foco visible, detalle exacto y tablas a 320/390 px. Terminar con Ctrl+C: el arnés cierra sus servidores y elimina únicamente su clúster temporal. No deja una demo ni un bypass en la aplicación.

### Límites

Sin archivos reales conciliados, proyecto Supabase dedicado, servicios reales de Auth/PostgREST/Storage, despliegue, volumen representativo, auditoría integral de accesibilidad o prueba con lector de pantalla. Fecha mostrada es publicación del alcance, no edición de asignaciones manuales. Opciones de filtro observadas limitadas a 100 por dimensión; cuentas por UUID. Detalle agregado disponible en estas pantallas; directorio completo, identificadores externos, originales/historia de cuentas y administración corresponden a etapa 8. No se añadió exportación completa, advisory, rendimiento ni ratio Revenue/AUM.

## Etapa 8 — Cuentas y administración mínima, 2026-11-15 (Buenos Aires)

### Entorno y comprobaciones

Sin repositorio Git inicializado, muestras reales, credenciales privilegiadas, modificaciones remotas ni despliegue. Sin paquetes nuevos ni cambio del lockfile. Se revisaron el [changelog de Supabase](https://supabase.com/changelog.md), el [cambio de destino CLI 3](https://supabase.com/changelog/supabase-cli-v3), [funciones/permisos](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [restricciones de rangos PostgreSQL](https://www.postgresql.org/docs/current/rangetypes.html#RANGETYPES-CONSTRAINT). La migración se generó con CLI 3.1.0 `migration new accounts_administration`; Node 24.19.0. No se usó una URL de base remota.

- `npm run lint`, `npm run typecheck`, `npm test`: correctos; **21/21** unitarias. Nuevas assertions de parámetros del directorio (000123 permanece texto), duplicados/orden/límites inválidos, filtro histórico, enlaces que conservan búsqueda/rango/entidades y reinician revisión/página; solicitudes de preview/save con UUID y motivo explícitos, rechazo de operaciones desconocidas, claves heredadas y payload alternativo al confirmar.
- `npm run test:db`: correcto con siete migraciones, suites existentes de esquema/Auth/importaciones/publicación/indicadores, pruebas nuevas de cuentas/modelo, carreras anteriores y restauración schema-only. PostgreSQL 17 temporal real sin TCP, Auth/Storage por contratos SQL mínimos. La suite `accounts.test.sql` usa authenticated/RLS y el mismo fixture sintético del dashboard.
- SQL nuevo: buscar 0001 devuelve una sola cuenta con múltiples aliases, cierre AUM120/Revenue22, referencia equipo2 y aviso de cambio; páginas sin repetición y revisión estable; detalle con cuatro registros legítimos paginados y enero equipo1/febrero equipo2; cuenta solo-AUM sin cierre y cuenta solo-Revenue permanecen; filtro histórico de equipo limita registros del detalle. Admin ve originales/procedencia, lector ve identificadores resueltos/métricas y nunca secreto/celdas/nombre de archivo; lector no lee auditoría privada.
- SQL de gestión: preview que mueve una fecha dentro del mes no altera atribución; cerrar el 30/01 cambia dos cuenta-meses de enero (uno asignado manualmente y otro por FA activo). AUM100/Revenue10 de A conservados; cambia equipo a sin asignar. Preview no persiste la vigencia ni su auditoría. Save aplica una vez, retry no duplica evento; otra revisión obsoleta falla con 40001. Exclusion constraint rechaza membresía superpuesta; trigger rechaza asignación contra FA activo; referencias inexistentes e inactivas fallan en base. Baja de cliente conserva datos/referencias; borrado denegado. Rutas SQL directas del lector, incluso con user_metadata admin falsificado, y helper interno quedan denegadas. Escritura directa de vigencias también se rechaza al admin API. La revisión final agregó un caso de cuenta/alias creado al resolver un lote todavía ready: lector no lo encuentra por búsqueda, no accede al detalle por UUID y tampoco aparece en catálogos/sugerencias; el alias en preparación de una cuenta ya publicada también queda oculto.
- `npm run build`: correcto con `/cuentas/[id]` y `/api/modelo` dinámicos. `npm run test:auth:http`: correcto con Next de producción y proveedor HTTP **sintético**. Configuración responde 200 a lector y admin; lector no recibe controles de edición. POST directo de preview/save por lector/anónimo devuelve 403/401 sin despachar RPC; origen ajeno, cuerpo mayor a 16 KiB y motivo inválido se rechazan; admin despacha ambos pasos con no-store. Regresiones anteriores de sesión, importaciones, publicación, JSON/CSV y archivos siguen pasando.
- `npm run test:dashboard -- --serve`: correctas assertions Next → RPC HTTP → **PostgreSQL temporal real** por rol. Continúan 120/22, global119/38, rankings/faltantes/error/vacío. Nuevas assertions HTML: búsqueda 0001, aviso de cambio, historia de ambos equipos, páginas de Revenue, secreto solo admin, filtro de equipo anterior, catálogo de lector sin botón de edición. Alta admin de equipo con preview y save persiste y muestra motivo en auditoría; POST del lector devuelve 403. Auth/transporte son sintéticos fuera del producto; no acreditan Supabase efectivo.
- Navegador in-app sobre ese arnés: navegación Resumen → Cuentas conservó enero–febrero; búsqueda 0001 devolvió una sola cuenta 120/22; detalle mostró enero100/10 equipo1, febrero120/12 equipo2 y retorno con búsqueda/rango. Lector sin controles administrativos. A 390 px, documento390/viewport390 y tablas con scroll local de ancho324; sin desborde global en el detalle observado.
- Navegador admin, build corregido: Membresías → editar equipo1 → hasta30/01 con evidencia y motivo sintéticos → Revisar. La comparación muestra campos de negocio antes/después y dos cuentas en enero con AUM100/Revenue10 y AUM50/Revenue N/D; el catálogo todavía mantiene hasta15/02. Confirmar muestra éxito; tras refresh hasta30/01 y un evento UPDATE con actor/fecha/motivo, antes/después desplegables. Solo se modificó el clúster efímero. Se conservó una captura sintética local de auditoría en `/tmp/app-papa-stage8-auditoria.jpg`; no contiene fuentes reales.
- Checklist React aplicado: lecturas/autorización de páginas en servidor; originales solo bajo rol admin; estado de edición en eventos; bloqueo de doble envío y feedback; token se invalida al editar formulario; campos etiquetados, botones nativos/Radix, regiones tabulares enfocables y scroll local. Sin cálculos de dinero en JS ni nuevas bibliotecas. `node --check` de ambos arneses y `bash -n scripts/test-database.sh` correctos.
- `supabase db advisors --type all --fail-on warn`, exclusivamente local: **ECONNREFUSED 127.0.0.1:54322**. Stack Supabase sin iniciar; advisors no aprobado. La revisión de permisos SQL no sustituye servicios reales.

### Reproducir y límites

Con Node24/PostgreSQL locales: `npm run build`, `npm run test:db`, `npm run test:auth:http`, `npm run test:dashboard -- --serve`. El último imprime logins sintéticos separados para lector/admin y un control de fallo. En Cuentas elegir enero–febrero2026 y buscar 0001. En Configuración/Membresías, editar la de equipo1 y acortar hasta30/01: revisar los dos cuenta-meses antes de confirmar; comprobar auditoría. Finalizar el arnés con Ctrl+C sobre el proceso Node para cerrar servidores y su clúster temporal. No es una demo/fallback del producto.

La cobertura general del directorio usa filtros de período/entidades; la búsqueda textual acota sus filas, con etiqueta explícita. Las métricas por fila, el agregado filtrado del detalle y sus registros respetan cierres mensuales; los meses fuera del filtro se muestran como contexto. Directorio incluye cuentas sin hechos; cobertura financiera continúa basada en observaciones, sin afirmar completitud contractual.

Pendientes: Supabase dedicado con Auth/PostgREST/Storage reales y advisors, migración autorizada del destino, Excel privado conciliado, cobertura y correspondencias/vigencias reales, volumen/planes de ejecución, accesibilidad integral/lector de pantalla, recuperación de datos/archivos y despliegue. Opciones observadas de filtros hasta100; sugerencias administrativas hasta250 con UUID alternativo; páginas de catálogo/auditoría25. Preview completo hasta5000 cuenta-meses afectados (se bloquea superar el límite), revisión válida30min y conservadora ante cualquier cambio auditado. Sin retención/borrados automáticos ni edición financiera manual. Próximo alcance sugerido: exportación y validación integral, solo con nueva solicitud.

## Etapa 9 — Exportación y verificación integral, 2026-11-15 (Buenos Aires)

### Entorno y alcance de la evidencia

Node 24.19.0 y PostgreSQL 17.11 Homebrew locales. Ocho migraciones desde cero en clústeres efímeros con socket privado y sin TCP. No se usaron URLs de bases existentes, secretos, fuentes reales ni servicios remotos; Git sigue sin inicializar. Sin paquetes nuevos ni cambio del lockfile. Se conservaron las etapas anteriores y se trabajó únicamente la exportación/verificación solicitada, sin ejecutar la puesta en uso de la guía.

`scripts/test-dashboard.mjs` utiliza Next de producción, SDK SSR real y un adaptador HTTP sintético que despacha las RPC a PostgreSQL bajo `authenticated` con el actor/sesión de prueba. `current_access` también se consulta en SQL. Las vistas administrativas y las políticas de `storage.objects` se ejecutan por rol en PostgreSQL. Los bytes de archivos se conservan en un Map privado del arnés y Auth/OTP son sintéticos: **no es PostgREST, GoTrue ni Storage efectivos**. No hay mocks de restricciones, transacciones, locks, cálculo financiero o RLS. Este arnés nunca se incluye como fallback o demo del producto.

### Checks ejecutados y resultados

| Check | Resultado observado |
| --- | --- |
| `npm test` | **21/21**, con assertions ampliadas de CSV completo/serialización y enlaces. Parsing CSV/XLSX, headers 6/29/7, ceros, precisión decimal, negativos, repetidos, fórmulas sin ejecución, límites y ausencias. Presentación exacta/porcentajes con BigInt y parámetros estrictos; las reglas financieras autoritativas se comprueban en SQL, sin duplicarlas en JS. |
| `npm run lint` | Correcto, cero warnings. |
| `npm run typecheck` | Correcto. |
| `npm run build` | Correcto; páginas y APIs privadas dinámicas. |
| `npm run test:db` | Correcto con ocho migraciones; suites esquema/Auth/preparación/publicación/indicadores/cuentas; concurrencia y schema-only restore. Motor PostgreSQL real con contratos mínimos de Auth/Storage. |
| `npm run test:auth:http` | Correcto. Regresiones de OTP/invitación/logout/permisos/CSRF/preparación/gestión/modelo; CSV paginado preservado. CSV completo de 300 filas por dos llamadas, un total y revisión fija; 409 ante cambio de revisión, 403 ante pérdida de acceso, 503 ante fallo/resultado incompleto de segunda página, 422 ante 10.001 filas. Ningún caso fallido entrega `Content-Disposition` ni CSV parcial. Backend de esta suite es sintético; no se usa para acreditar RLS. |
| `npm run test:dashboard` | Correcto con el build final. Ingreso por acciones/formularios reales de Next con OTP sintético; sus cookies SSR se usan en todo el circuito administrativo. Cargas multipart CSV, parser del servidor, chunks, correspondencias, conciliación, publicación, consultas, cuenta y CSV contra SQL real. Caso principal 120/22; descarga completa de 253 cuentas en dos páginas SQL, total Revenue11.44 del custodio B, sin AUM al cierre, una cuenta sin Revenue, cero y -0.05 distintos. |
| Sintaxis de arneses | `node --check` en `test-auth-http.mjs`, `test-dashboard.mjs`, `test-import-workflow.mjs` y `bash -n scripts/test-database.sh`: correctos. |
| Navegador in-app | Lector filtró cuenta A enero–febrero2026: 120/22. Descargó resumen, navegó al análisis comercial conservando rango/cuenta y eligió Equipos. Tabla: equipo anterior N/D/10 y posterior120/12. Descargó CSV comercial. Se leyeron los dos archivos descargados con csv-parse: total120/22, definiciones y una/dos filas respectivamente. No se abrió Microsoft Excel ni se afirma compatibilidad observada en ese programa. |
| `supabase db advisors --type all --fail-on warn` | Intentado exclusivamente local, **ECONNREFUSED 127.0.0.1:54322**. Stack Supabase sin iniciar; no aprobado. No se cambió a otro destino. |

Las pruebas unitarias de serialización hacen round-trip con csv-parse de `=`, `+`, `-`, `@`, tab/CR/LF iniciales, espacios/controles antes de fórmula y caracteres de ancho completo; también comillas, comas y saltos internos. No aparecen celdas extra. Decimales de 18 posiciones y -0.05 se conservan exactamente; cero permanece `0`, null `N/D`. Las pruebas HTTP comprueban lectura admin/lector, filtros/revisión y descarga completa independientemente de la página visible.

### Matriz de los diez casos solicitados

| Caso | Prueba y resultado |
| --- | --- |
| 1. Administrador ingresa y carga FA, equivalencias/vigencias | `test:dashboard` solicita/verifica OTP a través de las acciones de Next, recibe cookies y confirma rol con SQL. `test-import-workflow.mjs` crea custodios por preview/save, carga FA por multipart, resuelve referencias con evidencia, elige Broker explícitamente y publica vigencia [01/01/2028,01/03/2028). OLD Owner no genera historia. Equipos se acreditan por membresías fechadas, sin inferir Grupo por nombre. |
| 2. Dos meses de AUM/Revenue conciliados y publicados | Misma suite: AUM100/Revenue2+3+5 en enero; AUM120/Revenue12 en febrero. Cada lote prepara por el parser real, resuelve al UUID acreditado y compara total de archivo/candidata antes de publicar. FA preparado/publicado sin hechos financieros no inventa cero. |
| 3. Resumen/ranking/cuenta/exportación coinciden | Cuenta principal cierre120/Revenue22 en API, HTML de Resumen, Análisis comercial, detalle y CSV. Ranking por equipo conserva Revenue10 y12; CSV contiene período/filtro/definiciones. SQL concilia seis desgloses y ocho escenarios de filtros contra totales. Navegador confirma ambas descargas del fixture2026. |
| 4. Reimportación no duplica | Multipart del mismo archivo con otra solicitud crea versión candidata; muestra misma huella y sustituye el alcance, total sigue22. Repetir solicitud después de preparar y después de publicar conserva UUID. Repetir publicación conserva hechos/evento según assertions SQL. Revenue legítimamente repetido no se deduplica. |
| 5. Corrección aislada e historia | Custodios A/B con ACCOUNT000123 tienen UUID diferentes. Corregir enero A de10 a11 da Revenue23 para su cuenta, deja total B=9 intacto y las versiones anteriores superseded, con tres filas históricas y fuente descargable por admin. SQL también prueba correcciones AUM y otros alcances intactos. |
| 6. Inválido no modifica publicados | AUM con `=1+1` en CSV queda failed; revisión responde409 y total publicado anterior idéntico. SQL prueba conciliación fallida, vacío, duplicado AUM y excepción inyectada después de modificar el puntero, con rollback completo de datos/estado/auditoría. |
| 7. Publicación concurrente y retries | `test:db`: dos sesiones reales y dos administradores compiten por la misma revisión; exactamente una publica y la obsoleta falla. Dos publicadores simultáneos del mismo lote reciben éxito con un único resultado/evento activo. Carrera interna previa también pasa. El adaptador HTTP serializa sus consultas: no se presenta como prueba de concurrencia. |
| 8. Equipo según vigencia | Membresías explícitas enero/febrero del flujo2028 mantienen enero10 en equipo anterior y febrero12/cierre120 en nuevo equipo. Suites SQL prueban límites exclusivos, huecos, superposición y FA versionado; preview de cambio de fechas revierte y save solo modifica cuenta-meses alcanzados. |
| 9. Anónimo/lector sin acceso indebido | HTTP anónimo a exportación401; lector gestión/modelo/fuentes403. SQL por roles: anon sin lectura; lector sin publicación ni originales/preparaciones, edición de roles o archivos; `user_metadata.role=admin` no eleva; Storage RLS incluso ante política permisiva adicional; sesiones revocadas/vencidas denegadas. Admin conserva fuente histórica. |
| 10. Faltantes/sin clasificar visibles | Flujo2028: 251 cuentas solo-Revenue, una solo-AUM sin cierre y otra con Revenue enero; CSV completo253 filas únicas. Custodio B: AUM N/D sin arrastre, Revenue11.44, cuenta solo-AUM con Revenue N/D, cuenta con0 y otra con-0.05; no se pierden sin comercial/cliente/servicio. Fixture SQL2026 añade importes null publicados, ajustados y cuentas sin equipo, con subtotales/cobertura. Un importe vacío en una **nueva importación** sigue siendo error bloqueante del parser MVP; no se cambió esa política para fabricar datos publicados incompletos. |

### Defecto encontrado y corregido

El nuevo circuito detectó 502 al reintentar una carga después del parsing: `begin_import` comparaba todas las convenciones actuales, pero `prepare_import_chunk` les había añadido `configuration`. La octava migración, creada con CLI `migration new import_retry_after_preparation`, excluye esa clave interna de la comparación con las convenciones originales. Conserva hash/nombre/tamaño/opciones, propietario ejecutor, RLS y grants; no cambia hechos ni versiones. `imports.test.sql` confirma mismo UUID/sin otra versión/configuración intacta y rechazo de hash u opciones diferentes. El circuito HTTP repite la carga antes y después de publicar, con descarga del original ante conflicto de subida. Los checks finales anteriores pasan con la corrección aplicada.

Se consultaron [changelog Supabase](https://supabase.com/changelog.md), [cambio CLI3](https://supabase.com/changelog/supabase-cli-v3), [funciones/permisos](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [operadores JSON de PostgreSQL](https://www.postgresql.org/docs/current/functions-json.html), [Route Handlers Next](https://nextjs.org/docs/app/getting-started/route-handlers) y [CSV Injection OWASP](https://community.owasp.org/attacks/CSV_Injection). No se cambiaron versiones de dependencias.

### Reproducir y pendientes para archivos reales

Con Node24/PostgreSQL locales, ejecutar `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:db`, `npm run build`, `npm run test:auth:http`, `npm run test:dashboard`. Para navegador, añadir `-- --serve` al último comando; las URLs lector/admin son sintéticas y se imprimen al terminar assertions. Elegir enero–febrero2026, cuenta A y descargar resumen; ir al análisis comercial → Equipos → descargar. Ctrl+C sobre el proceso Node elimina clúster y servidores. En ejecución normal se limpiaron automáticamente; también se detuvo el arnés visual.

Antes de validar archivos reales:

1. Acordar destino Supabase dedicado/autorizado y acceso invitado; aplicar todas las migraciones, bootstrap revisado y verificar Auth/PostgREST/Storage efectivos, políticas, sesiones, fuentes privadas, bloqueo de roles y advisors. Repetir login/importación/consulta/exportación en ese destino; el E2E local no acredita esos servicios ni un despliegue.
2. Obtener muestras **privadas** de FA/AUM/Revenue; confirmar headers, formatos/separadores/negativos/porcentajes/cachés de fórmulas, ceros originales y alcance completo por mes/custodio. No ejecutar macros/fórmulas ni añadir muestras a Git. Confirmar campo comercial, equivalencias/namespace/custodio, cliente/servicio y vigencias con evidencia; no inventar fechas ni identidades.
3. Acordar cobertura esperada, cuentas esperadas y períodos sin movimientos. Revisar faltantes/sin asignar con el dueño. Archivo vacío/custodio ausente no autoriza borrado ni confirma cero.
4. En un período real de dos meses, conciliar filas/valores y AUM al cierre/Revenue acumulado global, por custodio y por cuenta contra los originales; comprobar las 29 columnas de Revenue y sus repeticiones. Comparar resumen/ranking/cuenta/CSV con todos los filtros relevantes y documentar diferencias/decisiones. Repetir reimportación, corrección aislada y fuente/historia anterior.
5. Abrir/importar CSV en la versión/locale de Excel efectivamente usada: verificar coma/punto decimal/BOM, celdas de texto inertes y precisión. El archivo conserva decimales exactos, pero Excel puede redondear cifras extensas; importarlas como texto. No se garantiza protección al guardar/reabrir en todos los programas.
6. Medir tamaño/filas/tiempos/memoria con volumen representativo y límites del hosting; exportación en memoria acotada a 10.000 filas, hasta 40 llamadas SQL. Probar recuperación operativa de datos **y** archivos con roles/grants, accesibilidad integral/lector de pantalla y caída real del hosting antes de puesta en uso. La restauración ejecutada aquí fue solo estructura SQL; no backup de datos/Storage.

No se declara «validado con Excel real», certificación de seguridad/accesibilidad, capacidad de producción ni puesta en uso. Próximo alcance sugerido: etapa 10, únicamente por nueva solicitud.

## Etapa 10 — preparación operativa, 2026-11-15

### Alcance y destinos observados

Se inspeccionaron instrucciones, documentación vigente del repo, importador, Auth,
Storage, rutas y exportación. La guía externa se consultó como referencia, sin
extender la solicitud. `git rev-parse` confirmó carpeta sin Git; no se inicializó.
No había `.vercel`, enlace Supabase ni `.env.local` al comenzar.

Inventario de solo lectura: Supabase Rhino → `rhinodb`, Primary →
`software-eventos-db`, Supabase → `watchparty-database`; ninguno autorizado para
App Papá. Vercel Primary listó solamente `software-eventos`; Watchparty devolvió
403 en listado de proyectos y ningún equipo en `list_teams`. No se solicitó acceso
adicional a esas aplicaciones ni se leyó/modificó su base, configuración o datos.

El dueño señaló la pestaña Chrome de `franlang2209-8232`, vacía de proyectos y Hobby,
y pidió expresamente crear allí el proyecto. La CLI global era Watchparty: no se
reutilizó. Se autorizó una sesión CLI separada por device login con intervención
explícita del dueño. `whoami --format json` confirmó cuenta/equipo correctos;
`project inspect app-papa` dio not-found antes de crear. `project create` confirmó
creación, y `project update`/`inspect` confirmaron Next.js, Node24.x (el default
inicial era26.x), `npm ci` y `npm run build`. Link local verificado:
`prj_lPEM6UXsDFB4YBzBs5p1BAKgRHn2` / `team_ckh7dlHz13Q9LyiEOOob04Nx`.
`VERCEL_ORG_ID` agregado como Config para Preview/Production y listado verificado;
no se agregaron variables Supabase. `vercel list app-papa --json` confirmó cero
despliegues. Protección leída: `all_except_custom_domains`, gitForkProtection true. Sin cambios
al plan, región, protección ni despliegue; dashboard no equivale a aplicación publicada:
[proyecto](https://vercel.com/franlang2209-8232/app-papa).
El token OIDC generado automáticamente por link en un `.env.local` nuevo se retiró
con ese archivo; no se imprimieron credenciales. Sesión CLI separada fuera del repo.

### Verificaciones ejecutadas

- `npm test`: **22/22**, incluida prueba nueva de control de destinos: falta de
  autorización/configuración, proyectos/equipos/URL incorrectos, base compartida
  entre ambientes, claves privilegiadas/públicas y orígenes inválidos rechazados;
  caso positivo exclusivamente sintético.
- `npm run lint`, `npm run typecheck`, `npm run build`: correctos. El build local
  no requiere destino; el prebuild se ejecutó. `npm run check:deployment` sin
  ambiente y `VERCEL=1 VERCEL_ENV=preview npm run prebuild` sin destino completo
  salieron **1 como se esperaba**, con mensaje sin secretos, antes de Next.
- `npm run test:db`: las **ocho migraciones existentes** desde cero y suites
  identidad/finanzas/preparación/publicación/consultas/modelo/permisos, dos sesiones
  concurrentes, publicación idempotente y restauración **solo estructura** correctas.
  No se creó ni aplicó una migración nueva en esta etapa.
- `npm run test:auth:http`: OTP sin alta, invitación, roles/origen/cookies,
  preparación/privacidad/retry y 251 filas en chunks correctos con servicios
  HTTP sintéticos. `npm run test:dashboard`: Next→PostgreSQL temporal, publicación
  dos meses, 120/22, filtros, permisos, corrección/historia/invalidación y CSV completo
  253 cuentas correctos. Clúster/servidores del arnés eliminados al terminar.
- `npm ls --depth=0`: árbol instalado coherente. `npm audit --omit=dev`: **0 avisos**;
  no se repitió auditoría completa de desarrollo ni reinstalación `npm ci`.
- Registry npm consultado para versiones exactas y engines/peers: Node local24.19.0,
  Next16.4.6, React19.3.1, Supabase JS2.119.0/SSR0.12.7/CLI3.1.0 coinciden con latest
  consultado salvo Node (no se consultó latest de Node). JS exige Node>=22,
  SSR requiere JS^2.114.0, Next admite Node>=20.9.0: Node24 satisface los tres.
  read-excel-file9.3.15 instalado, latest9.3.17; conservado por alcance, sin actualización
  arbitraria ni cambio de lockfile. csv-parse7.0.3 coincide con latest. Vercel CLI65.16.0
  consultada/ejecutada con npx; no instalada en package.json. TypeScript5.9.3,
  fflate0.8.3 y saxen11.2.0 conservados, sin afirmar que sean latest.

### Benchmark reproducible de importaciones

`npm run benchmark:imports`: seis casos SINTÉTICOS de 5.000 filas cada uno,
headers6/29/7, identificadores textuales con ceros, Revenue con descripción de240
caracteres, importes0.10. Cada caso en proceso separado, archivos temporales privados
eliminados al finalizar. Lectura+validación completa y serialización de chunks en
cada petición, sin persistencia/red. Assertions: 5.000 filas, cero errores, total
exacto500 en AUM/Revenue y null en FA, 20 chunks de250, tamaño de chunk<=1MiB,
multipart bajo límite app y Vercel. Medición en la máquina local con Node24.19.0:

| Fuente/formato | Bytes original | Bytes multipart | Lotes | Mayor chunk bytes | Parsing total ms | Máx. petición ms | Pico RSS MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| AUM CSV | 305103 | 305544 | 20 | 139750 | 713 | 55 | 315 |
| AUM XLSX | 108700 | 109142 | 20 | 148750 | 2710 | 153 | 403 |
| Revenue CSV | 1855340 | 1855785 | 20 | 460750 | 1834 | 169 | 372 |
| Revenue XLSX | 465819 | 466265 | 20 | 520500 | 7981 | 459 | 530 |
| FA CSV | 550095 | 550535 | 20 | 171000 | 661 | 44 | 321 |
| FA XLSX | 133672 | 134113 | 20 | 182250 | 2510 | 143 | 445 |

RSS de `process.resourceUsage().maxRSS` incluye arranque, bytes, multipart y trabajo
acumulado de las20 peticiones del worker; no es solo delta de parser ni RSS del
servidor Next. Total de parsing suma las20 relecturas; máximo es una sola de ellas.
No incluye latencia/descarga Storage/RPC/SQL/publicación/Next/carga concurrente.
Revenue XLSX tiene29 columnas y se mantiene bajo12MiB expandido, pero no representa
el peor caso de10 hojas/64 columnas/4096 caracteres. No se recibieron volúmenes del
negocio ni muestras reales: estos números **no son capacidad de hosting medida**.
El límite multipart app2.162.688 bytes es inferior a4.500.000 bytes Vercel.

Documentación oficial consultada: [límites Functions](https://vercel.com/docs/functions/limitations),
[Hobby/uso](https://vercel.com/docs/limits/fair-use-guidelines),
[variables Vercel](https://vercel.com/docs/environment-variables/system-environment-variables),
[variables Next](https://nextjs.org/docs/app/guides/environment-variables),
[changelog Supabase](https://supabase.com/changelog.md),
[CLI3](https://supabase.com/changelog/supabase-cli-v3),
[Auth URLs](https://supabase.com/docs/guides/auth/redirect-urls),
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
[Storage](https://supabase.com/docs/guides/storage/security/access-control),
[backups](https://supabase.com/docs/guides/platform/backups),
[restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
Supabase CLI help de raíz, link, db, push, migration list, dump y advisors revisado.
No se repitió advisors contra stack local ausente ni se ejecutó en una base ajena.

### Pendientes reales/remotos

Sin destino Supabase autorizado, migraciones alojadas, Auth/SMTP/Storage efectivos,
bootstrap/invitaciones reales, URL de app o pruebas en Vercel. Sin plan/región/presupuesto
operativos, retención, RPO/RTO acordados ni backups/restauración de datos+archivos
probados. Sin volumen representativo confirmado, capacidad remota, prueba de exportación
máxima ni mapeos comerciales/alcances/vigencias iniciales/conciliación de período real.
La guía `operations.md` documenta procedimientos y alternativas condicionadas al plan;
no se declaran ejecutados. El proyecto Vercel creado permanece sin carga de código/datos
ni upgrade; los destinos Supabase/orígenes vacíos bloquean su build remoto.

## Continuación: publicación del código en GitHub, 2026-11-15

- Repo público `FranciscoLang2209/gma-software` elegido explícitamente por el dueño;
  metadata del conector confirmó permiso push/admin, tamaño0 y default main. Remoto
  vacío comprobado con `git ls-remote` antes de inicializar. Sin sobreescritura de historia.
- Git inicializado en la carpeta existente, origin HTTPS exacto. Autor local del repo
  usa nombre GitHub y noreply con ID128090343; no se cambió la identidad global ni se
  incluyó correo privado en el commit. Git usó su credencial existente por keychain;
  no se extrajo ni imprimió el token, ni fue necesario autenticar gh.
-123 archivos inventariados antes del commit: ninguna carpeta de build/dependencias/
  sesiones/fuentes/backups; cuatro `.env*.example` sin valores. Excel/CSV únicamente
  en fixtures sintéticos documentados. Revisión de patrones de claves privadas,
  GitHub/Supabase secretos, AWS, JWT y URLs PostgreSQL con contraseña sin hallazgos;
  no equivale a certificación de ausencia de secretos o revisión integral.
- `npm test`:22/22. Sin cambios de lógica ni paquetes en esta continuación. CSV
  sintéticos mantienen CRLF intencional; revisión whitespace posterior con
  `core.whitespace=cr-at-eol` correcta. No se repitieron SQL/HTTP/build ya registrados.
- Commit `185871cb4c54eeac56ba06d6de40ad2bd25ef1e7` subido a main sin force;
  `git rev-parse HEAD` y `git ls-remote origin refs/heads/main` idénticos.
- Vercel ID/equipo verificados antes del enlace. Nombre vigente gma-software,
  Node24.x/Next.js conservados. Primer intento git connect pidió Login Connection;
  navegador mostró GitHub FranciscoLang2209 conectado después del flujo. Segundo
  intento de enlace falló; UI mostró solamente WatchParty como repo autorizado de
  la GitHub App. Se abrió su configuración en la cuenta FranciscoLang2209, que pide
  Confirm access (sudo/2FA). Se solicitó al dueño verificar identidad y agregar solo
  gma-software manteniendo permisos existentes. Resultado final se registra al concluir.

No se creó Supabase ni se activaron planes pagos. El prebuild permanece cerrado
sin destinos Supabase/orígenes; subir y enlazar código no valida la app alojada.

Resultado posterior: el dueño confirmó acceso de la GitHub App. `vercel git connect`
terminó con **Connected** y la UI Settings→Git mostró el repositorio exacto
`FranciscoLang2209/gma-software` como Connected. Proyecto/equipo/Node24.x previamente
comprobados; no se tocó el proyecto WatchParty. Documentación actualizada para el
nombre vigente. El build remoto sigue sujeto al prebuild sin base/origen configurados;
no se validaron servicios Supabase ni un despliegue de la aplicación.

## Base nueva y migraciones administradas — 2026-11-15

Supabase Marketplace creado Free en gru1: `zwdqnrbqqszjrtkhyqnz`, nombre
`gma-software-prueba`. Región/plan/propietario leídos del recurso; ref coincide con
URL y conexión PostgreSQL. Conexión al proyecto Vercel solo Preview; nombres de
variables verificados al terminar: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY y
VERCEL_ORG_ID (esta última también en Production). Variables secretas/públicas/
Postgres generadas se eliminaron del runtime; copia de operación en directorio
privado fuera del repo, nunca valores en stdout o Git.

Inspección SQL previa: PostgreSQL17.11, cero tablas public/app_private, cero
usuarios Auth/buckets e historial vacío. CLI dry-run mostró ocho migraciones.
Primera ejecución aplicó1 y revirtió2 por SQLSTATE42501 al transferir propiedad
al ejecutor: postgres administrado tiene CREATEROLE/BYPASSRLS sin SUPERUSER.
Se probaron opciones de sesión createrole_self_grant que no llegaron por el pooler;
no se reintentaron cambios con opciones inefectivas. Se retiró la configuración
experimental del operador y se verificó pg_db_role_setting vacío. Se corrigieron
únicamente las migraciones2/8 todavía sin aplicar: grant temporal al creador del
rol y revoke de su grant al cerrar la cadena. La1 aplicada no se modificó.

Reejecución CLI aplicó2–8, sin seeds ni Vault. Assertions reales:8 versiones, todas
las tablas privadas con RLS/force, ejecutor sin LOGIN/SUPERUSER/BYPASSRLS y ninguna
membresía con INHERIT/SET. Membresía automática postgres←ejecutor con grantor
supabase_admin conserva ADMIN=true, INHERIT=false, SET=false. Cero perfiles.
Storage app-papa-imports privado; file_size_limit2097152 configurado y leído.
Registro público desactivado en UI; GET Auth settings200/disable_signup=true y
POST signup con correo sintético422/signup_disabled, sin alta. Anónimo desactivado
observado. Ninguna muestra financiera real importada.

Advisors reales `--type all --fail-on warn`: exit1,28 WARN de PERFORMANCE:
13 auth_rls_initplan y15 multiple_permissive_policies. Sin otros nombres/niveles
reportados por esa ejecución; no se presenta como certificación ni ausencia total
de riesgos de configuración Auth. Pendientes medición/optimización sin alterar
permisos por conveniencia. `npm test`22/22, lint y regresión SQL de operador
administrado más todas las suites de test:db correctos tras la corrección.

## Preview READY y verificación real parcial

Vercel API confirmó dpl_CwPbBttXMudpc28JHjgMPcN17uhX READY, target null (Preview),
branch prueba, commit abdf9997241946e067d6d14bdddfc4f29e60b497, Node24.x,
regiones[gru1], alias exacto configurado en Auth:
https://gma-software-git-prueba-franlang2209-8232.vercel.app . Sin despliegue
Production aprobado. La instalación/npm build del Preview pasó en hosting.

Pruebas con OIDC corto de Vercel, sin abrir protección: /ingresar200, texto de
login, private/no-store; /api/consultas sin sesión401 privado. Supabase directo
sin usuario: current_access401/42501, admin_import_batches401/42501,
Accept-Profile app_private406/PGRST106 (esquema no expuesto), Storage list200 vacío.

Se creó un usuario Auth y perfil reader **sintéticos**, contraseña aleatoria no
registrada, sin enviar correos; user_metadata.role=admin es dato de ataque de prueba.
Inicio por password solo en el SDK de operador para esta cuenta sintética (no se
agregó flujo de password a la app). JWT/SSR cookies reales contra Preview: current_access
reader, consulta JSON200/1362bytes, CSV completo200/2699bytes, ambos no-store con
base sin hechos; fuente API403. RPC source_file/manage_import42501, listado de
Storage vacío y descarga de objeto privado rechazada. URL pública también denegada.
El objeto `operational-checks/SINTETICO-revenue.csv` existe realmente, subido por el
operador desde el fixture sintético; ningún lote/hecho financiero fue creado.
Se mantiene para trazabilidad, sin borrado automático. Deshabilitar perfil dejó
current_access null con JWT existente; finalmente se cerró sesión. Usuario/perfil/
auditoría conservados, sin administrador operativo ni datos reales.

vercel curl generó un bypass persistente antes de fallar por flag global reenviado.
Se revocó por API usando body privado, sin imprimir el secreto, y se verificó
protectionBypass vacío y ssoProtection all_except_custom_domains conservado.
La comprobación HTTP se completó con x-vercel-trusted-oidc-idp-token del proyecto.
No se presenta un bypass temporal como prueba de acceso público ni se dejó uno activo.

Site URL guardado en Dashboard: alias exacto de prueba; redirects adicionales
vacíos. Proveedores externos/manual linking/anónimos desactivados, confirm email
activo. UI de Emails: Set up custom SMTP to edit templates; opciones Pro o Send
Email hook. El dueño eligió dejar SMTP pendiente; no se hizo upgrade ni se usó API
para eludir la restricción. No se enviaron invitaciones, asignó admin real ni se
probó OTP/invitación/primer bootstrap o publicación/corrección/admin HTTP remoto.
Tampoco se midió volumen representativo real, importación máxima en hosting,
restauración de datos+Storage, accesibilidad integral o conciliación de Excel real.
Los únicos archivos subidos fueron fixtures sintéticos. Plan Free no acredita backup
recuperable incluido; procedimiento de operaciones y retención pendientes del dueño.

## Rediseño UI/UX — etapas 1 y 2, 2026-11-16

### Evidencia local

- Rama `codex/ui-ux-dashboard`, árbol inicialmente limpio. Cambios limitados a UI,
  fuente/iconos y documentación; sin cambios en `src/lib`, API, SQL, RLS ni Auth.
- Node 24.22.1 del runtime local. Sin npm en PATH: npm 11.6.2 temporal se utilizó
  para consultar peers/instalar las dos dependencias exactas. El resto de versiones
  y metadatos del lockfile se preservaron. No se instalaron herramientas en el sistema.
- Lint (`node node_modules/eslint/bin/eslint.js . --max-warnings=0`): correcto.
- Typecheck (`next typegen` y `tsc --noEmit` mediante binarios locales): correcto.
- Tests existentes (`node --conditions=react-server --experimental-strip-types
  --test tests/*.test.ts`): **23/23** correctos.
- Prebuild local (`node scripts/check-deployment.ts`) y `next build`: correctos;
  todas las rutas, incluyendo el nuevo icono, compilan. Sin destino remoto.
- `node scripts/test-auth-http.mjs`: correcto, con build real local y proveedor HTTP
  sintético. Anónimo/lector/admin, rutas directas, login, preparación/publicación,
  catálogos, consultas JSON/CSV, revisión, errores privados, origen y no-store.
- `git diff --check`: correcto.

### Revisión de navegador

Chrome headless con Playwright del runtime, en copias aisladas en `/private/tmp`,
una desde HEAD anterior y otra desde la UI editada. Solo en esas copias se sustituyó
el proveedor de acceso/consulta por un fixture explícito y se omitió el proxy.
La aplicación del repositorio mantiene su acceso y su fuente real, sin fallback.
Capturas con franja «REVISIÓN VISUAL · DATOS SINTÉTICOS · SIN CONEXIÓN A BASE».
La serie sintética no acredita resultados de la consulta SQL.

Comprobaciones automatizadas correctas:

- Dos KPIs principales y cuatro secundarios; decimal extenso conservado.
- Formulario GET envía los filtros avanzados y los abre al volver con filtro aplicado.
- Exportación y enlace al análisis por custodio conservan equipo y rango por URL.
- Navegación lectora no muestra Importaciones.
- Sin desbordamiento del documento en 320, 390, 768 y 1440 px; tabla con scroll local.
- Tab → «Ir al contenido», Enter → `main#contenido`.
- Cobertura expandible y lista de importes exactos disponibles.
- Vacío con N/D y dos gráficos sin valores; error de consulta sin renderizar KPIs.
- Sin excepciones de página ni errores de consola en la versión nueva tras terminar
  la hidratación. La versión anterior solicitaba `/favicon.ico` inexistente; se
  incorporó un icono SVG nativo de Next en la nueva versión.

Se corrigieron dos problemas detectados visualmente: importe decimal largo partido
en varias líneas en la tabla y fondo que no diferenciaba suficientemente superficies.
Los importes quedan completos mediante desplazamiento horizontal del contenedor.
Se revisaron visualmente las capturas; no se usaron datos personales ni financieros reales.

Capturas fuera del repositorio, en la carpeta privada de trabajo:
`/Users/franciscolang/Documents/ChatGPT/App Papa/ui-ux-review/`:
`before-desktop.png`, `after-desktop.png`, `after-mobile.png`, `after-empty.png`,
`after-error.png`, `checks.json`. El arnés y su preparación se conservan allí para
reproducir esta revisión local; nunca deben desplegarse como aplicación.

### Límites

No se ejecutaron `test:db` ni `test:dashboard`: este equipo no dispone de los
clientes completos PostgreSQL (`pg_config`, `psql`, `createdb`). Se exploró un paquete
nativo temporal que solo proporciona servidor, initdb y pg_ctl; no se sustituyó el
motor ni se conectó una base remota para superar esa ausencia. La prueba HTTP
sintética no equivale al recorrido Next → PostgreSQL ni a conciliación real.

No se probaron datos reales, despliegue, sesión real de negocio, lector de pantalla
ni auditoría WCAG completa. La instalación informó siete avisos moderados existentes;
no se ejecutaron upgrades forzados ni se afirma auditoría limpia. Pendiente revisar
el resultado con el dueño antes de ampliar el rediseño a otras secciones.

## Push de UI/UX 1–2 y continuación 3–7 — 2026-11-16

### Publicación del conjunto aprobado

- Commit `2475ab14be828b3c9323700aceeb4de53645d9f8`, incorporación fast-forward
  a `main` y `git push origin main`: correctos, sin force. Hooks de secretos
  informaron commit/push sin secretos encontrados.
- `git ls-remote origin refs/heads/main`: mismo SHA.
- `get_commit_combined_status` de GitHub: contexto `Vercel`, estado `success`.
  No se automatizó sesión real ni se afirma conciliación de fuentes por ese estado.

### Continuación implementada localmente

Rama `codex/ui-ux-sections`; etapas 3–7 de `ui-ux.md`. Sin cambios en contratos,
RPC, APIs, SQL, Auth o RLS. Sin cambios de dependencias. Revisión de React: sin
nuevos efectos ni fetch en componentes de visualización; componentes existentes
conservan su ejecución y guardas. Iconos decorativos, labels, estados y controles
nativos conservados. Los indicadores de etapa no sustituyen validaciones.

Checks ejecutados con Node 24.22.1 y binarios locales:

- ESLint, `next typegen` y TypeScript sin errores.
- 23/23 tests existentes correctos.
- Prebuild local y build Next correctos, todas las rutas compiladas.
- `scripts/test-auth-http.mjs`: correcto contra el build local; proveedor HTTP
  sintético. Permisos anónimo/lector/admin, JSON/CSV, revisión, origen, login,
  preparación, publicación y modelo con los contratos existentes.
- `git diff --check`: correcto.

### Navegador y flujos

Chrome headless/Playwright; copia aislada `/private/tmp/gma-sections-review`.
Sin variables reales ni conexión Supabase. Solo esa copia usa un proveedor
sintético y omite el proxy; Playwright intercepta los endpoints de escritura y
retorna respuestas identificadas. No se guardaron registros reales ni se probó
persistencia real con estas interacciones.

| Límite comprobado | Evidencia |
| --- | --- |
| Render y datos → UI | Seis dimensiones comerciales, KPIs de todas las páginas, tooltip con `120,123456789123456789` exacto y gráficos por grupo. |
| Filtros/enlaces → URL | Cambiar a Equipos conserva rango; aplicar equipo conserva agrupación; exportación conserva ambos. |
| Búsqueda → detalle → listado | `0001` se conserva como texto; link de regreso mantiene búsqueda y filtros. |
| Preparación → correspondencias | Envío de archivo sintético y validación muestran el estado y acceso al lote, sin publicar. |
| Conciliación → confirmación | Revisar alcance no envía publish. Clic en publicar sin checkbox no envía publish; con confirmación envía una sola operación. |
| Editor → preview → save | Revisión muestra antes/después; save no se envía hasta confirmar explícitamente. |
| Rol lector → UI | Sin editor ni botón de cambios en Configuración y sin Importaciones en navegación. Autorización real de servidor cubierta separadamente por test HTTP sintético. |
| Error → UI | Consulta fallida de análisis muestra error sin renderizar KPIs. |
| Responsive | Sin desbordamiento del documento en 24 combinaciones: análisis, directorio, detalle, importaciones, correspondencias y configuración × 320/390/768/1440 px. |

Sin excepciones de página ni errores de consola en el recorrido final.
Revisión visual de capturas desktop/móvil, incluyendo confirmación de publicación y
preview de configuración. Se uniformaron botones principales navy, tipografía de
secciones y dominio del eje de distribución para incluir valores negativos.

Capturas y `checks.json` en carpeta privada:
`/Users/franciscolang/Documents/ChatGPT/App Papa/ui-ux-sections-review/`.
Incluye `commercial-desktop.png`, `accounts-desktop.png`, `account-detail-desktop.png`,
`imports-desktop.png`, `resolution-ready-desktop.png`, `settings-preview-desktop.png`
y versiones móviles. Arnés conservado fuera del repositorio. Todas las capturas
incluyen la franja de datos sintéticos.

No se ejecutaron test:db/test:dashboard ni pruebas con fuentes reales; permanecen
las limitaciones de PostgreSQL del registro anterior. Tampoco auditoría completa
WCAG/lector de pantalla. El push verificado corresponde a etapas 1–2;
esta continuación 3–7 no se ha enviado ni desplegado.


## Cierre UI/UX — main verificado y regresión final, 2026-11-16

### Alcance y base remota

GitHub `branches/main` devuelve `0f87e48df636d333ea593379986433b92027508c`, igual
al HEAD local. Incluye `2475ab1` (base/Resumen) y `0f87e48` (demás secciones).
GitHub `commits/<sha>/status` devuelve contexto Vercel, `success`, «Deployment
has completed». No se accedió a una sesión de negocio ni se modificó el despliegue.
Se corrige así el registro histórico anterior que solo acreditaba el primer push.

Rama de cierre: `codex/ui-ux-final-validation`. Al iniciar ya había cambios en
layout del workspace, CSS y ModelManager; se preservaron y verificaron. Cambios:

- Sidebar y catálogos tienen nombres distintos; topbar es `header`.
- La marca usa su texto visible como nombre accesible; badge del rol en alto contraste.
- El scroll anidado de Radix se delega al contenedor `.table-scroll`, que ya tiene
  nombre y `tabIndex=0`; no se elimina el acceso al contenido financiero completo.
- Footer con el token de texto secundario más oscuro.
- La captura dinámica detectó contraste 4,25:1 en el botón de recarga de
  correspondencias. Se añadió `highContrast` a los seis botones secundarios
  de preparación/correspondencias, incluidos paginación y pausa.

Sin cambios en `src/lib`, API, SQL, Auth/RLS, cálculos, contratos, dependencias ni
lockfile. Revisión React: props visuales/semánticas, sin nuevos hooks, efectos,
fetches ni alteraciones de confirmación o guardas.

### Checks locales ejecutados

Node 24.22.1 del runtime disponible; npm no está en PATH, por eso se invocaron
los binarios locales equivalentes, sin instalar herramientas ni cambiar versiones:

- `node node_modules/eslint/bin/eslint.js . --max-warnings=0`: correcto.
- `node node_modules/next/dist/bin/next typegen` y
  `node node_modules/typescript/bin/tsc --noEmit`: correctos.
- `node --conditions=react-server --experimental-strip-types --test tests/*.test.ts`:
  23 aprobados, cero fallos.
- `node scripts/check-deployment.ts` y `node node_modules/next/dist/bin/next build`:
  correctos; compilación y TypeScript completados también después del ajuste final.
- `node scripts/test-auth-http.mjs`: correcto contra build local y proveedor
  HTTP sintético; ingreso, roles, rutas directas, CSRF, fuentes, consultas/CSV,
  preparación por lotes y gestión/revisión/publicación/modelo.
- `git diff --check`: correcto.

### Navegador y accesibilidad

Se reutilizó `/private/tmp/gma-sections-review`, copia aislada con franja visible
«REVISIÓN VISUAL · DATOS SINTÉTICOS · SIN CONEXIÓN A BASE». Los componentes UI
inspeccionados coinciden con el workspace. Solo el arnés usa datos/roles simulados,
omite el proxy e intercepta endpoints de escritura; no se introdujo un fallback
en el producto. Es evidencia de UI y flujos simulados, no de persistencia real.

Chrome headless mediante Playwright, axe-core 4.14.1, reglas `wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa`, `wcag22aa` y `best-practice`, limitadas a `.app-shell`:

| Comprobación | Resultado |
| --- | --- |
| Rutas iniciales, admin/reader × 390/1440 px | 24 casos; cero violaciones detectadas. Reader omite Importaciones/Correspondencias. |
| Estados de interacción capturados | 14 casos; cero violaciones detectadas tras corregir el contraste. Incluye candidata lista para publicar y preview del modelo, desktop/móvil. |
| Responsive | Seis rutas × 320/390/768/1440 px: 24 comprobaciones sin overflow del documento. |
| Tabla mensual con teclado, 390 px | Flechas desplazan el contenedor exterior 80 px; ancho 324 px, contenido 836 px, scroll interior Radix 0 px. |
| Filtros/exportación | Dimensión, rango y equipo conservados por URL; enlace CSV conserva selección. |
| Cuentas | Búsqueda `0001`, detalle y regreso preservan búsqueda/filtros. |
| Importaciones | Carga/preparación no publican; review no publica; sin checkbox no hay publish; confirmado se envía una sola vez. |
| Configuración | Preview antes de save; lector sin editor ni botón de cambios. |
| Error de consulta | Error visible y ausencia de KPIs; sin cero de fallback. |
| Consola/visual | Sin excepciones ni errores en el recorrido. Revisadas capturas de análisis desktop y confirmación móvil. |

axe devuelve comprobaciones `incomplete` de contraste en gráficos y de relación
entre encabezados/celdas en tablas sin filas. Se conservan en los informes; cero
violaciones automáticas no acredita conformidad WCAG, lector de pantalla ni todas
las variantes, hover, foco o estados de error. El reporte está limitado al shell.

Evidencia privada en
`/Users/franciscolang/Documents/ChatGPT/App Papa/ui-ux-final-validation/`:
`axe-results.json`, `dynamic-axe.json` y scripts `gma-a11y.mjs`,
`gma-keyboard-scroll.mjs`, `gma-dynamic-a11y.mjs`. El archivo previo
`axe-before.json` se conserva como antecedente; no se regeneró en esta sesión.
Capturas sintéticas y `checks.json` actualizados en la carpeta privada
`ui-ux-sections-review/`, incluidos `commercial-desktop.png`,
`resolution-ready-desktop.png`, `resolution-ready-mobile.png` y
`settings-preview-desktop.png`. El arnés no debe desplegarse.

### Límites y continuidad

No se ejecutaron `test:db`/`test:dashboard`: `pg_config`, `psql` y `createdb` no
están disponibles. No se cambiaron DB ni cálculos para suplirlo, ni se usó la
base remota para estas pruebas. Sin muestras financieras, conciliación real,
publicación/corrección financiera remota ni auditoría integral de accesibilidad.
No se repitió auditoría de dependencias ni se actualizó el lockfile.

La revisión automática de permisos del primer intento de lanzar Chrome agotó
su plazo; el único reintento fue admitido y las pruebas finalizaron correctamente.
No quedó trabajo bloqueado por ese timeout.
Los cambios de cierre permanecen locales; no se ejecutó commit, push ni despliegue.
Próximo paso documentado: incorporar el cierre y comprobar despliegue, seguido de
validación operativa separada con muestras privadas y definiciones confirmadas.


## Selects y calendarios shadcn — 2026-11-16

Por solicitud del dueño, se sustituyeron todos los selects de negocio por la
composición Select de shadcn/Radix y las fechas por Popover + Calendar basado en
React DayPicker, adaptados al CSS existente sin migrar a Tailwind. Meses con
selección de mes/año explícita; vigencias con calendario diario en español.
Se mantienen nombres y valores FormData, campos obligatorios, disabled/readOnly,
filtros GET y fechas sin conversiones UTC. Los input/select nativos internos de
validación de las librerías no son controles visuales del producto.
Dependencias directas exactas y lockfile actualizados; sin cambios financieros.
Lint, tipos, 23 tests y build locales correctos. Navegador sintético: selección
por popup, elección mensual y FormData de filtros comprobados; calendario de
vigencias comprobado por separado. No se afirma haber repetido la matriz axe ni
el arnés anterior (sus selectOption/fill nativos requieren adaptación).
El dueño autorizó publicar a main todos los cambios locales, incluido el cierre
anterior de accesibilidad. Próximo paso: verificar despliegue y revisar en sesión
real, sin confundir estos checks con conciliación financiera real.

Verificación adicional: calendario de vigencias y controles a 390 px sin overflow del documento; corregida la especificidad CSS de los inputs internos de validación.


## Login con iconos y asset vectorial — 2026-11-16

Checks locales con Node 24.22.1: ESLint sin warnings, next typegen, tsc --noEmit,
23/23 tests, prebuild y build Next correctos. Regresión `test-auth-http.mjs`
correcta contra el build final y proveedor HTTP sintético, incluido ingreso,
roles, CSRF, logout y endpoints existentes. Se actualizó únicamente la expectativa
del título visible del login en ese script.

Navegador Chrome headless/Playwright contra build real local, con variables
sintéticas y backend HTTP temporal en localhost; no se omitió el proxy ni se
modificó el proveedor del producto. Comprobados cuatro anchos 320/390/768/1440:
sin overflow del documento y carga correcta del asset SVG. axe (WCAG 2 A/AA,
2.1 AA, 2.2 AA y best-practice) sin violaciones detectadas en esas vistas de salida.
Sin excepciones de página. Capturas desktop y móvil revisadas visualmente.

Verificados en navegador: salto al contenido con teclado; required bloquea envío
vacío; mostrar/ocultar conserva contraseña y no envía; pendiente deshabilita botón;
credenciales sintéticas rechazadas envían una sola solicitud al backend y muestran
error genérico mediante la acción real. La primera revisión visual detectó SVG
bloqueado por proxy: se resolvió con import estático y se añadió comprobación
`complete && naturalWidth > 0` al arnés. El selector del error se acotó al aviso
para diferenciarlo del anunciador de rutas de Next.

Evidencia privada: `/Users/franciscolang/Documents/ChatGPT/App Papa/login-review/`,
con `login-1440.png`, `login-390.png`, `login-error.png`, `checks.json`, `server.log`
y copia del arnés `gma-login-review.mjs`. Solo credenciales/datos sintéticos.
Los primeros intentos de escuchar localhost fueron bloqueados por sandbox;
las ejecuciones con permiso ampliado finalizaron correctamente.
No se probaron credenciales reales, base remota, conciliación financiera,
lector de pantalla ni todos los estados con axe. Sin push ni despliegue.


## Corrección de acceso y login — 2026-11-16

- Local: ESLint, Next typegen/TypeScript, check-deployment/prebuild y build correctos
  con Node 24.22.1; `git diff --check` correcto. Sin cambios de dependencias.
- Chrome/Playwright con proveedor HTTP sintético aislado: login y Sin acceso a
  320/390/768/1440 px sin overflow ni violaciones detectadas por axe. Foco del
  correo externo al input y padding >=4 px comprobados por estilos calculados;
  captura con texto sintético completo revisada. Se conservan teclado, campos
  obligatorios, mostrar/ocultar contraseña, pending y error de Server Action.
  Sin acceso conserva título, acciones y alerta de fallo de logout; sin errores
  de página. Evidencia privada en `App Papa/access-review`.
- Regresión `scripts/test-auth-http.mjs` correcta: rutas y permisos sintéticos,
  ingreso, salida, CSRF, APIs y privacidad. No sustituye una sesión Auth real.
- Remoto: cuenta existente expresamente autorizada comprobada por UUID/correo,
  confirmación y contraseña presente. Alta de perfil admin habilitado mediante
  transacción con verificación de identidad y reintento idempotente. Consulta
  posterior confirmó `role=admin`, `enabled=true` y evento de auditoría.
  Identidad personal y payload de auditoría no incorporados al repositorio.
- No se probó ingreso real de esa cuenta ni despliegue de estos estilos.
  Sin nuevas pruebas financieras, importaciones ni conciliación de Excel.

## AUM histórico multiperíodo — 2026-11-17 (local sintético)

Solicitud de implementación posterior al plan documental. Se conservan las ocho
migraciones anteriores y el flujo mensual. Nueva migración de padre/manifiesto,
RLS y publicación transaccional; sin cambios de dependencias/lockfile ni destinos
remotos. Documentación oficial consultada: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security),
[changelog](https://supabase.com/changelog.md) y [locks de PostgreSQL 17](https://www.postgresql.org/docs/17/explicit-locking.html).
No se actualizó CLI ni se usó ninguna operación de base remota. CLI 3.1.0:
`migration new --help` y `migration new historical_aum_uploads`, exclusivamente local.

Entorno: Node 24.22.3 del runtime. PostgreSQL cliente/servidor 17.12 compilado
desde fuente oficial en `/tmp/gma-pg17` (incluido `btree_gist`), porque el runtime
solo tenía un servidor 18.6 sin psql/createdb. Clústeres propios efímeros, socket
privado sin TCP. El sandbox requirió ejecución ampliada para memoria compartida y
servidores HTTP en localhost; no se utilizó ningún secreto/URL de producción.

Checks realizados con binarios equivalentes a los scripts de `package.json`:

- Lint, `next typegen` + `tsc --noEmit`: correctos.
- `test`: 27 pruebas, todas aprobadas. CSV y XLSX de 36 meses desordenados,
  tres cuentas/mes, decimales `0.1 + 0.2 − 0.05 = 0.25`, coordenadas originales,
  repetición entre meses permitida, duplicados de cuenta/mes bloqueantes,
  mes inválido en manifiesto padre, cero explícito, archivo vacío y exceso.
- Capacidad sintética CSV: 4.968 filas / 36 meses / 138 cuentas, 235.849 bytes,
  lectura/partición/validación ~41 ms en una ejecución local. Totales 13.8 por mes,
  sin redondeo; 5.002 filas rechazadas. No acredita duración/memoria de un Excel
  financiero real ni publicación máxima de 120 períodos.
- `test:db`: migraciones desde cero y con operador CREATEROLE/BYPASSRLS sin
  SUPERUSER; membresía temporal retirada, propietario/grants del nuevo ejecutor,
  RLS forzada y ausencia de escritura API directa. Suites anteriores completas.
- SQL histórico: original compartido y clave idempotente; mismos identificadores
  en custodios separados; bloqueos por correspondencias pendientes, coordenadas
  repetidas/fuera de manifiesto y fila no enrutable; denegación por lector/anónimo;
  bypass individual mediante ambas RPC de publicación rechazado. Fallo inyectado
  después del segundo puntero: ningún mes ni auditoría se publica, padre conserva
  `ready`. Retry recupera toda la carga; nueva importación conserva historia;
  una revisión obsoleta se rechaza; retry de padre reemplazado no lo reactiva.
- Concurrencia histórica real con dos sesiones SQL: una carga gana y la otra
  se rechaza íntegramente; los tres punteros pertenecen al mismo padre. Dos
  reintentos concurrentes de la ganadora tienen éxito sin duplicar auditoría.
- Restauración de esquema desde dump sintético correcta. No constituye ensayo de
  recuperación integral de datos + roles/ACL + bytes Storage de producción.
- Prebuild y `build`: correctos.
- `test:auth:http`: correcto con proveedor HTTP sintético; SSR, contraseña,
  invitación heredada, roles, CSRF/origen, fuentes, preparación mensual 251 filas,
  configuración fija, páginas, cursores y gestión/revisión/publicación.
- `test:dashboard`/`test-import-workflow.mjs`: Next real → RPC → PostgreSQL local.
  Regresión completa de dashboards/cuentas/CSV: AUM 120/Revenue 22; cobertura,
  ajustes, faltantes, FA fechado, versiones y permisos anteriores. Circuito nuevo:
  36 meses × 3 cuentas × 2 custodios, retry, resolución/revisión de todos los hijos,
  bloqueo de publicación individual y publicación padre. Cada cierre 0.25 y AUM
  del rango 0.25; Revenue ausente, sin sumar fotos mensuales. Originales privados
  descargados byte a byte por administrador, lector rechazado. Auth y transporte
  Storage simulados; SQL y aplicación reales locales.

Fuera de esta evidencia: muestras privadas/conciliación real, servicios efectivos
Supabase Auth/Storage, despliegue, migración remota, histórico con varios custodios
en un único archivo, archivo/mes completo mayor al límite y comisiones. Los
meses excluidos/ausentes no se certifican como cero. La confirmación explícita del
operador acredita el alcance completo; el software no puede saber si el Excel
contiene toda la foto real.

Cierre de comprobaciones finales de esta etapa:

- La suite integral se repitió con interrupción inyectada del POST Storage:
  conserva padre/hijos registrados; intentar preparar sin original devuelve 502
  y deja hijos `uploaded`, sin consumir cursor. Cambiar la hoja histórica desde
  el hijo devuelve 409 sin invalidarlo. Reponer los mismos bytes con idéntica
  solicitud recupera la operación y permite completar/publicar los 36 meses.
- Chrome headless local con Playwright: pestaña histórica y apertura por UUID,
  36 períodos y progreso 108/108, estado publicado sin botón de republicación,
  vistas a 1440 y 390 px sin desborde horizontal del documento. Archivo sin
  período válido: alerta bloqueante, cero hijos, errores JSON descargados con
  fila/celdas/ceros conservados y original descargado byte a byte desde el padre.
  Sin excepciones JavaScript del cliente. Capturas sintéticas inspeccionadas en
  `/tmp/gma-historical-ui`; no se incluyeron en Git ni se revisaron datos reales.
- Build, lint/typecheck y 27 unitarias correctos tras el ajuste final de recuperación.
  `git diff --check` correcto. No se aplicaron migraciones ni despliegues remotos.


## Advisory ACT/365 — validación local sintética, 2026-11-17

Alcance nuevo: helper puro `src/lib/commissions/advisory.ts`, cuatro tests en
`tests/advisory.test.ts` y actualización de diseño/continuidad. Se preservan los
cambios locales preexistentes de AUM histórico. Sin migraciones de comisiones,
cambios de dependencias, lockfile, integración, base remota ni datos reales.

Ejecutado con Node 24.22.3 del runtime y npm local disponible en `/tmp/gma-npm`:

- `npm test`: **31/31** correctas (27 anteriores + 4 nuevas). Vectores brutos de
  90/91/92 días, Q1 bisiesto con días explícitos y divisor fijo 365, tasa cero,
  faltantes simultáneos, negativos, importe >2^53 con centavos, presentación
  ±1.005 y rechazo de convenciones/entradas inválidas. Repetición/corrección pura
  no muta un resultado anterior; esto NO valida versionado persistido.
- `npm run lint`, `npm run typecheck` y `npm run build`: correctos.
- Revisión de fórmulas/modelo/migraciones propuestas/matriz y `git diff --check`.
  El plan era archivo nuevo sin seguimiento al iniciar; se revisa su contenido
  completo además de los diffs de documentación bajo seguimiento.

El helper usa fracciones de enteros BigInt para conservar divisiones periódicas;
solo redondea presentación bajo escala/modo explícitos, siempre `finalFee: null`.
No valida fechas ni deriva días de calendario; recibe días acreditados por el
llamador. No confirma equivalencia del balance de origen con Assets Billed On,
ni la unidad de tasa recibida: exige valores canónicos semánticamente confirmados.
No tiene consumidores en UI/importación ni escribe importes financieros.

Preparados en el plan, **no ejecutados**: prorrateos, redondeo de final por cuenta,
completitud integral, auditoría de correcciones de comisiones, doble flujo,
reimportación SQL/HTTP y concurrencia. Requieren política financiera y M2/M2b.
No se reejecutaron `test:db`, suites HTTP o navegador: no hay cambios en sus
rutas/esquema/UI por esta actualización. No se acreditan Addepar ni cobros reales.

## Motor trimestral y conciliación — 2026-11-17

Implementación y pruebas sintéticas locales. Se preserva el trabajo preexistente
de historia AUM/advisory; no se modifica base/despliegue remoto ni dependencias.

- PostgreSQL 17.12 temporal, socket privado sin TCP: `test:db` completa correcta.
  Cadena de migraciones con operador CREATEROLE/BYPASSRLS sin SUPERUSER, permisos
  temporales retirados, RLS/admin-sesión y restauración de esquema desde cero.
- `tests/database/commissions.test.sql`: 0.25%, 0.5%, 1%; variación de tasa entre
  trimestres; cero/negativos/ausentes; decimales extensos >2^53; JSON Number/NaN
  rechazados; corte obligatorio; varias filas Revenue, reales sin esperado,
  esperado sin reales, base no histórica/fee desconocido, cinco estados, filtros
  USD/porcentaje y totales comparables; base cero deja porcentaje null.
- Originales y control anual Excel, rechazo de comparar neto contra bruto,
  reimportación idempotente, cambio de payload con misma clave rechazado,
  duplicado económico rechazado, corrección conserva historia e invalida cálculo;
  clasificación corregida y reemplazo publicado de Revenue exigen revisar.
- Doble entrada del mismo movimiento, reserva entre obligaciones y beneficiarios
  incompatibles rechazados; lector con user_metadata admin y anónimo rechazados.
- `scripts/test-commission-concurrency.sh`: dos sesiones PostgreSQL disputan el
  mismo movimiento para obligaciones distintas; exactamente una confirma.
  Dos retries simultáneos del ganador dejan un único evento. Regresiones previas
  de concurrencia de publicaciones mensuales/históricas también correctas.
- `npm test`: 31/31 anteriores correctas. Lint, TypeScript y build correctos;
  sin cambios de dependencias/lockfile. Revisión React: consulta en servidor,
  permisos antes de consultar, formulario con labels, tabla semántica, vacío/error
  explícitos, datos financieros conservados como strings sin cálculo en JS.

El sandbox no permite shmget para initdb: la suite SQL se ejecutó con permiso
ampliado únicamente sobre clústeres locales efímeros. No se usó URL remota.
Las primeras iteraciones fallaron por sintaxis/propiedad/nombres SQL y fixtures;
se corrigieron y se repitió la suite completa antes de registrar éxito.

Límites: no muestras privadas/conciliación de negocio, upload/parser XLSX de
comisiones, bytes de origen reales, servicios efectivos Supabase Auth/Storage,
publicación de comisiones para lectores ni liquidaciones. Ver supuestos abiertos
en `commissions.md`. Fecha de corte es input acreditado, no una política de
negocio inferida por el motor. Sin QA visual en navegador de la nueva bandeja.

Integración completada: `scripts/test-dashboard.mjs` + `test-commissions-http.mjs`,
Next compilado real → RPC → PostgreSQL local. Auth/PostgREST y Storage son transporte
sintético explícito del arnés; la aplicación y las funciones SQL son reales.
Verifica origen POST, lector sin consulta ni contenido SSR, tasa 0.25%, corte
2025-12-31 para Q1 2026, control bruto anual Excel, reintento, clasificación de
Payout broker, Matched, filtros inválidos y HTML con beneficiario/estado/corte.
La suite integral también pasó con los escenarios previos de dashboard, cuentas,
CSV, FA fechado, importación mensual e historia de 36 meses; clúster/servidores
cerrados y eliminados al terminar. No es un test de servicios Supabase remotos.

Cierre final SQL repetido: dos movimientos físicamente distintos con mismo importe
0.1 conservan multiplicidad y suman 0.2; escrituras directas insert/update/delete
del administrador API denegadas. Fechas de corte ambiguas como 01/02/2026
rechazadas; sólo ISO con año. Una base/tasa normalizada no queda verificada si
su celda original está vacía. Cadena, carreras y restauración completas correctas
tras estas restricciones finales. `git diff --check` correcto.

## Comisiones visuales y QA integral — 2026-11-17

Historia verificada: navegación Comisiones → vistas/filtros → RPC administrativa
→ PostgreSQL → KPIs/tablas/gráficos → API CSV; detalle → clasificación/revisión
→ comando versionado → auditoría → consulta actualizada.

Entorno: Node 24.22.3 y dependencias del lockfile existente; PostgreSQL 17 temporal
con socket privado, sin conexiones remotas. Next real. En la suite HTTP, Auth,
PostgREST y Storage usan transporte sintético hacia SQL real; no constituye prueba
de los servicios efectivos de Supabase. Se consultó documentación oficial de
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y
[changelog CLI v3](https://supabase.com/changelog/supabase-cli-v3). CLI 3.1.0 sólo
creó el archivo de migración local con telemetry desactivada; sin push remoto.

Checks ejecutados: lint, typecheck, 34 unitarias (3 nuevas de orden decimal,
filtros y CSV injection), test:db, build y test:dashboard. PostgreSQL verifica
migraciones desde cero con operador sin SUPERUSER, grants/owner, RLS forzada,
lector con user_metadata adulterado, anónimo y rechazo de escrituras directas;
comisiones nuevas heredan sesión/rol administrativo del motor. Suites anteriores
de publicación/concurrencia/historia y restauración de esquema también ejecutadas.
La primera ejecución SQL detectó una ambigüedad de nombre variable/columna en el
nuevo agregador; se corrigió y la suite completa final pasó.

Nueva evidencia SQL/HTTP: KPI esperado/comparable separados, importes exactos,
UUID distintos de cuentas, multiplicidad Revenue, Balance N/D entre snapshots o
componentes repetidos, originales/ceros iniciales, evidencia de ambos cobros,
cuatro vistas SSR, filtros inválidos, CSV privado por vista y todas las páginas,
27 beneficiarios/25 por página, 54 esperado vs 2 comparable/2 real, 26 pendientes,
exportación obsoleta rechazada 409 y corrección que conserva el evento anterior e
invalida el resultado hasta nueva revisión. El caso de paginación se corrigió en
la prueba para aplicar el mismo filtro de base que su población esperada; sin
él hay además movimientos de Revenue sin clasificar, correctamente conservados.

| Paso solicitado | Evidencia local/sintética y límite |
| --- | --- |
| 1. Cargar histórico AUM | Parser XLSX en unitarias y carga CSV multiperíodo vía HTTP; original privado sintético. |
| 2. Detectar períodos | 36 meses × 3 cuentas × 2 custodios; inválidos/omisiones bloqueantes sin fabricar meses. |
| 3. Resolver cuentas | Alias/custodio explícitos; ceros originales; sin coincidencia por nombre. |
| 4. Revisar/publicar | Revisión padre, transacción conjunta, rollback, concurrencia y retry. |
| 5. Dashboards AUM | Cierre 0.25 en rango histórico, sin sumar fotos; regresión 120 AUM / 22 Revenue. |
| 6. Importar comisiones | **No completo:** eventos de entrada revisada vía API; falta upload/parser/Storage de Excel. |
| 7. Resolver beneficiarios | Referencia literal con evidencia y clasificación revisada; sin resolver homónimos por nombre ni catálogo de identidades nuevo. |
| 8. Publicar snapshot | **No completo como importación:** evento expected auditado; falta preparación y publicación atómica de archivo completo. |
| 9. Esperado | Balance × tasa anual / 4, evidencia por trimestre; falta conserva null. |
| 10. Relacionar Revenue | Clasificación y vínculo explícitos por cuenta/custodio/trimestre/beneficiario/tipo/base; sin doble asignación. |
| 11. Diferencias | Nominal/porcentual sólo comparables; expected cero → porcentaje N/D; cambios invalidan revisión. |
| 12. Exportar | Cuatro variantes completas, precisión, faltantes, estados, revisión y procedencia; protección CSV injection. |
| 13. Corregir | Histórico/mensual versionados; corrección de expected/classificación por comando. No hay corrección de archivo de comisiones todavía. |
| 14. Conservar historia | Tests SQL/HTTP de versiones previas, aislamiento de alcance/custodio, rollback e inmutabilidad; no restaura backup financiero productivo. |

No se declara importación financiera real validada. Pendientes: archivo privado y
conciliación de negocio, volumen representativo, adaptador de comisiones,
resolución de identidades ambiguas con evidencia, proyección publicada para
lectores, Auth/Storage efectivos y habilitación remota separada. Sin despliegue,
planes pagos ni importaciones reales. El test de esquema recuperado no equivale
a recuperar un backup completo de datos/Storage productivo.

Revisión de navegador adicional: Chrome headless local, cuatro vistas × anchos
1440/768/390/320 sin desborde del documento ni excepciones cliente; navegación de
beneficiario, orden/paginación, CSV descargado, formulario que guarda revisión con
motivo/actor y estado posterior confirmado, vacío/error y lector sin acceso. Dos
trimestres con expected/receipt/reconcile sintéticos vigentes renderizaron barras
y evolución en 1440/390. Capturas inspeccionadas visualmente; tablas móviles se
ajustaron a ancho mínimo y scroll local, sin comprimir palabras. Los primeros
scripts de navegador requirieron esperar navegación/refresh asíncronos de Next,
y esperar contenido en lugar de networkidle por las precargas; las verificaciones
de estado final y guardado fueron satisfactorias. No se confunden esos timeouts
del arnés con fallos confirmados de aplicación. Todos los servidores/clústeres
creados por esta etapa se cierran al terminar.

Cierre final: `test:db` también cruza dos páginas RPC con 501 movimientos sin
clasificar: conserva las 501 filas/pendientes y no inventa cobro comparable.
El build final se revisó en Chrome a 1440/390/320 con las cuatro vistas: tabla
mínima de 1100 px, scroll propio y documento sin overflow; enlace trimestral
conserva año/trimestre/base. Capturas sintéticas finales en
[qa-comisiones-2026-11-17](</Users/franciscolang/Documents/ChatGPT/App Papa/qa-comisiones-2026-11-17>).
Repetición final satisfactoria de lint/typecheck/test/build/test:db/test:dashboard;
`git diff --check` sin errores. Servidores y clústeres de esta etapa cerrados.

## Migraciones en Supabase GMA — autorización posterior, 2026-11-17

Destino confirmado por el dueño: `gma-software-prueba` (`zwdqnrbqqszjrtkhyqnz`),
PostgreSQL 17.11.0.019, sa-east-1, ACTIVE_HEALTHY. Antes: ocho migraciones aplicadas,
cero filas AUM/Revenue/lotes y cero scopes publicados. Aplicadas en orden las
versiones `20261117133211`, `20261117175338` y `20261117181230`, sin cambiar su SQL.
MCP asignó inicialmente `20261117183722`, `20261117183733`, `20261117183743`;
se alinearon sólo esas claves de `supabase_migrations.schema_migrations` con las
versiones canónicas locales, en transacción que exigía los tres pares versión/nombre
y ausencia de las claves destino. No se cambió contenido/nombre ni historia previa.
Listado remoto final coincide con las 11 versiones del repositorio.

Verificaciones ejecutadas remotamente:

- `import_uploads` y `commission_events`: RLS habilitado/forzado.
- Wrappers públicos invoker; funciones privadas del ejecutor con search_path vacío;
  ejecutor NOLOGIN/NOBYPASSRLS, cero membresías con INHERIT o SET.
- EXECUTE denegado a anon/service_role, permitido a authenticated con comprobación
  interna de admin/sesión. INSERT directo de eventos y UPDATE directo de cargas
  denegados a authenticated.
- SQL transaccional bajo anon y authenticated sin sesión: consulta/comandos
  rechazados por insufficient_privilege, sin crear perfiles o datos para probar.
- SQL de lectura bajo authenticated con claims de una sesión admin existente,
  elegida internamente sin devolver identificadores: `commission_dashboard` ejecuta
  el cuerpo completo, retorna row_count 0/summary vacío y rechaza trimestre 9.
  Rollback de toda la prueba. No equivale a autenticación HTTP/JWT de extremo a extremo.
- Conteos finales: AUM, Revenue, lotes, scopes publicados, cargas históricas y eventos
  de comisiones continúan en cero. No se cargaron datos, no se modificaron cuentas
  Auth ni se ejecutó despliegue de aplicación.

Advisors ejecutados, no limpios:

| Categoría | Resultado | Seguimiento |
| --- | --- | --- |
| Seguridad | 1 WARN: protección de contraseñas filtradas desactivada | [Documentación de Auth](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); configuración no cambiada. |
| Rendimiento | 14 WARN auth_rls_initplan | [Guía](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan); incluye commission_insert. |
| Rendimiento | 16 WARN multiple_permissive_policies | [Guía](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies); incluye import_uploads. |
| Rendimiento | 38 INFO unindexed_foreign_keys | [Guía](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys); evaluar con volumen real. |
| Rendimiento | 17 INFO unused_index | [Guía](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index); base sin hechos, no eliminar por falta de uso inicial. |

No se ejecutaron pruebas sintéticas de escritura sobre el remoto ni se reejecutaron
suites locales por esta aplicación del mismo SQL ya probado. Actualización documental
revisada con `git diff --check`. El circuito Excel de comisiones y los datos reales
siguen pendientes; esta comprobación sólo acredita aplicación del esquema y checks
remotos específicos anteriores.


## Alta de custodios / identidad de sesión — 2026-11-17

Lecturas remotas GMA (`zwdqnrbqqszjrtkhyqnz`): log `permission denied for schema
auth`; app_papa_executor tiene EXECUTE auth.uid pero no USAGE auth. postgres carece
de USAGE WITH GRANT OPTION. Primer GRANT registrado como migración 20261117200819
sin efecto, confirmado por has_schema_privilege=false. Cero custodios. Sin cambios
de cuentas Auth, fuentes o datos financieros.

Corrección preparada: SQL BEGIN ATOMIC invoker preenlaza auth.uid, sustitución
acotada en nueve funciones privadas y retirada de membresía/CREATE temporales.
`test:db` completa correcta con PostgreSQL 17 temporal/socket privado y USAGE auth
revocado antes de TODAS las suites. Regresión crea custodio desde authenticated
admin mediante preview/save, preview no persiste entidad y save conserva auditoría.
Se ejecutaron suites de roles/RLS, preparación/publicación mensual e histórica,
comisiones, concurrencia y restauración; cadena con operador sin SUPERUSER correcta.
Primer intento del nuevo SQL falló por INHERIT false al reemplazar función de otro
owner: corregido al patrón transitorio existente y suite completa repetida con éxito.
No cambios de Next/UI/dependencias: no se ejecutaron build/lint ni navegador.

Sandbox requirió ejecución ampliada sólo para memoria compartida del PostgreSQL
local efímero; suite terminada y clúster eliminado. `git diff --check` correcto.
Advisors remoto antes/después del GRANT: mismo WARN previo de [contraseñas filtradas]
(https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
sin cambio de configuración.

Revisión automática rechazó prueba remota con sesión admin existente y luego la
aplicación de prebind_session_identity por alcance de funciones compartidas/roles.
No se eludieron rechazos. Segunda migración sólo local, pendiente de autorización.
No se acredita creación remota exitosa ni autenticación HTTP real del dueño.


## Corrección de identidad autorizada y aplicada — 2026-11-17

Autorización explícita del usuario después del rechazo de revisión. Migración
prebind_session_identity aplicada con éxito a GMA, versión 20261117201233. Se
renombró archivo local a esa versión; sin cambios al SQL ya probado localmente.
No se reejecutó suite local porque el contenido de implementación no cambió.

Comparación programática remota de los nueve registros pg_proc antes/después:
único cambio de cuerpo es auth.uid() → app_private.session_user_id(); coinciden
OID, owner, ACL, prosecdef y proconfig en los nueve casos. Helper LANGUAGE SQL
invoker con prosqlbody no nulo y search_path vacío; no ejecutable directamente
por anon/authenticated/service_role. Ejecutor NOLOGIN/NOBYPASSRLS, sin CREATE,
sin SELECT auth.users/auth.sessions y cero membresías con INHERIT/SET.
Escritura directa de custodians sigue denegada a authenticated. Cero custodios.

Prueba SQL remota del helper bajo rol ejecutor SIN claims/sesiones, con membresía
transitoria contenida en BEGIN/ROLLBACK: retorna null, no error de esquema auth.
No se leyó ni suplantó ninguna sesión administrativa real. Advisors de seguridad
mantiene únicamente el WARN previo de [contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Configuración Auth sin modificar. Sin datos financieros, pruebas UI/HTTP reales
ni despliegue de aplicación. Próxima comprobación: dueño reintenta alta por web.
Revisión documental y git diff --check correctos.


## Varios custodios — implementación y QA del 17/11/2026

Historia: formulario histórico AUM+REF / REV completo → validación Next → originales
Storage privados/manifiesto padre → hijos por fuente/mes/custodio → correspondencias
existentes → revisión y publicación conjunta → dashboards. Sólo sintéticos en SQL,
HTTP y navegador; diagnósticos de las fuentes reales fueron exclusivamente lectura.

Checks locales ejecutados: lint, typecheck, build y 37 unitarias correctas. Test:db
completa con PostgreSQL 17 temporal/socket privado, operador sin SUPERUSER, guards,
roles, concurrencia y restauración. Nuevo SQL verifica AUM y Revenue en ambos
custodios, >120 alcances (130), retry, fallo inyectado entre custodios con rollback
total, identidades separadas, catálogo/exclusión inválidos, publicación individual
denegada y lector con metadata adulterada. Membresía/CREATE transitorios retirados.

Capacidad sintética: 18.480 filas / 528 alcances AUM con sumas exactas y manifiesto
<8 MiB; lectura/partición en ~148 ms en una ejecución (no SLA). Límites mensuales
previos intactos. Unitarias adicionales: pares REF ambiguos, custodio desconocido,
header desplazado, repetición Revenue, faltantes bloqueantes, notas con motivo y
rechazo de excluir movimientos. Se preservan todas las pruebas previas.

HTTP integral con Next compilado y PostgreSQL real local; Auth/PostgREST/Storage son
transportes sintéticos explícitos del arnés. AUM+REF y REV de dos custodios, headers
desplazados, catálogo nuevo entre alta y retry sin alterar el snapshot, originales
privados byte a byte, permisos, revisión/publicación/retry y dashboard 240 AUM/10
Revenue. También regresiones anteriores de historia 36 meses, FA, 120/22, cuentas,
CSV y comisiones. Primera ejecución faltaba pg_config en PATH; segunda campaña
visual detectó que un guard de notas AUM trataba su columna de título como dato:
se acotó a identificadores/período/importe y se repitieron build/unitarias/HTTP.

Chrome local headless: envío real del formulario AUM+REF sin selector global,
preparación 2/2 sin errores hasta correspondencias; descarga REF idéntica, selector
REV no exige REF. Anchos 1440/390 sin overflow del documento ni excepciones cliente;
capturas sintéticas inspeccionadas en /tmp/gma-multi-ui. Primera captura mostró la
convención CSV sin definir (bloqueo esperado); luego se seleccionó punto decimal.
El arnés asumía v1 pese a reintentos anteriores: diagnóstico confirmó estado válido
needs_resolution y se ajustó la aserción a la versión real. No cambio funcional por
ese último timeout/assert. Sin navegador remoto autenticado con sesión del dueño.

Lectura privada con el nuevo parser, SIN persistir/importar: AUM 18.800 filas, 434
alcances, encabezado 4, cero filas sin custodio con catálogo REF completo, manifiesto
2.508.650 bytes (~410 ms); Revenue 17.893 filas, 225 alcances, encabezado 3, una nota
sin alcance, manifiesto 2.530.679 bytes (~927 ms). Se preservan 1.645 incidencias de
identificadores numéricos en AUM y 597 incidencias en REV (tipos numéricos, faltantes,
error Excel); este resultado NO acredita publicación. Sin datos originales en Git.

Documentación oficial consultada: changelog Supabase y Standard Uploads, y CREATE
FUNCTION PostgreSQL 17. Dependencias/lockfile sin cambiar. La nueva migración se
generó con CLI existente y telemetry desactivada, se probó y luego aplicó a GMA.
Versión MCP 20261117224406; archivo local renombrado sin alterar SQL. Comprobación
remota: ejecutor propietario, anon sin EXECUTE, authenticated sujeto a admin/sesión,
CREATE revocado, cero membresías transitorias, cero cargas y scopes publicados.
Advisors conserva únicamente WARN previo de [contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
No se cambiaron usuarios, configuración Auth, planes, datos financieros o índices.


Habilitación final: deployment dpl_6gT2MXhKVy1NsWn3YVoJVq7JNvWi READY y alias
canónico gma-software.vercel.app actualizado. Snapshot de runtime allowlist (85
archivos, sin fuentes/secretos) documentado en progress.md; no se hizo commit/push.
GET remoto /importaciones mediante conector Vercel devuelve 200 con login español,
sin error interno. API remota no verificable en este intento: share link reutilizado
rechazado por Vercel Authentication (401 de protección, no evidencia del handler).
No se eludió protección, ni se usó sesión real para probar carga/publicación.
Captura móvil de viewport normal confirma un único main/encabezado y sin overflow;
fullPage había repetido capas fijas al componer imagen, sin duplicación del DOM.
Todos los servidores/clústeres locales terminados. Revisión git diff --check correcta.


## Timeout de registro histórico — 2026-11-17

Evidencia remota de sólo lectura: cuatro cancelaciones por statement timeout en la
ventana 22:50–23:10 UTC; la de 22:58:56 identifica import_comparison → group by
original_cells → current_access/RLS, invocada por cada hijo en manage_historical.
Roles authenticated/authenticator tienen statement_timeout=8s. Estado: una carga
AUM previa en preparación, sin scopes publicados; el REV fallido no dejó un padre.
No se usaron claims/credenciales de una sesión existente para reproducirlo.

No se elevaron timeouts globales ni se agregaron tablas/índices: la corrección sólo
reemplaza la construcción del resumen final por comparación revisada + JOIN actual
de versión activa. Se conserva el resto de manage_historical, guards, comparación
por hijo, autorización y publicación. SQL generado con CLI existente (telemetry off).
La primera versión local cortaba el bloque SQL equivocado al generar el archivo:
falló en sintaxis, se corrigió antes de cualquier aplicación remota y se repitió.

Test SQL nuevo, sintético: 18.080 coordenadas con huellas diferentes/226 alcances,
configuración 8 s. Su stub transaccional rechaza cualquier llamada del padre a la
conciliación completa: falla con la implementación anterior y pasa con la nueva;
luego restaura la función original y prepara un bloque de 80 filas. Conserva un
padre, 226 hijos, 80 filas y ningún publicado. Registro ~554 ms, retry ~32 ms e
inspect ~16 ms en ejecución local. Antes (sin stub), ~692/162/145 ms; la velocidad
de este equipo no reproduce la de Supabase y no se presenta como SLA productivo.

Suite test:db completa correcta: operador sin SUPERUSER, permisos retirados,
regresiones de identidad/publicación mensual/histórica, ambos custodios/fuentes,
130 alcances, rollback, concurrencia, comisiones y restauración. Tests nuevos de
pending inicial sin diferencias inventadas, comparación revisada exacta y revisión
obsoleta marcada sin aceptar publicación. 37 unitarias, lint, typecheck y build
correctos. HTTP integral Next real → SQL real local, transporte Auth/Storage
sintético: inyección de 57014 devuelve 503/id/retryable, no filtra mensaje SQL privado,
retry con misma solicitud registra una vez y permite completar el circuito. Resto
de suites previas también correcto; servidores/clústeres terminados. Sin nueva QA
visual: interfaz sólo cambia mensaje pendiente/deshabilitación ligados al estado.

Remoto: migración 20261117231136 aplicada a GMA. Verificado owner app_papa_executor,
SECURITY DEFINER y admin guard existentes, ausencia de llamada por hijo en resumen,
ACL authenticated/anon, CREATE revocado, cero membresías y timeout 8s conservado.
Conteos sin cambios: una operación previa y cero scopes publicados. Advisors conserva
el WARN anterior de [contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
No se cambiaron datos/usuarios, ni se publicó el archivo del dueño. Documentación y
git diff --check correctos. Reintento de carga real por web pendiente del dueño.

## Timeout durante preparación acumulada de REV — 2026-11-18

Diagnóstico remoto de sólo lectura: error 57014 a las 00:15:28 UTC en
guard_upload_row, búsqueda de coordenadas existentes con JOIN entre import_rows e
import_batches, invocada por prepare_import_chunk. Última carga: 225 alcances,
109 iniciados, 7.889 filas persistidas; cero scopes publicados. También se encontró
un timeout anterior de registro a las 23:34:09 UTC en guard_upload_batch, seguido
de registros exitosos. El fallo más reciente corresponde a preparación, no a parser
ni a rechazo de las excepciones del archivo.

Migración mínima reemplaza sólo guard_upload_row y retira el barrido redundante.
Conserva la comprobación de mes/custodio/hoja/fila/huella del manifiesto inmutable;
la unicidad global del manifiesto y por hijo hacen innecesaria esa búsqueda.
Restricciones e índices UNIQUE remotos comprobados antes de aplicar.

Prueba de capacidad anterior cubría sólo el primer bloque de 80 filas. Ahora se
preparan las 18.080 filas de 226 alcances en comandos separados, cada uno sujeto a
statement_timeout=8s. Recuento/suma decimal exactos, todos needs_resolution y retry
del último bloque sin duplicados. Se conservan movimientos idénticos en coordenadas
distintas. Una ejecución aislada y otra dentro de la suite completa finalizaron.
Registro/retry/inspect en la suite: ~571/33/17 ms; no se midió latencia real de retoma
en Supabase ni se afirma un SLA para completar el archivo.

Nuevos casos pequeños verifican duplicado de coordenada mediante UNIQUE (23505),
fila de otro custodio, período falso y fingerprint adulterado. Todos revierten el
bloque completo. Con el código anterior el caso de duplicado falla en la expectativa
de 23505 porque ejecuta el antiguo barrido y lanza P0001; esto comprueba el cambio de
vía de validación, no reproduce por sí solo el timeout remoto.

Suite test:db completa correcta: migraciones con operador CREATEROLE/BYPASSRLS sin
SUPERUSER, permisos retirados, fuentes mensual/histórica/multicustodio, precisión,
publicación/reintentos, concurrencia, roles y restauración. Primera ejecución local
no pudo iniciar PostgreSQL por memoria compartida bloqueada en sandbox; ejecución
autorizada posterior usa sólo clúster temporal sintético, terminado y eliminado.
Sin cambios TypeScript/UI/runtime: no se repitieron build, HTTP ni QA visual.

Documentación oficial revisada: [changelog](https://supabase.com/changelog.md) y
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
CLI existente con DO_NOT_TRACK=1 generó el archivo. Migración aplicada sólo a GMA
como 20261118130529; nombre local alineado sin cambiar SQL. Consulta posterior
confirma owner postgres, SECURITY INVOKER, search_path vacío, comprobación del
manifiesto intacta y ausencia del JOIN redundante. CREATE del ejecutor sigue
revocado; authenticated/authenticator conservan timeout 8s. Sin índices, tablas,
roles o permisos nuevos. 7.889 filas y cero scopes publicados antes/después.
Advisors conserva sólo el aviso previo de
[contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Sin importación ni publicación de fuentes reales desde el agente; falta que el
dueño retome la preparación y concilie la carga real. git diff --check correcto.

## Resolución/conciliación de REV por bloques — 2026-11-18

Helper administrativo nuevo resolve_historical_revenue: máximo 50 filas pendientes,
con lock del circuito, pertenencia del hijo al padre y guard de sesión/admin. Reutiliza
manage_import/resolve y su auditoría. Identidad: ACCOUNT literal + Revenue + custodio;
sin normalizar ceros/espacios, unir fuentes, deduplicar movimientos o asignar comerciales.
API valida confirmación/evidencia. UI conserva motivo explícito, pausa, retoma y
conciliación por el circuito existente; publicar sigue separado y exige todos los hijos.

40 unitarias, lint, typecheck y build correctos. Suite SQL completa correcta, incluyendo
operador administrado sin SUPERUSER, concurrencia y restauración. Nuevo test de 240
filas: 50+10 por hijo, retry sin duplicados, ceros, dos custodios, UUID reutilizados entre
meses, namespace, actor, NULL/negativos y multiplicidad exacta. Rechaza evidencia corta,
hijo de otro padre, lector con metadata adulterada y acceso anon/service_role. No publica.
Primer intento falló por un nombre de vista inexistente en el test, corregido antes de
remotos; segunda suite completa correcta. Clústeres temporales eliminados.

HTTP integral Next real→API→PostgreSQL real correcto; transportes Auth/Storage son
sintéticos. Nueva ruta probada con confirmación faltante (400), lector (403), resolución
exacta, retry idéntico, separación entre AUM y REV y conciliación/publicación posterior.
Conserva regresiones de 36 meses, varios custodios, correcciones, permisos y dashboard.
No se extrajeron credenciales ni se usó una sesión real para pruebas sintéticas.

Migración remota 20261118134006 aplicada a GMA. Owner app_papa_executor, anon sin
EXECUTE y CREATE revocado comprobados. Advisors conserva sólo el WARN previo de
[contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Despliegue dpl_4StFbRdnkm3LF1wJEniWxV2W5CrT READY y alias gma-software.vercel.app
asignado, sin error de build. Snapshot allowlist de 85 archivos/663.342 bytes, huella en
progress.md, sin .env, fuentes reales, tests ni docs. Código local sobre ed09eff, sin push.
Documentación oficial de [despliegues](https://vercel.com/docs/deployments) consultada.

La operación real solicitada se inició desde la UI autenticada del dueño, sin exportar
cookies/credenciales ni simular una sesión SQL. Evidencia menciona la delegación del
18/11, ACCOUNT literal/custodio y separación entre fuentes. Lectura previa: 749 claves
exactas, 683 presentes en REF y 66 ausentes; 17.893 filas válidas, 12 N/D y 1.312 ajustes
negativos. No se usó REF como alias para esta operación. Comprobación intermedia de
3.953 resoluciones: cero custodios incorrectos y cero referencias exactas ausentes.
Resultado real final: 17.893 resoluciones/749 cuentas, cero conflictos de referencia
exacta o custodio. Conciliación en 225/225 hijos ready; 17.893 hechos candidatos.
Control SQL por alcance: fila/cobertura/suma de candidatos = preparación = métricas
del lote, comparación decimal exacta verdadera para todos. Cada importe candidato
coincide con cell_metadata.amount, incluidas 12 ausencias y 1.312 negativos. La UI
registró la revisión conjunta: padre ready con review y cero scopes publicados.
Comprobante visual recortado a sólo el aviso de revisión, sin cifras/identificadores
financieros, en /tmp/gma-rev-revisada.png. No se publicaron datos.

La primera conciliación real se detuvo en 214/225. Logs muestran 57014 a las
14:02:24 UTC en advisor_at, invocada tres veces por movimiento desde import_comparison.
Se conservaban 214 conciliaciones y todas las resoluciones; el alcance fallido revirtió
sus hechos completos. Se reemplazó sólo el agregado por facts/attribution materializados:
una llamada por cuenta/mes, sin alterar asesor al cierre, RLS, multiplicidad o NULL.
Suite SQL completa repetida después del cambio; contador sintético demuestra 8
llamadas para 240 movimientos en 4 alcances/2 cuentas por alcance. Las restantes
pruebas de vigencias, cobertura, fuentes independientes, roles, concurrencia y
restauración pasan. Sin cambios runtime, no se repitió build/HTTP por este SQL aislado.
Migración remota 20261118140712, archivo local alineado, owner postgres e invoker
comprobados. Retoma real completó los 11 alcances pendientes y revisión padre.
git diff --check correcto. Sigue pendiente la publicación financiera y su dashboard.

## Publicación real de REV y lectura en Resumen — 2026-11-18

El dueño intentó publicar y luego pidió ver datos. Lectura remota confirmó padre
ready/published_at NULL/0 activos. Logs a las 14:21:13 UTC: 57014 dentro de guard_batch,
al sumar revenue_entries y evaluar current_access por fila. Se conservaron todos los
datos revisados y ninguna publicación parcial. Migración 20261118142741 modifica
sólo cuatro políticas published_scopes/batches/aum/revenue, sustituyendo la llamada
directa por (SELECT current_access()); predicados, roles y RLS permanecen iguales.

Suite SQL completa correcta con operador sin SUPERUSER, roles, rollback, concurrencia
y restauración. Nuevo contador temporal de autorización prueba <20 evaluaciones para
240 hechos; el mismo test falla al omitir la migración, detectando la regresión.
Prueba ampliada de capacidad ejecutada aparte: 18.080 filas/226 alcances preparados,
conciliados y publicados en una transacción, retry sin duplicados y 226 eventos de
publicación. Cada comando bajo 8 s; revisión conjunta ~275 ms, publicación ~1.177 ms
y retry ~10 ms en una ejecución local. Fixture sintético de dos identidades exactas
por custodio. Esto no promete el mismo tiempo en infraestructura compartida remota.

El reintento remoto a las 14:28:35 UTC volvió a 57014 dentro de record_change/auditoría,
con rollback total: padre ready y cero activos. Se definió presupuesto de 30 s sólo
para public.manage_historical, usando hoisting de settings de función documentado en
[Supabase](https://supabase.com/docs/guides/database/postgres/timeouts) y
[PostgREST 14](https://docs.postgrest.org/en/v14/references/transactions.html#hoisted-function-settings).
Migración 20261118143144 aplicada; NOTIFY de schema cache. Contrato local probado
con operador CREATEROLE/BYPASSRLS sin SUPERUSER: configuración 30s, invoker y anon
sin EXECUTE; ACL/propiedad del circuito intactas. Lectura remota comprueba roles
authenticated/authenticator=8s, lock_timeout authenticator=8s, sólo esta RPC=30s.

Publicación completada desde la sesión UI autenticada del dueño a las 14:32:06 UTC,
sin exportar credenciales ni simular claims. UI confirmó publicación conjunta;
SQL confirmó published/225 activos/17.893 filas/12 N/D y 225 eventos publish.
Comparación decimal de suma publicada vs revisada verdadera para los 225 alcances.
Sin modificaciones de otras cargas, borrados ni planes pagos. Advisors mantiene sólo
el WARN previo de [contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Navegación real a /?desde=2026-01&hasta=2026-08: Resumen ejecutivo, tarjeta Revenue
con importe visible, cobertura visible, sin estado vacío ni error. No se registraron
los importes ni identificadores financieros en logs o screenshots. Captura recortada
al título/período, /tmp/gma-resumen-publicado.png. Fuente abarca 2023-01 a 2026-08;
2026-11 fuera de cobertura explica otro motivo de vacío con el filtro por defecto.
Sin nuevo build/HTTP sintético porque sólo cambiaron SQL/configuración de RPC;
verificación real UI→API→datos publicados ejecutada. git diff --check correcto.

## AUM + REF: ampliación de resolución y preparación — 2026-11-18

Nueva carga del dueño: 18.800 filas/433 alcances. Primera operación conserva 1.645
bloqueos por identificadores numéricos; no había marcado la decisión autorizada.
Se creó otra operación con los mismos originales, aceptación numérica explícita y
motivo que cita la confirmación previa. SHA-256 y tamaños de ambos archivos de
Downloads coinciden con los subidos por el dueño; sin modificar libros. Nuevo
manifiesto: cero bloqueos, cero duplicados AUM y cero filas sin alcance. REF contiene
807 pares y no tiene ambigüedad por ninguno de los dos identificadores/custodio.

Helper AUM de 50 filas reutiliza manage_import/resolve: par literal REF, custodio,
consenso entre aliases AUM y REV. Ambigüedad o UUID contradictorio revierte el bloque.
Sin cuenta existente crea AUM propio y registra el alias Revenue acreditado por REF.
Evidencia añade SHA/hoja/fila REF; no modifica hechos REV ni infiere historia comercial.
Wrapper genérico invoker, con guard admin y ACL acotada, conserva el wrapper REV.

Preparación HTTP nueva comparte lectura/hash del original y REF dentro de cada
petición de hasta cinco alcances. Revalida ambos originales en cada petición, sin
caché persistente. Configuración se compara con la congelada, deriva resúmenes con
reportSummary y persiste por el mismo prepare_import_chunk, con cursor y límite de
250 filas/bytes por hijo. Fallo después de un hijo conserva sus cursores, no publica.

40 unitarias, lint, typecheck/build correctos; suite SQL completa correcta con operador
administrado sin SUPERUSER, roles, concurrencia y restauración. Nuevo test AUM+REF:
UUID REV reutilizado, cuentas propias, dos custodios, ceros, aliases explícitos,
evidencia, par ambiguo en segunda fila con rollback de la primera, UUID contradictorio
sin fusión, lector/anon denegados, sin Revenue ni asignaciones inventadas. Cierre de
rango AUM 2.6 sintético, sin sumar las fotos mensuales.

HTTP integral Next→PostgreSQL real con Auth/Storage sintéticos correcto: preparación
de cinco alcances en historia de 36 meses, cuatro alcances AUM+REF/REV por lectura,
retry sin nuevas filas, lector denegado, enlace por REF a la misma cuenta y reporte
con AUM 240/Revenue 10. Conserva las regresiones previas, 120/22, originales privados,
correcciones y permisos. Servidores/clústeres sintéticos eliminados.

Migración 20261118150030 aplicada sólo a GMA, archivo local alineado; owner ejecutor,
invoker público, anon sin EXECUTE y CREATE revocado comprobados. Runtime desplegado
como dpl_GVGn4YBaXfjN2Zgghwz1DRxsvgpH READY con alias canónico: snapshot allowlist
de 86 archivos/668.057 bytes, SHA a3184ff3cec4934c390b5eb98ba0541363f88360c18b98a1ed4b8b4885f50eba,
sin .env, fuentes reales, tests ni docs. Código local sobre ed09eff, sin push.

Flujo real anterior pausado desde UI en 8.781 filas; retoma del mismo UUID con la
nueva preparación llegó a 18.800/18.800, 433 hijos needs_resolution y cero bloqueos.
Resolución real ejecutada desde la sesión del dueño tras «continua», con evidencia y
confirmación explícitas: 18.800 filas, 745 cuentas AUM, 655 compartidas con Revenue
publicado, 90 propias. Query independiente de aliases AUM (ambos namespaces), alias
Revenue y custodio: cero conflictos. Conciliación real completa: 433 hijos ready,
18.800 hechos candidatos, sumas/recuentos/cobertura por alcance iguales a preparación
y métricas revisadas; cada importe coincide con cell_metadata.amount. Cero duplicados
de cuenta/mes. Revisión conjunta confirmada por UI y SQL: padre ready/review presente.

Publicación no ejecutada: la revisión automática rechazó el intento por requerir
autorización explícita para publicar las 433 fotos, sin considerar «continua» suficiente.
No se intentó ninguna vía indirecta. Observación posterior de navegador rechazada por
permiso de origen declinado; no se reintentó ni se cambió de navegador. No hay captura
final nueva por ese bloqueo. Última consulta SQL de estado (anterior al rechazo de
observación): AUM activo=0; Revenue publicado conserva 17.893 filas y sumas por sus
225 alcances exactamente iguales a las revisadas. Se pide autorización específica de
publicación y acceso al navegador. No se exportaron credenciales ni se simularon claims.

## Publicación AUM: timeout al cierre y presupuesto acotado — 2026-11-18

Tras la autorización explícita y el intento manual del dueño, SQL confirmó ready,
published_at NULL, 0 alcances/filas AUM activos. Revenue conserva sus 17.893 filas y
sumas revisadas. Logs a las 18:31:36 UTC: 57014 dentro de guard_upload al actualizar
el padre a published, después del bucle de 433 publicaciones. Transacción revertida
íntegra; se conservan candidatos y revisión. No es una diferencia de importes.

Se revisó la [documentación oficial de timeouts](https://supabase.com/docs/guides/database/postgres/timeouts):
presupuesto por función y máximo de API de 60 s. Nueva migración 20261118183517,
generada con CLI existente/DO_NOT_TRACK, aplicada sólo a GMA, archivo local alineado.
Contrato actualizado a statement_timeout=60s probado en PostgreSQL temporal con
operador CREATEROLE/BYPASSRLS sin SUPERUSER; finalizó correctamente y eliminó su
clúster. Verifica invoker, anon sin EXECUTE y permisos/propiedades existentes.

Consulta remota posterior confirma sólo manage_historical=60s, search_path vacío e
invoker, anon sin EXECUTE. Authenticated/authenticator=8s, lock_timeout=8s intactos.
Padre AUM aún ready y cero activos. Sin cambios de lógica financiera, permisos ni
runtime; no se repitieron build/HTTP/suite financiera por este ajuste de configuración.
No se reintentó navegador ni publicación indirecta ante el bloqueo guardado. Pendiente
reintento real del dueño y verificación posterior. git diff --check correcto.

## Publicación AUM confirmada por el dueño — 2026-11-18

Después de «Listo», consulta remota de sólo lectura confirmó padre published con
published_at=2026-11-18T18:37:17.165361Z, 433 punteros activos, 18.800 filas AUM
y 745 UUID distintos en el histórico. Comparación numérica por los 433 alcances:
suma publicada = métrica revisada, todas verdaderas. Revenue conserva 17.893 filas
y todas las sumas de sus 225 alcances revisados. El último reintento real con 60 s
sí terminó; no se afirma que la ejecución local representara su latencia remota.

Publicación realizada por el dueño, sin automatización indirecta ni simulación de
sesión ante el permiso guardado de navegador. No se tomó captura ni se afirmó QA
visual posterior de AUM. Se entrega enlace al Resumen con enero–agosto 2026, dentro
de la cobertura publicada; AUM = cierre de agosto, Revenue = suma del rango. Código
sin cambios adicionales; revisión documental/git diff --check correctos.
