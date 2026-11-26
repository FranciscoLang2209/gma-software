# Calidad de datos — evidencia de validación

## Comisiones y cierre de QA real — 2026-11-26

Corregido timeout real de Comisiones: una lectura del conjunto, conserva límites
explícitos y cálculos. Prueba de 2.400 movimientos, suite SQL completa y recorrido
HTTP/Chrome completos correctos tras la migración. Comisiones T2 2026 y cambio a
T1 desde formulario verificados con sesión admin real. También se completó el
recorrido de las demás pantallas sobre 3cad1bc READY. Diez migraciones nuevas,
42 versiones alineadas; ver [QA final](data-quality-final-qa.md).

## Fase 10 verificada — 2026-11-25

98/98 unitarias, lint/typecheck/build, Auth HTTP, suite SQL completa (incluidas
concurrencia/restauración) y HTTP + Chrome, 14 vistas 1440/390, correctos.
QA y correcciones reales, matriz reproducible, roles, nueve migraciones aplicadas
y comparación de once proyecciones originales en [QA final](data-quality-final-qa.md).
41 versiones alineadas, ningún cambio de valores financieros/originales. Calidad,
importaciones, auditoría completa y filtro AUM comprobados con sesión admin real.
Sin sesión remota de lector, nuevas importaciones reales o reparación de publicados;
completitud económica y backup no certificados. Los registros locales anteriores
son históricos y no describen el estado de aplicación actual.

## Fase 9 — estados vacíos, 2026-11-25

### Unitarias, lint, typecheck y build

97/97 unitarias (5 nuevas), lint, typecheck completo y build correctos con Node
24.22.3 Homebrew. Cubren período/filtros/diagnóstico no disponible, un cierre sin
foto pero con AUM anterior dentro del rango, cero/negativos/null, estados ROA y
motivos Fee, incluyendo conjunto mixto y trimestre abierto. No se calculan importes
en el código de mensajes. Logs /tmp/gma-phase9-{unit,lint,types}-final.log y
/tmp/gma-phase9-build-final.log. Sin paquetes o lockfile nuevos.

### PostgreSQL local

Suite npm run test:db completa correcta en PostgreSQL 17.12, incluidas migraciones
con operador no SUPERUSER, RLS/roles, concurrencia, capacidad y restauración.
Nueva migración local 20261125234324_report_availability_diagnostics y test
availability.test.sql: recuento independiente por período, filtro sin coincidencias,
clasificación pendiente, período sin registros, búsqueda, ROA, Comisiones, NULL,
proyección publicada idéntica admin/lector y EXECUTE privado denegado.
Cambiar una clasificación antes del filtro invalida la revisión del diagnóstico;
se conserva igualdad de totales con aggregate_report anterior. Los tests de
capacidad existentes ejercitan opciones REF de 800 cuentas, ROA y Calidad;
no se declara un SLA remoto del diagnóstico nuevo.
Log /tmp/gma-phase9-db-final.log; clúster temporal eliminado.

### HTTP y navegador

Next → PostgreSQL local real con Auth/PostgREST/Storage sintéticos explícitos.
Recorrido integral correcto: agrega test-availability-http.mjs y conserva Comisiones,
ROA, importaciones/historia de 36 meses, reintentos/correcciones, REF, Master y panel
Calidad. Comprueba API/SSR, período sin registros, filtros excluyentes, relaciones
pendientes publicadas, importes nulos, cierre faltante, búsqueda sin cuentas,
página fuera del resultado y ausencia de enlaces privados al lector. Timeout 504,
fallo 503 y revisión obsoleta mantienen el error, sin mostrar payloads privados.
Log /tmp/gma-phase9-http-final.log. Tras ajustes finales de explicaciones de Fee y
comparación mensual: build/checks y recorrido focalizado Calidad/REF/errores
correctos en /tmp/gma-phase9-http-final-ui.log.

Chrome headless admin/lector: 1440/390 px, seis vistas (filtros, período, importe,
ROA, búsqueda de cuentas y Comisiones), limpieza conserva fechas. El primer
recorrido focal también seleccionó custodio y servicio desde el formulario para
producir una combinación sin coincidencias. Sin errores JS/consola ni desborde
global; capturas finales de viewport inspeccionadas en
/tmp/gma-phase9-{filters,period,amounts,roa,accounts,commissions}-{1440,390}.png.
Driver /tmp/gma-phase9-browser.mjs y log /tmp/gma-phase9-browser-final.log.
No se ejecutó axe ni auditoría manual completa de accesibilidad. Se aplicó la
revisión React: servidor para diagnósticos/rol, sin efectos o dependencias nuevas,
estilos y controles existentes, acciones accesibles con teclado.

### Incidencias y límites

