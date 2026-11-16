# Validación — evidencia local y pendientes

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