El primer fixture TypeScript omitía campos de un mes: corregido antes de repetir
build. La primera aserción Comisiones esperaba cero eventos, pero su reporte
incluye Revenue sin clasificar por revisar; se corrigieron contrato/prueba/texto
conservando ese universo, sin modificar cálculos. Un fixture de cobertura también
tenía importes nulos: se separó la cuenta completa para probar cierre faltante,
manteniendo prioridad del aviso de información insuficiente cuando coexisten.

Una repetición focal no encontró el aviso ROA esperado. No se capturó su HTML en
ese intento; se añadió captura al fallar. El recorrido completo previo y la
repetición posterior pasaron, igual que Chrome. Ocho consultas adicionales API y
ocho respuestas SSR ROA fueron consistentes, sin reproducir el fallo. No hay causa confirmada: conservar
este antecedente para QA de Fase 10, sin atribuirlo a datos o servicios remotos.
Las primeras capturas fullPage móviles repetían franjas del viewport; se sustituyeron
por capturas de la vista real sobre el aviso, junto con comprobación DOM de overflow.

Sin consultas/escrituras de datos GMA, aplicación remota, push, despliegue, cambios
financieros ni reparación real. Migración nueva pendiente de revisar/aplicar antes
de desplegar esta fase. Sesión remota, volumen real y cobertura económica siguen
sin certificarse. No es el QA integral de Fase 10. Contrato en
[data-empty-states.md](data-empty-states.md).

## Aplicación remota autorizada — 2026-11-24

Aplicadas sólo en gma-software-prueba, conexión app papa:
20261124202626_reference_filters_and_complete_options y
20261124202631_data_quality_admin_panel. SQL idéntico al probado; archivos locales
renombrados desde 20261124172735 / 20261124193823 para coincidir con las versiones
asignadas por MCP. Registro remoto 32/32, sin reejecutar ni reescribir las anteriores.
MD5 del SQL REF: 5c0e58c3e05efeaa1c5e0cef3c6111bc; panel:
ee5f79867c60fa6fb4c2d9c6f7307149. Coinciden con statements del registro remoto.

Diez funciones anteriores (públicas/privadas) sin cambios de cuerpo/owner/definer;
seis wrappers nuevos invoker, implementaciones privadas bajo ejecutor sin login
ni bypass, search_path vacío. Vista security_invoker sin SELECT de clientes;
sin EXECUTE de anon/service_role. RLS habilitado/forzado en 26 tablas privadas,
CREATE retirado y cero membresías activas INHERIT/SET. Anon y authenticated sin
sesión rechazados realmente por SQL, también en la operación de equivalencias;
rollback, sin JWT ficticio ni creación de usuarios. Vista diagnóstica ejecutada
con lectura privilegiada, devolviendo sólo recuentos por fuente/grano; no equivale
a ejecutar la RPC con una sesión HTTP administrativa real.

Nueve tablas conservan exactamente recuentos y huellas de contenido antes/después:
AUM, Revenue, identificadores, resoluciones, alcances, filas/puntero REF, tasas ROA
y Master. Sin importaciones, reparaciones, publicación financiera ni cambios Auth.
Advisors no agrega hallazgos: conserva un WARN de
[contraseñas filtradas desactivadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
14 auth_rls_initplan, 16 multiple_permissive_policies, 49 FK sin índice y cinco
índices sin uso. No se declara advisors limpio ni se modifican políticas/planes
ajenos a estas migraciones. No se repiten suites locales por renombrar archivos:
el SQL y runtime son los ya verificados abajo. UI/sesión remota, cobertura económica
y pares ambiguos siguen pendientes. Sin despliegue manual.

## Fase 8 — panel administrativo, 2026-11-24

### Unitarias, lint, typecheck y build

92/92 unitarias (5 nuevas), npm run lint, npm run typecheck completo y npm run build
correctos con Node Homebrew 24.22.3. Nuevos contratos de filtros/paginación, rechazo
de parámetros ambiguos y acción con evidencia/preview/confirmación explícitas.
Logs /tmp/gma-phase8-unit-final.log y /tmp/gma-phase8-{lint,types,build}-final.log.
Sin dependencias nuevas ni cambios de lockfile.

### PostgreSQL local

npm run test:db completo correcto con PostgreSQL 17.12. Incluye todas las migraciones
desde cero con operador no SUPERUSER, RLS/roles, importaciones, publicaciones,
correcciones, concurrencia y restauración. Nuevos tests data-quality.test.sql y
data-quality-capacity.test.sql: fuentes/granos, pendientes y errores, porcentajes
numeric, filtros, originales/candidatos, padres históricos sin hijos, paginación
más allá de 50, revisión obsoleta y denegación a lector/anon/service_role/admin
deshabilitado. Ejecutor sin USAGE de auth ni privilegios de bypass nuevos.

Equivalencias exactas en preparación: 60 filas, otro literal/custodio intactos,
destino contradictorio bloqueado, revisión obsoleta, fallo intermedio con rollback
de resoluciones/auditoría e idempotencia. Hechos publicados sin cambios. Auditoría
con 10000000000000000000.123456789123456789 preservada como texto de PostgreSQL.
Capacidad: 38.400 hechos / 800 cuentas / 24 meses, cola y resumen en 426,666 ms bajo
timeout local de 8 s. Log /tmp/gma-phase8-db-final-precision.log; clúster eliminado.
No acredita rendimiento remoto ni cobertura económica.

### HTTP con PostgreSQL y transportes sintéticos

npm run test:auth:http correcto: permisos, origen, preparación por bloques,
paginación y originales privados. Log /tmp/gma-phase8-auth-http.log. Next real
y backend contractual sintético; no es Auth remoto.

node scripts/test-dashboard.mjs --serve correcto: Next → PostgreSQL temporal real,
Auth/PostgREST/Storage sintéticos explícitos. Conserva circuito histórico de 36
meses/dos custodios, corrección y reimportación, Master, Comisiones, ROA, REF y
exportación completa. Nuevo test-data-quality-http.mjs comprueba filtros/errores,
originales/candidatos, historia >50 y tres vistas SSR, 61 filas exactas por alias,
preview/confirmación, stale 409, reintentos y denegaciones. Compara checksum de
financieros antes/después; conserva dígitos exactos de auditoría en API y HTML.
Timeout 504 y fallo 503 sin payload privado ni fallback de ceros. Log
/tmp/gma-phase8-http-final-precision.log. No es una importación real validada.

### Navegador y revisión visual

Chrome headless administrador/lector sintéticos, 1440/390 px: filtros desde
formulario con calendario en español, candidatos, preview y confirmación de tres
filas, actualización a un pendiente, historial página 3 y diferencias auditadas.
Lector sin enlace y con redirección a Sin acceso; API 403. Sin errores JS/consola
ni overflow del documento. Tablas con ancho mínimo y scroll interno accesible
por teclado, evitando encabezados comprimidos detectados en la primera inspección.
Se comprobó el scroll interno y se reinspeccionaron capturas después del ajuste.

Tras ese cambio visual se repitieron build, lint, typecheck, recorrido focalizado
Calidad/REF y navegador: correctos. Log /tmp/gma-phase8-http-final-ui.log,
/tmp/gma-phase8-browser-final.log y driver temporal /tmp/gma-phase8-browser.mjs.
Capturas sintéticas /tmp/gma-phase8-{queue,history,audit}-{1440,390}.png.
No se ejecutó axe ni revisión manual completa de accesibilidad. Guías React y
verificación del flujo aplicadas, sin nuevas dependencias/efectos o publicación.
Servidores y clústeres temporales eliminados al terminar.

### Incidencias corregidas y límites

La primera ejecución detectó un paréntesis SQL y una referencia auth.uid sin USAGE
del ejecutor; se corrigieron usando el helper de sesión existente, sin ampliar
permisos. bool_and ignoraba NULL en filas aún sin resolución: coalesce(false)
evita omitirlas al aplicar el lote y se comprueba con múltiples filas. El plan de
cobertura excedía 8 s por nested loop sobre agregados subestimados bajo RLS;
EXPLAIN/auto_explain sintéticos llevaron a matriz explícita de tres meses y FULL
JOIN por claves. Se conservan RLS, timeout y población, sin atajos de volumen.

La inspección visual detectó una carga histórica antigua sin source que rompía el
render: ahora queda Fuente sin identificar y tiene diagnóstico propio. El driver
espera contenido/página además de URL y comprueba también errores de consola.
Se admite el redirect SSR transmitido de Next para lectores, verificando que no
incluya el reporte; el navegador confirma el destino Sin acceso. La revisión final
evitó JSON.parse de imágenes auditadas para conservar los numeric exactos.

Sin consultas/escrituras GMA, reparaciones reales, despliegue ni reglas financieras
nuevas. Migraciones REF de Fase 5 y panel de Fase 8 pendientes de aplicación.
Persisten pares ambiguos y definición de cobertura económica. No se certifican
sesiones Supabase efectivas ni importaciones reales. Contrato y recuperación en
[data-quality-panel.md](data-quality-panel.md); no es QA integral de Fase 10.

## Fase 7 — importaciones Excel, 2026-11-24

### Unitarias, lint, typecheck y build

87/87 unitarias (8 nuevas), npm run lint, npm run typecheck completo y npm run build
correctos con Node Homebrew 24.22.3. Se usa el PATH local documentado en Fase 5.
Pruebas nuevas de literal/ceros/invisibles/bidi/control, exponente con espacios,
tipos, consentimiento acotado, REF/headers, mes booleano/fecha, Master y versiones.
Logs /tmp/gma-phase7-{unit,lint,types,build}.log. Sin paquetes/lockfile nuevos.

### PostgreSQL local

npm run test:db completo correcto con PostgreSQL 17.12: migraciones con operador
no SUPERUSER, RLS/roles, original privado, staging, conciliación/publicación,
capacidad, fuentes/meses/custodios, conflictos, concurrencia y restauración del
esquema desde cero. Mantiene oráculo financiero de Fase 6. Sin migración nueva en
esta fase. Log /tmp/gma-phase7-db.log; clúster temporal eliminado.

### HTTP con PostgreSQL y transportes sintéticos

npm run test:auth:http correcto: lector/anónimo/admin, origen, preparación de
251 filas en dos bloques, cursor/configuración, paginación y originales privados.
Log /tmp/gma-phase7-auth-http.log. Next real y backend contractual sintético.

node scripts/test-dashboard.mjs --serve correcto antes de la revisión de navegador:
Next → PostgreSQL temporal real. Auth/PostgREST/Storage son sintéticos explícitos.
Nuevo test-import-quality-http.mjs integrado comprueba avisos persistidos, suma
exacta 0,15 con Revenue idéntico y negativo, REF numérico rechazado con coordenadas,
original idéntico descargable solo por admin, rechazo 409 de configuración antigua,
cursor/filas sin avance y recuentos publicados intactos. La suite integral conserva
historia 36 meses/dos custodios, revisión numérica con N/D, resolución/publicación
conjunta, reimportación, corrección aislada/recuperación, Master, Comisiones, ROA,
CSV completo de 253 cuentas y REF. Log /tmp/gma-phase7-http-browser-final.log.
No es una sesión Supabase remota ni certificación de importación real.

### Navegador y revisión React

Chrome headless, administrador sintético, 1440/390 px: carga Revenue desde formulario,
elección de período/custodio, validación y resumen con 2 avisos de ACCOUNT y repetido
conservado; carga AUM+REF inseguro, error fila 2/ACC # Addepar y revisión deshabilitada.
Sin errores JS ni desbordes horizontales del documento; tablas conservan su scroll.
Capturas /tmp/gma-phase7-{monthly,historical}-{1440,390}.png inspeccionadas.
Driver temporal /tmp/gma-phase7-browser.mjs; log /tmp/gma-phase7-browser.log.
No se certifica accesibilidad manual completa ni se repite rol lector en navegador
(sí se comprueba denegación de staging/originales por HTTP y SQL).

Guías React y verificación de flujo aplicadas: solo resúmenes/avisos en componentes
existentes, details/summary/listas semánticas, claves estables por grupo, importaciones
de tipos borradas del cliente y sin nuevos efectos, cachés o dependencias. Se conserva
el sistema visual y la separación entre código servidor y componentes cliente.

### Incidencias corregidas y límites

La primera pasada TypeScript detectó inferencia demasiado estrecha de errores
de encabezado (row obligatorio frente a Issue general); se anotó el retorno común.
Una aserción nueva esperaba ACCOUNT aunque un rechazo previo usaba mensaje genérico;
se centralizó también ese control Master. El primer HTTP integral falló al comparar
Buffer con Uint8Array pese a bytes idénticos: se igualaron los tipos y se repitió
correctamente todo el recorrido. No fueron fallos de datos remotos.

Sin consultas/escrituras GMA, reimportación real, despliegue, migración nueva o
modificación de reglas financieras. No se verificaron muestras privadas ni se
resolvieron pares ambiguos, servicios, tasas o cobertura esperada. La migración REF
de Fase 5 sigue local. No es QA integral de Fase 10. Contrato y recuperación en
[data-import-quality.md](data-import-quality.md).

## Fase 6 — ROA y métricas financieras, 2026-11-24

### Fórmula y oráculo PostgreSQL local

`npm run test:db` completo pasa con PostgreSQL 17.12 local. Nuevo
`tests/database/financial-metrics.test.sql`: sumas mensuales independientes,
ejemplo 10/11/12 millones y 13.750 → 0,50%, Revenue idéntico legítimo conservado,
agregado con pesos desiguales, Fee anual ponderado, diferencia en pp, población
mixta y lector sintético. La suite existente comprueba faltantes, cero/negativos,
vigencias/filtros, tasas obsoletas, límites 0,40/0,60, permisos y capacidad. Incluye
migraciones con operador no SUPERUSER, concurrencia y restauración desde cero.
Log `/tmp/gma-phase6-db-final.log`; salida final correcta y clúster eliminado.

El primer ensayo del fixture omitía el UUID obligatorio de roa_rate_versions;
falló antes de evaluar la fórmula. Se corrigió con gen_random_uuid(), se repitió
el oráculo aislado y luego toda la suite con archivos estables; ambos pasaron.
No fue un error del runtime ni una escritura remota.

### Unitarias, lint, typecheck y build

`npm test` 79/79, `npm run lint`, `npm run typecheck` completo y `npm run build`
correctos con Node 24.22.3 local y el mismo PATH Homebrew de Fase 5. Logs
`/tmp/gma-phase6-{unit,lint,types,build}.log`. Las 79 unitarias no aumentaron:
la prueba nueva es SQL. No se añadieron dependencias ni cambios de aplicación.

### Diagnóstico real de solo lectura

`scripts/audit-quarterly-metrics.sql` ejecutado en GMA: 64 cohortes del horizonte
2023–2026, todos los controles de conservación mensual AUM/Revenue verdaderos.
30 estados incomplete, 34 no_data y 0 calculable. Comparación individual Advisory
T1/T2 2026: 47/46 cuentas matemáticamente elegibles. Ningún grupo completo permite
ponderación real: límites de tasa null, no aprobado. Consulta exporta solo conteos,
estados y booleanos, sin montos, originales ni identidades de clientes/cuentas.
La RPC remota anterior coincide en cuerpo con el motor aplicado del 20/11; `_ref`
no está aplicada. No se prueba esa variante remotamente ni un usuario lector real.
Resultados, metodología y límites en
[data-financial-metrics-validation.md](data-financial-metrics-validation.md).

### Alcance y checks no ejecutados

Sin escrituras remotas, migraciones nuevas, despliegues o cambios financieros.
No se repitieron HTTP/navegador: no cambió el runtime/UI; se conserva la evidencia
local de Fase 5. No se verificaron fuentes privadas ni comparabilidad económica,
ceros esperados, backup remoto restaurable o reparaciones reales. Continúan los
dos pares ambiguos y el resto de pendientes. No es QA integral de Fase 10.

## Fase 5 — filtros y dashboards locales, 2026-11-24

### Unitarias, lint, typecheck y build

79/79 unitarias, lint sin advertencias, typecheck completo (`next typegen && tsc`)
y build correctos con Node Homebrew 24.22.3. Comandos `npm test`, `npm run lint`,
`npm run typecheck`, `npm run build`, usando PATH local node@24. Tres tests nuevos
cubren contrato REF, IDs/snapshot, rechazo de filtros ambiguos y navegación/CSV/
comparación trimestral. El adaptador ROA existente se actualiza a *_ref.
Logs `/tmp/gma-phase5-{unit,lint,types,build}.log`.
Para reproducir en este entorno: anteponer
`PATH=/opt/homebrew/opt/node@24/bin:/opt/homebrew/opt/postgresql@17/bin:$PATH`
a los comandos npm; el Node integrado de la app sigue siendo una instalación distinta.

### PostgreSQL local

`npm run test:db` correcto con PostgreSQL Homebrew 17.12. Migraciones con operador
CREATEROLE/BYPASSRLS sin SUPERUSER, permisos temporales retirados, SQL completo,
18.080 filas/226 alcances, concurrencia y restauración desde cero. Tests REF nuevos:
AND, varios custodios, solo-Revenue, Sin referencia, negativos/cero/null, AUM de
detalle, ROA con igual población, referencia inválida/obsoleta, lector/admin/anon.
Capacidad: 800 opciones aunque la página financiera tenga una fila. Finanzas sin
REF iguales al contrato anterior. Log `/tmp/gma-phase5-db-final.log`.

### HTTP y navegador

`npm run test:auth:http` correcto. `npm run test:dashboard` correcto: Next y
PostgreSQL reales locales; Auth/PostgREST/Storage son transportes sintéticos.
Conserva carga/reintento/publicación histórica, varios custodios, Master, Comisiones,
ROA, archivos por rol, errores y CSV completo de 253 cuentas. REF nuevo: 120 AUM/
22 Revenue sintéticos en Resumen, Análisis, directorio/detalle, ROA incompleto y CSV;
selección inválida 400 y snapshot obsoleto 409. Ninguna cifra corresponde a negocio real.
Logs `/tmp/gma-phase5-auth-http.log`, `/tmp/gma-phase5-http-browser-final.log`.

Chrome headless lector: 1440/390 px, seleccionar REF y enviar formulario con snapshot,
conservar período, elegir cuenta 00M250 mediante búsqueda fuera del antiguo límite100
y obtener su Revenue 0,01. Cero errores JS y sin desbordes horizontales en los casos
comprobados. Capturas sintéticas inspeccionadas `/tmp/gma-phase5-ref-{1440,390}.png`.
Recorrido focalizado adicional con `node scripts/test-dashboard.mjs --reference-only`
para contrato REF/errores y UI; no reemplaza el integral anterior ni se presenta como
revisión manual completa de accesibilidad. Log `/tmp/gma-phase5-ref-debug.log`.

### Incidencias de verificación y límites

El entorno anterior no tenía npm/PostgreSQL utilizables y el Node firmado de la app
no cargaba SWC. Se instalaron Node 24 y PostgreSQL 17 locales mediante Homebrew;
no se inició servicio persistente ni se cambió lockfile. Los arneses crean/eliminan
sus clústeres por socket privado, sin destinos remotos.

Un test SQL de capacidad se editó mientras psql ya lo leía y produjo una lectura
parcial; la suite final se repitió con archivos estables y pasó. El fixture HTTP
nuevo inicialmente intentaba insertar otra cabecera REF que el circuito histórico
ya había creado: se corrigió a actualización explícita de la cabecera solo en la
base sintética. Una aserción de navegador leía antes de terminar la navegación;
se agregó espera de carga y se repitió correctamente. Un error TypeScript en la
rama de reinicio se corrigió antes del cierre. No fueron fallos remotos.

Revisión React: reutilización de Select, labels/fieldset, estado de selección
controlado y keys por selección, sin efectos para estado derivado, sin nuevas
bibliotecas ni caché compartida. No hubo SQL remoto, migraciones aplicadas, datos
reales exportados, despliegue ni reparación de identidades. El runtime nuevo
requiere aplicar primero la migración revisada; no hay fallback a mocks ni RPC vieja.

## Fase 4 — preparación y ensayo, 2026-11-24

76/76 unitarias, lint y tsc aislado correctos; comandos iguales a Fase 3. Logs:
`/tmp/gma-quality-phase4-{unit,lint,tsc}.log`. Nueve tests nuevos cubren proyección
por IDs, decimales/null/negativos, Revenue repetido, AUM cuenta/mes, meses separados,
snapshot parcial/controles falsos/procedencia, revisión obsoleta/custodio incorrecto,
idempotencia, aislamiento de otros custodios, reconstrucción local y CLI privado.

Primer intento: 74/75 tests y un error TypeScript por push a array readonly. El
fixture compartía una referencia entre catálogo y fila, por lo que cambiar la fila
cambiaba también la referencia acreditada. Se corrigió el fixture con copia
independiente y se reemplazó push por asignación; luego 75/75. Añadido el caso de
nulos/meses separados, suite final 76/76 y tsc/lint correctos. Ningún fallo remoto.

CLI ejecutado con fixture sintético: reviewable, 1 cambio, 0 bloqueos; 4 filas,
3 importes y total 0,15 antes/después. Generó manifest/backup/rollback privados en
la ruta indicada en data-repair.md. Pruebas de modo 0700/0600, rechazo de salida en
repo, apply y sobrescritura. Los tests eliminan solo sus directorios sintéticos.
No se ensayó escritura ni rollback PostgreSQL; reconstruir una imagen JSON no los
sustituye. No se implementó adaptador de publicación/remapeo de aliases.

GMA por MCP app papa, lectura agregada nueva: 18.800 AUM / 17.893 Revenue; cero
diferencias con métricas revisadas en 433 AUM + 225 Revenue; cero duplicados AUM.
Los 2 pares candidatos/4 UUID conservan 55 AUM/64 Revenue. No se extrajeron IDs,
originales ni montos reales ni se generó un manifiesto individual real autorizado.
No hubo migraciones ni escrituras; no se solicitó aprobación de una fusión ambigua.

Build/typegen siguen sin validar por SWC; no se repitieron en esta fase. SQL local,
HTTP, permisos y navegador no ejecutados: sin cambios de esas capas y PostgreSQL
local no disponible. El cierre verifica diff y enlaces documentales. El procedimiento
para completar la reparación real está en [data-repair.md](data-repair.md).

## Fase 3 — motor local, 2026-11-24

67/67 unitarias correctas (7 nuevas del motor), lint y tsc aislado: exit 0. Comandos:

```sh
node --conditions=react-server --experimental-strip-types --test tests/*.test.ts
node node_modules/eslint/bin/eslint.js . --max-warnings=0
node node_modules/typescript/bin/tsc --noEmit
```

Logs: `/tmp/gma-quality-phase3-{unit,lint,tsc}.log`. Tests con IDs, nombres y archivos
sintéticos. Casos: UUID/custodio/namespace/fuente/ceros; alias aprobado con evidencia
y autor; pendientes/revocados; sugerencias de espacios/nombres sin autoasignación;
custodio faltante; consenso entre fuentes; referencia adicional desconocida;
conflictos exacto/alias/relación previa/custodios; catálogo huérfano; procedencia e
IDs inválidos; repetición de filas; idempotencia y estabilidad con catálogo reordenado.

Se compara profundamente la entrada antes/después y se modifica una copia de salida
para comprobar aislamiento. Descartar propuestas no exige revertir FK porque no hay
escrituras. No es una prueba de rollback PostgreSQL ni de conservación monetaria
tras una reparación; el motor no recibe ni calcula montos. La suite completa conserva
las regresiones existentes de cálculo/importación con precisión decimal.

Sin lecturas/escrituras remotas, migraciones, HTTP o navegador en esta etapa. Motor
sin API/UI ni persistencia nueva. Build/typegen no se repitieron ante la limitación
SWC de Fase 1; no se declara build ni typecheck completo aprobados. Diff y enlaces
locales revisados al cierre. Contrato y límites en [motor](data-reconciliation-engine.md).

## Fase 2 — validación local, 2026-11-24

Cambios en normalization.ts y sus consumidores de importación; sin SQL/UI nuevos.
60/60 tests con `node --conditions=react-server --experimental-strip-types --test tests/*.test.ts`;
lint con `node node_modules/eslint/bin/eslint.js . --max-warnings=0` y TypeScript
con `node node_modules/typescript/bin/tsc --noEmit`: correctos, exit 0.
Logs locales: `/tmp/gma-quality-phase2-{unit,lint,tsc}.log`.

Seis pruebas nuevas cubren reglas de búsqueda, preservación literal/idempotencia,
espacios/invisibles/ciencia, ISO/bisiestos, límites de períodos y configuración,
coordenadas/huellas/sumas exactas y Revenue repetido. La comparación mensual e
histórica conserva el libro original sin mutarlo. Un error TypeScript en la
construcción del fixture sintético se corrigió declarando Record<string,string>;
tsc y unitarias se repitieron correctamente después de la corrección.

Verificación adicional ejecutada mediante script temporal eliminado al terminar:
se cargaron las versiones HEAD previas de validate.ts/historical.ts desde Git,
se compararon profundamente reportes AUM/Revenue/FA CSV/XLSX y manifiestos AUM
históricos contra los nuevos (8 comparaciones completas, todas idénticas). Solo
fixtures sintéticos existentes. Sin cambiar parserVersion, fingerprints, originales,
resúmenes o advertencias para estas entradas. El período 1900–2200, ya obligatorio
en API e histórico, se exige ahora también en el helper de filas invocado directamente.

No se repitieron build/typegen: persiste la limitación de firma SWC documentada abajo.
No se declara typecheck completo ni build válidos. No se ejecutaron SQL/HTTP/navegador
ni se consultaron fuentes reales en esta fase. El diseño REF no es una función de
producción verificada. Cambios sin dependencias ni migraciones; diff y enlaces
locales revisados al cierre. Evidencia de Fase 1 a continuación.

2026-11-24, Buenos Aires. Fase 1 sobre commit `40e95f7`. Los únicos cambios de esta
etapa son documentación y SQL diagnóstico de solo lectura. No es el cierre de QA
de las diez fases. Resultados anteriores siguen en [validation.md](validation.md).

## Consultas reales de solo lectura

Conexión Supabase app papa, GMA `zwdqnrbqqszjrtkhyqnz`, identificada mediante
list_projects. Se ejecutaron y revisaron los seis bloques de
[audit-data-quality.sql](../scripts/audit-data-quality.sql):

| Bloque | Resultado observado |
| --- | --- |
| sources | 18.800 AUM / 17.893 Revenue; 0 huérfanos, 0 discrepancias de custodio; 12 importes Revenue ausentes |
| identity | 839 cuentas; 2 grupos candidatos/4 UUID; 0 claves AUM duplicadas; 2.398 cuenta-meses Revenue con multiplicidad legítima |
| classification | 773/807 REF vinculadas; 392/412 Master con cuenta; 2.624 tasas/164 cuentas; 0 eventos Comisiones |
| publication | 433 AUM y 225 Revenue activos; 0 diferencias de monto/recuento/cobertura vs revisión |
| monthly_invariance | 44 meses, comparación decimal directa vs agregación por cuenta/mes + relaciones: true |
| preparation | 36.693 filas valid/resueltas; 0 período metadata distinto del lote; advertencias conservadas |

Complementos ejecutados: catálogo real de tablas/columnas/constraints/índices/vistas/
funciones/RLS/ACL; 30 versiones de migración coincidentes con archivos locales;
comparación de cuerpos de las seis funciones centrales contra definiciones locales
directas; 36.693 MES/AÑO originales contra período de lote, sin discrepancias ni
mapping ausente; cobertura T1–T4 2026, población por fuente, colisiones de etiquetas,
procedencia de tasas, selectores y logs/advisors. Resultados agregados en
[data-quality-audit.md](data-quality-audit.md).

Una consulta complementaria inicial falló por referir una subconsulta como si fuera
un CTE (`42P01`); se corrigió y ejecutó correctamente con `WITH collisions`.
Otra llamada con varios SELECT devolvió solo el último resultset: los controles
anteriores no se dieron por ejecutados con resultado verificado hasta repetirlos
en SELECT únicos/JSON y en los bloques reproducibles. Ninguno escribió datos.

La inspección de privilegios confirma configuraciones, no acceso real de un lector.
No se inventaron claims, exportaron cookies ni abrieron sesiones financieras
simuladas en la base real. Las consultas privilegiadas no prueban RLS end-to-end.

## Tests unitarios locales

**54/54 correctos**, Node v24.22.3 disponible en el runtime de la app:

```sh
node --conditions=react-server --experimental-strip-types --test tests/*.test.ts
```

Log local: `/tmp/gma-data-quality-unit.log`. Incluye los tests existentes de
imports/históricos/Master, contratos/filtros, precisión decimal, ROA y presentación.
No son una prueba de los 36.693 hechos reales ni sustituyen las suites SQL/HTTP.
No se agregaron tests que repliquen las consultas; los seis diagnósticos fueron
ejecutados realmente y devolvieron sus controles agregados.

## Lint

Correcto, exit 0:

```sh
node node_modules/eslint/bin/eslint.js . --max-warnings=0
```

Log local: `/tmp/gma-data-quality-lint.log`.

## Typecheck

`node node_modules/typescript/bin/tsc --noEmit`: correcto, exit 0, usando tipos de
rutas ya disponibles. Log: `/tmp/gma-data-quality-tsc.log`.

El paso previo `next typegen` **falló** al cargar SWC nativo: la firma de
`next-swc.darwin-arm64.node` tiene Team ID distinto al proceso Node firmado que
provee la app; tampoco hay fallback WASM instalado. Por eso **el comando completo
typecheck del package no está validado**, aunque tsc aislado pasó.
Log: `/tmp/gma-data-quality-types.log`. No se cambiaron firmas, binarios ni lockfile.

## Build

Prebuild (`node scripts/check-deployment.ts`) pasó. `next build` **falló** con el
mismo problema de carga/firma SWC, antes de compilar `next.config.ts`.
No es evidencia de un error financiero ni un build válido.
Logs: `/tmp/gma-data-quality-prebuild.log`, `/tmp/gma-data-quality-build.log`.
Debe repetirse con Node 24/dependencias instaladas en un entorno compatible.

## Suite SQL local

No ejecutada: `npm` y `pg_config`/PostgreSQL no están disponibles en PATH; no se
encontró instalación PostgreSQL en Homebrew opt. Los intentos iniciales de usar
`npm test` / `npm run test:db` terminaron en command not found; las unitarias luego
se ejecutaron directamente con Node. No se instaló tooling para esta auditoría.
No se declara que `test:db`, concurrencia o rollback hayan pasado hoy.

## HTTP, navegador y pruebas de permisos

No ejecutados en esta fase. No se alteró el acceso del usuario ni se usaron mocks
como respaldo de una consulta real. La auditoría de pantallas fue de código,
consultas y estado remoto agregado. Falta recorrido remoto autenticado de Resumen,
Análisis, Cuentas/detalle, ROA, Comisiones y administración; también roles admin/
lector, filtros combinados, exportación y causas de vacíos. El fallo local SWC
impide presentar un recorrido local recién construido como verificado.

## Reproducción de diagnósticos y seguridad de resultados

Solo con una conexión que el operador haya verificado como GMA, usar MCP por
bloque o una sesión PostgreSQL de lectura. Ejemplo con conexión previamente
configurada por el operador, sin pegar credenciales:

```sh
PGOPTIONS='-c default_transaction_read_only=on' psql -X -v ON_ERROR_STOP=1 \
  --single-transaction -f scripts/audit-data-quality.sql
```

El script contiene únicamente SELECT/CTE sobre tablas/vistas conocidas y funciones
SQL estándar, no RPC de gestión ni DDL. La herramienta MCP devuelve un resultado
por bloque; no concatenar SELECT suponiendo que expondrá todos los resultsets.
No tiene modo apply y no necesita rollback de datos. Las cifras cambiarán con
nuevas publicaciones; verificar revisiones y usar una sola transacción al repetir
para una comparación consistente. No versionar resultados con datos individuales.

## Antes/después, dry-run y pendientes

No hubo reparación: no existe un «después» distinto ni dry-run de modificación.
Sí hay conservación decimal de la lectura agregada y coincidencia de publicados
con sus métricas revisadas, sin imprimir sumas reales. No se creó backup, migración
ni rollback operativo nuevo. El contrato de esos pasos futuros está en el plan.

Documentación oficial consultada: [changelog](https://supabase.com/changelog.md),
[CLI v3](https://supabase.com/changelog/supabase-cli-v3) y
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
CLI v3 cambia destinos/confirmaciones; no se ejecutaron comandos remotos CLI.
El aviso security de contraseñas filtradas sigue pendiente, sin cambiar Auth.

## Revisión de artefactos

`git diff --check` correcto; enlaces locales de los tres entregables y documentos
de continuidad comprobados sin destinos inexistentes. El SQL contiene seis bloques
SELECT/CTE independientes, sin sentencias de modificación; cada bloque fue ejecutado
y revisado en GMA. Documentación revisada para separar Fase 1 de etapas futuras,
recuentos de cuentas/filas/aliases y controles remotos de pruebas locales.
No se agregaron fuentes reales ni secretos. Product.md actualiza únicamente su
estado obsoleto «sin datos de negocio» frente a los históricos ya publicados.
