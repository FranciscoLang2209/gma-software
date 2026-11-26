# App Papá — Progreso

## Fase 10 — QA final y migraciones autorizadas, 2026-11-25

Completado QA de Fases 9–10: 98 unitarias, lint, typecheck, build, Auth HTTP,
suite SQL con concurrencia/restauración y recorrido HTTP + Chrome de 14 vistas
1440/390 correctos. Corregidos timeouts reales de Calidad/historial/auditoría y
la diferencia AM/PM servidor–Chrome que causaba hidratación. Evidencia, matriz
de casos, cambios y límites en [QA final](data-quality-final-qa.md).

Nueve migraciones nuevas aplicadas sólo en GMA; historial 41/41 y SQL idéntico
local/remoto. Contexto de auditoría generado sin cambiar sus originales; ejecutor
interno de sólo lectura administrativa, con RLS y sin login/bypass/membresías.
Once proyecciones originales y las 59.359 filas del diagnóstico conservan huellas.
Los 658 alcances y totales exactos de 44 meses siguen conciliados. Se verificaron
Calidad y sus dos historiales con sesión admin real, incluido filtro AUM.

Entrega a main y despliegue autorizados por el dueño en esta solicitud. Los avisos
históricos de Fase 9 local/pending siguientes quedan superados por este cierre.
Persisten dos pares ambiguos, clasificación/cobertura económica, revisión de
fuentes y backup real no certificado; no se repararon publicados ni se inventaron
identidades o ceros. Lector remoto no suplantado; permisos comprobados localmente
y ACL/RLS remotas verificadas. Advisors conserva avisos previos, sin nuevos.

Próximo prompt, sólo si se decide avanzar: «Revisemos las evidencias privadas de
los dos pares ambiguos y las clasificaciones pendientes; prepará un dry-run
individual con conservación de importes, sin aplicar reparaciones hasta revisar
el manifiesto». No queda otra fase técnica automática de este plan.

## Calidad de datos: Fase 9 local — 2026-11-25

Estados diferenciados en Resumen, Análisis, Cuentas/detalle, ROA, Comisiones y
Calidad: período sin registros publicados, filtros sin coincidencias, relaciones
pendientes, cobertura incompleta, importes/bases insuficientes y error de consulta.
Separadas búsqueda sin cuentas y página fuera del resultado. Acciones limpian
filtros conservando fechas; enlaces de revisión sólo para administrador.
Gráficos y métricas explican N/D sin pedir reimportar por filtros ni imputar cero.
Fee distingue conjunto mixto, falta de tasas/fotos, referencia obsoleta y trimestre
abierto; comparación mensual explica base no comparable o base anterior cero.
Contrato en [data-empty-states.md](data-empty-states.md).

Migración local 20261125234324_report_availability_diagnostics.sql, creada por CLI
3.1.0 y pendiente de aplicación. Helper privado invoker con recuentos de publicados
del período antes de filtros; dentro del snapshot/revisión de las RPC REF existentes.
Directorio/detalle heredan el diagnóstico. Comisiones conserva expectativas y
Revenue por revisar usando su propio reporte; no inventa comisiones con tasas Master.
Sin tablas/roles nuevos, cambio de fórmulas, dependencias o lockfile.

97 unitarias, lint, typecheck completo, build y suite SQL completa correctos con
Node 24.22.3/PostgreSQL 17.12 locales. Verificados recuentos independientes, NULL,
finanzas conservadas, revisión obsoleta al cambiar el diagnóstico, proyección
admin/lector idéntica y permisos privados. HTTP integral Next → PostgreSQL pasa,
incluidos circuitos anteriores y nuevos vacíos, filtros, errores y roles. Evidencia
y revisión final de navegador en [data-quality-validation.md](data-quality-validation.md).

Sin consultas/escrituras de datos GMA, migración remota, publicación, push ni
despliegue en esta fase. Las 32 migraciones anteriores siguen aplicadas; la nueva
debe revisarse/aplicarse antes de desplegar Fase 9. Persisten pares ambiguos,
cobertura económica y QA de sesión real. No se inicia Fase 10 automáticamente.

Próximo prompt: «Continuá con Fase 10: realizá QA integral de normalización,
reconciliación, filtros, métricas, importaciones, estados vacíos y permisos.
Diferenciá pruebas sintéticas de evidencia real y verificá conservación de datos,
reintentos y rollback; sin reparar publicados ni modificar producción o desplegar».

## Migraciones de calidad aplicadas y entrega a main autorizada — 2026-11-24

Pedido del dueño: aplicar las migraciones y pushear el trabajo a main. Destino
confirmado: conexión app papa, gma-software-prueba (zwdqnrbqqszjrtkhyqnz),
sa-east-1, PostgreSQL 17.11.0.019, ACTIVE_HEALTHY. Aplicadas en orden por MCP:
20261124202626_reference_filters_and_complete_options y
20261124202631_data_quality_admin_panel. Las 30 anteriores no se reejecutaron.

MCP asignó las versiones de ejecución. Se renombraron únicamente los dos archivos
locales originales 20261124172735 y 20261124193823 para coincidir con el registro
remoto, sin cambiar su SQL ni modificar el historial remoto. Huellas del SQL
idénticas a las probadas/aplicadas; historial local/remoto: 32 migraciones.

Verificación remota: seis wrappers públicos invoker; implementaciones privadas
bajo ejecutor NOLOGIN/NOBYPASSRLS y search_path vacío. Vista de calidad invoker,
sin SELECT de authenticated/anon/service_role. Sin EXECUTE de anon/service_role;
26 tablas privadas con RLS habilitado/forzado. CREATE transitorio retirado y cero
membresías con INHERIT/SET. Rechazo SQL de anónimo y authenticated sin sesión,
incluida operación de equivalencias; transacción revertida, sin JWT inventado.

Recuentos y huellas de nueve tablas iguales antes/después: 18.800 AUM,
17.893 Revenue, 658 alcances, 2.329 identificadores, 36.693 resoluciones,
807 referencias REF y su puntero, 2.624 tasas y un snapshot Master.
No se importaron archivos, publicaron hechos ni repararon los pares ambiguos.
Advisors sin hallazgos nuevos: conserva WARN previo de contraseñas filtradas,
14 auth_rls_initplan y 16 multiple_permissive_policies; INFO de 49 FK sin índice
y cinco índices sin uso. No se cambiaron Auth, planes ni índices fuera del alcance.

Entrega reúne Fases 1–8 ya verificadas localmente. La alineación de nombres no
cambia el contenido SQL ni el runtime probado. Evidencia local/sintética y límites
en [data-quality-validation.md](data-quality-validation.md); el control remoto de
esquema no acredita sesión HTTP/UI real ni conciliación económica. Sin despliegue
manual. Fase 9 no iniciada; próximo prompt sigue siendo estados vacíos diferenciados.

## Calidad de datos: Fase 8 local — 2026-11-24

Panel /calidad-datos exclusivo del administrador, integrado a la navegación y a
los permisos existentes. Recuentos/porcentaje de relación técnica separados por
fuente y grano; cola por fuente, custodio, meses y problema. Cobertura observada,
originales privados, candidatos acreditados e historiales paginados de importación
y cambios. Enlaces retoman Correspondencias en la página correcta y Master por UUID.
Anterior/posterior auditados como texto SQL conservan los decimales exactos.
Contrato y límites en [data-quality-panel.md](data-quality-panel.md).

Operación explícita por lote para Revenue en preparación sin errores: mismo
ACCOUNT literal/custodio, alias ya acreditado, evidencia, vista previa y confirmación
con revisión. Reutiliza manage_import, locks, transacción y auditoría; reintento
idéntico idempotente. No publica ni modifica hechos financieros o equivalencias
acreditadas a otro destino. Preparaciones Master solo en Storage no se incluyen
en el inventario SQL. Fuente antigua ausente se muestra sin identificar.

Migración local 20261124202631_data_quality_admin_panel.sql, creada por CLI 3.1.0;
vista privada invoker y RPC con guards/RLS, sin ampliar acceso del lector, anon o
service_role. Permanece pendiente junto con REF de Fase 5. Sin lecturas/escrituras
GMA, despliegue, dependencias nuevas o cambios de fórmulas financieras.

92 unitarias, lint, typecheck completo, build y suite SQL completa correctos con
Node 24.22.3/PostgreSQL 17.12 locales. Nuevas pruebas de contratos, roles, granos,
faltantes, historia >50, stale revision, rollback, reintentos, precisión y conservación
de publicados. Capacidad sintética de 38.400 hechos / 800 cuentas / 24 meses:
426,666 ms bajo límite local de 8 s tras corregir el plan de cobertura bajo RLS;
no es SLA remoto. Ver evidencia final HTTP/navegador y límites en
[data-quality-validation.md](data-quality-validation.md).
HTTP integral Next → PostgreSQL correcto, con transportes Auth/PostgREST/Storage
sintéticos. Chrome admin/lector 1440/390 confirma filtros, preview/aplicación,
paginación, auditoría y denegaciones; capturas revisadas, tablas móviles corregidas
con scroll interno y sin errores JS. No acredita accesibilidad manual completa.

Persisten los dos pares reales ambiguos, clasificación/cobertura económica y el
adaptador versionado para reparaciones publicadas. No se validó una importación
real ni una sesión Supabase remota. Se detiene al completar Fase 8.

Próximo prompt: «Continuá con Fase 9: diferenciá los estados vacíos según período
sin registros, filtros sin coincidencias, relaciones pendientes, cobertura incompleta,
cálculo insuficiente y error de consulta, reutilizando diagnósticos existentes sin
ocultar fallos ni imputar cero; sin modificar producción ni desplegar».

## Calidad de datos: Fase 7 local — 2026-11-24

Reutilizados staging, vista previa, correspondencias y publicación versionada
existentes. Controles compartidos mensual/histórico/REF/Master: encabezados literales,
cuentas seguras y avisos de espacios/invisibles sin cambiar el original. Ciencia
textual con espacios, booleanos/fechas usados como períodos o importes/tasas Master
ya no se aceptan por su valor escalar. REF devuelve fila/columna, conserva errores
y bloquea el conjunto. Consentimiento numérico acotado menciona archivo y REF.

Resumen agrupado mensual e histórico aun sin excepciones; avisos Master visibles.
validationVersion=1 en configuración/manifiesto evita mezclar reglas al retomar:
conservar preparaciones antiguas y crear otras con sus originales. Publicados y
preparaciones terminadas no se revalidan ni modifican. Sin nueva migración, cambios
de dependencias o fórmulas financieras. Contrato en
[data-import-quality.md](data-import-quality.md).

87 unitarias (8 nuevas), lint, typecheck completo, build y suite SQL completa
correctos con Node 24.22.3/PostgreSQL 17.12 locales. HTTP Auth pasa; recorrido Next
→ PostgreSQL local conserva importación/publicación/corrección/reintentos y agrega
calidad REF, originales por rol, versión anterior rechazada y publicados intactos.
Auth/PostgREST/Storage sintéticos explícitos, sin fallback de la aplicación.
Chrome administrador 1440/390: carga/validación mensual, Revenue repetido, avisos
agrupados, bloqueo REF con coordenadas, revisión deshabilitada, sin errores JS ni
desbordes del documento; capturas sintéticas revisadas. No es QA remoto ni revisión
manual completa de accesibilidad. Evidencia en data-quality-validation.md.

Sin lecturas/escrituras remotas nuevas, reimportación real ni despliegue. Los dos
pares ambiguos, clasificación/cobertura económica y migración REF de Fase 5 siguen
pendientes; no se infieren tipos/unidades para campos Revenue no acordados.
Se detiene al cerrar Fase 7.

Próximo prompt: «Continuá con Fase 8: implementá el panel administrativo Calidad
de datos con diagnósticos por fuente/período/custodio, pendientes e historial.
Reutilizá permisos y circuitos de revisión existentes; conservá originales privados
y las reparaciones ambiguas para revisión, sin modificar producción ni desplegar».

## Calidad de datos: Fase 6 verificada — 2026-11-24

Validado el ROA existente con oráculo SQL independiente de totales mensuales:
ejemplo 10/11/12 millones + Revenue 13.750 → promedio 11 millones y ROA 0,50%;
varias cuentas con pesos distintos, Revenue repetido, Fee ponderado, diferencia
en pp y población mixta. No cambian fórmulas, tasas, reglas, runtime ni migraciones.
Metodología y resultados en [data-financial-metrics-validation.md](data-financial-metrics-validation.md).

Diagnóstico remoto solo lectura, conteos/estados/booleanos sin identidades ni
montos: 64 cohortes 2023–2026 conservan AUM y Revenue contra sumas independientes;
30 incompletas y 34 sin hechos, ninguna calculable como grupo completo. Advisory
T1/T2 2026 tiene 47/46 cuentas matemáticamente comparables con Fee, sin certificar
Payout broker ni cobertura económica. Ponderación de grupos reales no evaluable;
sí verificada sintéticamente. No se excluyen faltantes para forzar un agregado.

79 unitarias, lint, typecheck completo, build y suite SQL completa correctos con
Node 24.22.3/PostgreSQL 17.12 locales. Incluye migraciones no SUPERUSER, roles,
concurrencia, capacidad y restauración; nuevo test SQL financiero integrado.
No se repitió HTTP/navegador al no cambiar aplicación. Sin escrituras Supabase,
publicación ni despliegue; migración REF de Fase 5 aún pendiente de aplicación.
No acredita importaciones reales, reparaciones ambiguas o sesión remota por rol.

Próximo prompt: «Continuá con Fase 7: mejorá las importaciones Excel para prevenir
inconsistencias, reutilizando normalización, staging, vista previa y publicación
atómica existentes. Conservá originales, ceros y duplicados Revenue legítimos;
probá errores/advertencias y reintentos sin modificar producción ni desplegar».

## Calidad de datos: Fase 5 local — 2026-11-24

Implementados filtros REF independientes en Resumen, Análisis, Cuentas/detalle,
ROA y CSV; combinan AND con UUID canónicos, período y servicio. Snapshot/fila
representativa, Sin referencia y conflictos de revisión explícitos. Selección por
UUID antes de agregar cada fuente; no se inventan clientes/personas/vigencias.
El detalle AUM ahora respeta los filtros que ya aplicaba su lista Revenue.

Selectores financieros completos con búsqueda: prueba SQL de 800 opciones con
página de una fila y prueba Chrome de selección 00M250 en el dataset de 253 cuentas.
La selección se conserva al buscar o fallar opciones. Se mantiene el sistema visual;
capturas sintéticas 1440/390 px revisadas. Los límites administrativos de
Correspondencias quedan para la sección de calidad/revisión, no se declararon resueltos.

Migración local 20261124202626_reference_filters_and_complete_options.sql, creada
por CLI 3.1.0. Nuevas RPC *_ref con wrappers invoker, ejecutor privado/RLS, guards y
huella REF; conserva las firmas anteriores. No se aplicó a Supabase ni se desplegó.
No cambió identidad, importes, tasas, periodización ni fórmulas ROA/comisiones.
Aplicar la migración revisada antes de desplegar el runtime nuevo; sin ella falla
la consulta, sin fallback. Contrato y límites en [data-quality-filters.md](data-quality-filters.md).

Entorno local reparado para verificar: Homebrew Node 24.22.3 y PostgreSQL 17.12,
sin servicio persistente ni cambios al lockfile. El Node local carga SWC: typecheck
completo y build pasan. 79 unitarias, lint y suite SQL completa correctos, incluidas
migraciones con operador no SUPERUSER, roles, concurrencia y restauración.
HTTP Next→SQL real local pasa, Auth/PostgREST/Storage sintéticos; conserva circuitos
históricos, Master, Comisiones, ROA, originales por rol y exportación completa.
Chrome lector 1440/390: REF, formulario, snapshot/UUID, búsqueda fuera de primeras100,
sin errores JS/desbordes. No certifica sesión remota ni accesibilidad manual completa.
Regresión REF de errores/selección comprobada también mediante recorrido focalizado.
Detalle y límites en data-quality-validation.md; clústeres/servidores de test eliminados.

Próximo prompt: «Continuá con Fase 6: validá ROA y métricas financieras a partir de
la cobertura real, sin cambiar las reglas acordadas ni modificar producción;
separá conciliación sintética de validación económica con fuentes reales».

## Calidad de datos: Fase 4, preparación local — 2026-11-24

Pedido explícito: seguir Fase 4. Implementados planRepair, huellas/verificación de
snapshot y CLI --dry-run; contrato y procedimiento en [data-repair.md](data-repair.md).
Conserva relación anterior/propuesta por hecho, evidencia, originales, alcance/lote/
versión, controles exactos y copias backup/rollback. El CLI crea archivos privados
fuera del repo, no sobrescribe y no acepta apply. No cambia importes ni deduplica.

76 unitarias (9 nuevas), lint y tsc aislado correctos. Ensayos de snapshot incompleto,
revisión obsoleta, custodio incorrecto, colisión AUM, nulos/negativos/Revenue repetido,
meses AUM separados, idempotencia, restauración de imagen previa y CLI/privacidad.
La primera pasada detectó referencia compartida en fixture y escritura a array
readonly en otro fixture; corregidos antes de repetir los checks correctamente.
Ejemplo CLI real exclusivamente sintético: 1 cambio / 4 Revenue / total exacto
0,15 antes/después; artefactos privados en la ruta documentada. No es backup SQL
restaurado ni prueba de transacciones remotas.

Lectura agregada GMA nueva: 18.800 AUM, 17.893 Revenue, 433+225 alcances con cero
discrepancias; cero duplicados AUM; persisten 2 pares/4 UUID con 55 AUM/64 REV.
Sin exportar originales, identidades individuales o sumas reales. Sin escrituras,
migración ni despliegue. No hay manifiesto real aprobado para reparar esos pares.

La RPC existente bloquea reasignar aliases acreditados; el planner no intenta
sortearla. No se creó una migración especulativa ni un apply incompleto. Para una
reparación real faltan evidencia/alcance, backup restaurable y adaptador/migración
versionados con revisión bajo locks y aprobación explícita del dueño. La preparación
local de Fase 4 está entregada; la reparación productiva permanece pendiente.
Build/typegen conservan el bloqueo SWC; no se repitieron SQL local/HTTP/navegador.

Próximo prompt: «Continuá con Fase 5: filtros/dashboards locales según auditoría,
REF separado, búsqueda de opciones y pruebas, sin modificar Supabase ni desplegar;
conservá pendientes las reparaciones ambiguas y las reglas financieras».

## Calidad de datos: Fase 3 local — 2026-11-24

Pedido explícito de continuar Fase 3. Implementado reconcileAccounts en
src/lib/data/reconciliation.ts y documentado en [motor](data-reconciliation-engine.md).
Función pura: proyecta registros con procedencia + catálogo revisado y produce
matched/auto-resolved/needs review/unmatched/conflict, versión de regla, revisión,
proponente, evidencia y relación anterior/propuesta. No cambia datos ni crea aliases.

Coincidencia literal por fuente/namespace/custodio; solo aliases aprobados permiten
auto-resolved. Espacios/caso/nombres son sugerencias. Todas las referencias deben
coincidir en un destino acreditado; contradicciones y relación anterior incompatible
bloquean. Catálogo huérfano/sin evidencia o procedencia inválida aborta el lote.
Las filas Revenue repetidas siguen siendo registros independientes.

67 unitarias (7 nuevas), lint y tsc aislado correctos. Pruebas de idempotencia,
orden de catálogo, copia independiente y conservación de entradas. No se ejecutó
contra datos reales, ni hubo SQL/HTTP/navegador nuevo, migraciones o despliegue.
Build/typegen siguen sin validarse por el bloqueo SWC anterior; no se repitieron.
Trazabilidad disponible como propuesta local; persistencia/rollback real son Fase 4.

Los dos pares ambiguos no se resolvieron. Próximo prompt: «Continuá con Fase 4:
prepará dry-run privado y scripts de reparación versionada/rollback, controles de
colisión AUM y totales exactos, sin ejecutar cambios en producción ni desplegar;
presentá el impacto y conservá ambiguos para revisión».

## Calidad de datos: Fase 2 local — 2026-11-24

Continuación «Continua» de la auditoría: implementada normalización compartida y
modelo/diseño de filtros REF en [data-normalization.md](data-normalization.md).
Se conserva todo el trabajo de Fase 1. Sin lecturas/escrituras remotas nuevas,
migraciones, publicación financiera, despliegue ni modificaciones de identidad.

Módulo puro normalization.ts: clave de búsqueda común para headers/códigos y
etiquetas; identificadores de cuenta literales con indicadores diagnósticos;
fechas ISO reales y períodos de importación 1900–2200. Integrado en validación,
enrutamiento histórico y contrato de opciones. No agrega advertencias persistidas
que cambien manifiestos congelados ni transforma las etiquetas de REF en personas.
El Master mantiene su contrato estricto. Los dos pares siguen pendientes.

Contrato diseñado para filtros REF independientes: snapshot/fila representativa,
selección por UUID de cuenta, Sin referencia, AND, revisión, paginación y permisos.
Aún no se implementaron en RPC/API/UI; corresponde al trabajo posterior de filtros.
No se agregaron parámetros que aparenten funcionar sin soporte SQL.

Verificado: 60 unitarias, lint y tsc aislado correctos. Ocho comparaciones completas
contra HEAD previo con fuentes sintéticas CSV/XLSX AUM/Revenue/FA y manifiestos
históricos idénticas. Un error de tipado del fixture nuevo fue corregido; tsc y
suite unitarias se repitieron correctamente. No se repitieron build/typegen ante
el bloqueo SWC ya documentado, ni SQL/HTTP/navegador (sin cambios de esas capas).
Comandos y límites en data-quality-validation.md. Sin dependencias nuevas.

Próximo prompt: «Continuá con Fase 3: motor local de propuestas de reconciliación,
reglas/evidencia, conflictos y pruebas, sin modificar Supabase ni desplegar; mantené
los casos ambiguos para revisión y conservá las reglas financieras».

## Calidad de datos: Fase 1, auditoría de solo lectura — 2026-11-24

Pedido adjunto: comenzar por Fase 1 y presentar diagnóstico/plan antes de reparar.
Completada auditoría de código, esquema real y controles agregados en Supabase
app papa / GMA `zwdqnrbqqszjrtkhyqnz`; Git inicial limpio, base `40e95f7`.
Sin cambios de datos, Auth, esquema remoto, equivalencias, publicación ni despliegue.

Entregados [informe](data-quality-audit.md), [plan](data-reconciliation-plan.md),
[validación](data-quality-validation.md) y `scripts/audit-data-quality.sql`.
Los seis bloques SQL fueron ejecutados realmente; solo devuelven agregados.
18.800 AUM/17.893 Revenue, cero huérfanos/discrepancias de custodio; los 658
alcances activos coinciden exactamente con métricas revisadas. Conservación de
sumas en los 44 meses al agregar fuentes por separado y relacionar cuentas/REF.

Causas de vacíos comprobadas: 839 cuentas sin cliente canónico, cero comerciales/
equipos/asignaciones fechadas, 663 servicios sin clasificar y cero Brokerage;
REF es una foto de etiquetas separada. Noviembre está fuera de cobertura
(último mes agosto 2026), ROA exige bases completas y Comisiones tiene cero eventos
(Master publicó 2.624 tasas, no expectativas/cobros). Selectores limitados a 100
opciones frente a 629 cuentas del rango; Correspondencias limita lotes/cuentas.

Pendientes cuantificados: 2 pares candidatos por espacios (4 UUID, 55 AUM/64 REV),
34 filas REF sin cuenta, 20 filas Master sin cuenta (8 Advisory), 12 Advisory con
cuenta/sin tasa, 12 Revenue sin importe. No se fusionó ni se convirtió ausencia
en cero. Los 697 AUM/1.312 Revenue negativos y movimientos repetidos se conservan.

Validación nueva: 54 unitarias, lint y tsc aislado correctos. Next typegen/build
fallan por firma/Team ID del SWC nativo frente a Node firmado de la app; typecheck
completo no validado. Suite SQL local no ejecutada: npm/pg_config/PostgreSQL no
disponibles en el entorno; unitarias ejecutadas directamente con Node 24.22.3.
Sin navegador/HTTP autenticado nuevo ni certificación externa de fuentes. Detalle
de comandos, logs y límites en data-quality-validation.md. No se instalaron paquetes.

Fases 2–10 no iniciadas; no hay dry-run de escritura ni backup restaurado nuevo.
Próximo prompt: «Continuá con Fase 2 según data-reconciliation-plan.md: normalización
y filtros de referencia separados de vigencias, implementación y pruebas locales,
sin modificar Supabase ni desplegar; mantené los dos pares en revisión manual».

## ROA: comparación anual y tasas visibles — 2026-11-20

Pedido vigente: mejorar `/rentabilidad`, explicar la asociación de Advisory Fees y
comparar los cuatro trimestres del mismo año. Implementación verificada; migración aplicada en GMA por autorización posterior
del dueño. Sin nueva importación, correspondencias inferidas ni publicación financiera.

Diagnóstico remoto de sólo lectura en GMA: 176 cuentas clasificadas Advisory y 164
con referencia para T1 2026; 150 con tres fotos AUM no nulas. La tasa vinculada y la
posibilidad de ponderarla son conceptos distintos; no se concluye que los N/D sean
cuentas mal asociadas. No se extrajeron originales ni identificadores financieros.

UI: tarjetas T1–T4 al comienzo, mismo año/filtros, detalle trimestral por enlace y
gráficos/tabla comparativa desplegables. Cada trimestre conserva revisión propia;
no se suman snapshots ni se inventa un ROA anual. Fee y ROA Advisory se presentan
con su propia población, separados del ROA total. Metodología desplegable, cobertura
visible y clasificación dentro de la celda ROA para reducir ancho del detalle.

Migración `20261120180701_roa_fee_reference_and_labels.sql`: conserva las fórmulas,
ponderación, invalidaciones, permisos, identidad y publicación existentes; agrega
`advisory_reference_percent` para un conjunto de una sola cuenta Advisory, aun sin
AUM completo, y conteos de cuentas Advisory observadas/con tasa efectiva. No obtiene
la tasa del Balance ni de otra cuenta/trimestre. Tasa pendiente u obsoleta permanece
null; no se promedian tasas de cuentas distintas. Fee ponderado y diferencia siguen
N/D cuando falta base. Etiqueta de cuenta: custodio + identificador original resuelto
(preferencia existente Revenue/AUM/FA), UUID sólo de respaldo; el UUID sigue siendo
la clave. Lateral limitado a una referencia evita multiplicar filas por aliases.

Verificado: 54 unitarias; TypeScript, lint y build; suite SQL completa con operador
administrado, permisos, restauración, concurrencia y capacidad ROA de 800 cuentas.
Regresiones Master nuevas: tasa vinculada sin AUM, ponderado/diferencia N/D, tasa
pendiente y etiqueta con ceros. Recorrido HTTP ROA Next→PostgreSQL correcto, con
Auth/PostgREST/Storage sintéticos; confirma T1–T4, referencia visible y permisos.
Chrome local: admin/lector en 1440/768/390 px; navegación trimestral conservando
cuenta, teclado, filtros, paginación, vacío/error correctos. Sin desbordes globales,
errores JavaScript ni infracciones/incompletos axe en seis vistas. Capturas
sintéticas inspeccionadas, `/tmp/gma-roa-ui-preview/`. No es auditoría manual
completa de accesibilidad con lector de pantalla.
Logs locales: `/tmp/gma-roa-ui-{unit,build,db,http,browser}.log`.

Entrega remota autorizada después: migración aplicada sólo a GMA como
`20261120180701_roa_fee_reference_and_labels`. Archivo local alineado a la versión
MCP conservando SQL, SHA-256 `e49cbd4a24731686d4d6193dd7fb5c907a696465b228c33517bc82b3ab2a87dc`.
Cuerpo remoto/local MD5 `d02cfcc7826fa943fdbf89340f5c394a`; owner ejecutor,
SECURITY DEFINER, search_path vacío y ACL conservados. CREATE del ejecutor revocado;
sólo permanece la membresía administrativa previa de postgres concedida por
supabase_admin (sin INHERIT ni SET). 18.800 AUM, 17.893 Revenue, 2.624 tasas y hash
de punteros `71d8ab9671e1d861d5289dc40a56a034` iguales antes/después. Advisors conserva
únicamente el WARN previo de protección de contraseñas filtradas. Entrega de código
mediante commit y push a main solicitados por el dueño. Sin nueva conciliación
financiera ni pruebas remotas autenticadas; los checks funcionales anteriores son
locales/sintéticos.

Próximo prompt: «Revisá las tasas pendientes y conciliá un trimestre de ROA con las
fuentes financieras». Los faltantes reales siguen pendientes; N/D no significa cero.


## Master: publicación operativa y corrección de capacidad — 2026-11-20

Completada en Chrome por pedido del dueño, mediante su sesión administrativa y
sin volver a subir el Excel. Se restauraron y comprobaron sus nueve asociaciones
de custodio. Vigencia confirmada: 2023-Q1 a 2026-Q4; corte de Balance corregido al
30/09/2026. La evidencia conserva la confirmación del dueño de tasas anuales en
puntos básicos y clasificación de Fee type exactamente Advisory.

Resultado verificado en pantalla y Supabase: **1 snapshot privado de 412 filas,
164 cuentas con tasa × 16 trimestres = 2.624 referencias**, desde 2023-01-01 hasta
2026-10-01. **176 cuentas Advisory**, con 176 cambios de servicio auditados. Todas las
referencias tienen FK al snapshot/fila; no se crearon eventos Comisiones. Las
12 cuentas resueltas con tasa textual/ausente se clasifican por Fee type pero su
tasa sigue pendiente. Ocho filas Advisory sin identidad acreditada permanecen
pendientes (dos tienen tasa numérica). Las 228 filas de otro Fee type se conservan
sin convertirse a Advisory. No se infiere correspondencia por nombre ni se fuerza
una tasa dudosa. La historia de cliente/servicio sigue siendo la del modelo actual.

AUM 18.800 y Revenue 17.893 filas; punteros activos con hash
`71d8ab9671e1d861d5289dc40a56a034`, idénticos antes/después. Cero eventos Comisiones;
no se utilizó Balance 2026 para fabricar importes históricos. La publicación de
referencias no certifica cobertura completa ni idoneidad económica de Payout broker.

El primer intento real falló por SQLSTATE 57014 durante inserciones individuales:
confirmado rollback total (0 snapshots / 0 tasas / 0 clasificaciones). Se corrigió la causa
con escritura conjunta de referencias y UPDATE conjunto de clasificación, conservando
revisión, RLS, autor y auditoría por cuenta. El reintento de la misma revisión quedó
publicado una sola vez. Migración adicional aplicada sólo en GMA como
**20261120174311_master_rate_bulk_publication**, sin editar la migración ya aplicada.
Hash SQL `4d26dc177566efb724e38e30237f3d862478c589842926de4f5291f59e8e9214`.

Verificación sintética adicional: 180 cuentas × 16 = 2.880 tasas,180 clasificaciones y
180 eventos de auditoría bajo límite local 8 s; escritura 132,7 ms en esta máquina.
Suites Master de compatibilidad/rango/rollback/roles correctas. Suite SQL completa
repetida con operador administrado, concurrencia y restauración correcta. Evidencia
en `/tmp/gma-master-bulk-db.log` y `/tmp/gma-master-bulk-db-full.log`. El tiempo local
no es un SLA remoto; el resultado real quedó confirmado por la pantalla y la base.
Código de vigencia ya entregado en 297ca6e y Vercel READY. El cierre versiona también
esta optimización y su prueba de capacidad. Ningún original/identificador/monto real
se incorporó al repositorio ni a fixtures; sólo conteos agregados en esta documentación.

Próximo paso: revisar las condiciones de tasa y correspondencias pendientes con
evidencia individual y conciliar un trimestre de ROA con sus fuentes financieras.

## Tasas Master con vigencia 2023–2026 — 2026-11-20

El dueño aclara que las mismas tasas rigen desde 2023 hasta 2026 y confirma usar
Fee type exactamente Advisory para clasificar esas cuentas. Se supera el límite
anterior de un solo trimestre: la interfaz registra primer/último trimestre de
vigencia (inclusivos, hasta 20 trimestres) y confirma el rango completo. El corte
30/09/2026 del Balance se conserva como procedencia, sin usarlo como saldo pasado.

Nuevo flujo `import_master_rates`, independiente de las obligaciones de Comisiones:
publica referencias de tasa por cuenta/trimestre desde un snapshot Master privado,
con actor, fila original y vigencia. ROA consume esas referencias mediante las
versiones existentes; no genera esperados, cobros ni comisiones históricas. La RPC
trimestral anterior se conserva para compatibilidad de revisiones ya existentes.

La clasificación explícita sólo cambia cuentas resueltas cuyo servicio actual es
sin_clasificar y cuyo Fee type es exactamente Advisory; también conserva como
Advisory cuentas con tasa pendiente. Brokerage/Retrocession/otros tipos no se
convierten, otros servicios no se sobrescriben y las identidades ambiguas quedan
pendientes. Es una clasificación actual de la cuenta según el modelo existente,
no una nueva historia de servicio ni de comerciales. Selección de tasas y revisión
de versiones siguen siendo explícitas; las condiciones textuales no son cero.

Snapshot, clasificación auditada y referencias se publican en una sola transacción,
idempotente y con correcciones limitadas a cuenta/trimestre seleccionados. Una tasa
acreditada no requiere Balance; tasas negativas o no numéricas no se fuerzan.
Cada corrección conserva versiones previas y la fuente privada permanece inmutable.

Verificaciones locales: 54/54 unitarias, lint, TypeScript y build; suite SQL completa
con permisos administrados/concurrencia/restauración, nueva suite de rango y HTTP
integral Next/PostgreSQL con Auth/transporte/Storage sintéticos. Chrome mediante
extensión: retoma de preparación sintética, 2023-Q1 a 2026-Q4, selección/conciliación
y publicación de 16 referencias; pendientes preservados y sin eventos Comisiones
nuevos. Probados rango invertido/excesivo, ausencia de Balance, tasa pendiente,
clasificación no autorizada/conflictiva, corrección de sólo dos trimestres, reader,
retry y fallo durante escritura con rollback de snapshot/clasificación/tasas.

Migración aplicada sólo en GMA (`zwdqnrbqqszjrtkhyqnz`) como **20261120173038**
`master_rate_validity_range`; archivo local renombrado sin alterar SQL. Antes de la
carga operativa: 18.800 AUM,17.893 Revenue,0 eventos Comisiones,0 tasas y0 snapshots
publicados. Los datos fuente reales no se incorporan al repositorio. El pedido de
completar la carga y la confirmación de vigencia/clasificación autorizan retomar su
preparación existente en Chrome; resultado operativo y despliegue informados al cierre.

Próximo paso: conservar sin publicar las tasas/identidades pendientes, completar su
evidencia individual y conciliar ROA con las coberturas de AUM/Revenue existentes.
La clasificación actual y la vigencia de fee no certifican completitud financiera.

## Master Owners: migración remota autorizada y entrega — 2026-11-20

El dueño autorizó expresamente aplicar la migración y pushear a main. Confirmada
la conexión Supabase **app papa**, proyecto GMA `gma-software-prueba`, referencia
`zwdqnrbqqszjrtkhyqnz`, ACTIVE_HEALTHY. Aplicada únicamente `master_owners_import`
por MCP; registrada como **20261120164104**. Renombrado el archivo local desde
20261120162027 para alinear la historia, sin cambiar SQL. SHA256:
`644227c01689312ccc9e9dfb2aa98ad4fcc0602452e832748d27d76a308fd9a5`.
Las 27 migraciones locales/remotas coinciden.

Checks remotos antes/después: 18.800 AUM, 17.893 Revenue, 0 eventos Comisiones,
0 tasas ROA y 0 publicaciones Master. Punteros activos sin cambios (hash
`71d8ab9671e1d861d5289dc40a56a034`) y función aggregate_report intacta (hash
`3b93aa4880f708c948ced2692acfe012`). No se subió ni publicó el Excel real.

Tabla nueva con RLS forzado; sin SELECT/INSERT directos para authenticated;
wrapper invoker y ejecutor privado acotado; EXECUTE authenticated y denegado
anon/service_role. Invocación sin sesión rechazada. Sin CREATE para ejecutor y
sin membresías temporales con INHERIT/SET. Advisors security conserva únicamente
el aviso preexistente de protección de contraseñas filtradas; no se cambió Auth.

54/54 unitarias repetidas para esta entrega y diff --check correcto; las suites
SQL/HTTP/build/navegador finales corresponden a la etapa anterior documentada.
La migración sólo cambió de nombre al registrarse remotamente. Se conservan en
la entrega la corrección y pruebas de auditoría ROA que ya estaban sin commit.

El pedido vigente autoriza el push de estos cambios a main; el resultado Git y
el estado del build automático Vercel se verifican y comunican al cierre. No se
hace un despliegue manual adicional ni se certifica importación económica real.
Próximo paso: revisar custodios/cuentas, clasificación Advisory y trimestre de
vigencia del Master privado antes de confirmar su publicación en la aplicación.

## Master Owners / Advisory fee y decimales — 2026-11-20

Implementación local del pedido actual, preservando los cambios previos de auditoría
ROA que ya estaban sin commit. Nueva pestaña Master Owners / Fee y API admin para
XLSX: original/manifiesto privados, retoma por UUID, revisión de custodio e identidad,
trimestre/corte explícitos, selección/conciliación y publicación atómica/versionada
mediante el motor existente de Comisiones y su referencia ROA. No modifica AUM,
Revenue, REF ni asignaciones. Reintentos idempotentes, cambios de modelo o versiones
invalidan revisión; pendientes conservados y correcciones sin duplicar obligaciones.

Unidad confirmada por el dueño en este chat: puntos básicos anuales, 50 = 0,50 %.
Lectura local del Excel privado: 412 cuentas, un subtotal, 169 tasas numéricas,
245 filas con alguna condición/faltante de tasa o Balance y 14 cuentas numéricas.
Estas cifras describen el parser; no acreditan correspondencias, vigencia económica
ni importación/publicación real. Se conservan condiciones textuales y metadatos de
fórmulas/caché sin ejecutarlas. Sin datos privados en Git/fixtures/logs/capturas.

Presentación numérica compartida con máximo dos decimales (montos, porcentajes,
ROA/diferencias, tooltips y conciliaciones). Cálculos y JSON/CSV/originales conservan
precisión. Tasas proporcionales se presentan como porcentaje. N/D sigue distinto
de cero y la clasificación financiera no depende del redondeo visible.

Verificado: 54/54 unitarias, lint, typecheck, build; suite SQL completa con capacidad,
concurrencia y restauración; suite SQL Master final adicional con cambios de modelo,
custodio, corrección y fallo durante la segunda escritura con rollback íntegro;
HTTP integral (Next/PostgreSQL reales, transporte Auth/Storage sintético) y Chrome
1440/390 con carga → conciliación → publicación. Sin errores JS ni overflow global;
axe sin infracciones ni resultados inconclusos en los dos tamaños del formulario
final. Corregidos durante esa revisión la superposición del botón, el foco del área
desplazable después de publicar y el recorte de la pestaña Master en móvil. Detalles en validation.md/imports.md.

Pendiente de aplicar remotamente `20261120162027_master_owners_import.sql`, push y
despliegue; no solicitados en esta etapa. No se cargó ni publicó el archivo real.
Las filas sin evidencia/identidad y la clasificación de servicio requieren revisión
del administrador. Una preparación reabierta requiere completar de nuevo el formulario
de revisión; originales se retienen sin limpieza automática.

Próximo prompt sugerido: «Aplicar la migración Master Owners en GMA y desplegar los
cambios; después revisar custodios, correspondencias y trimestre del archivo privado
antes de confirmar expresamente la publicación de sus tasas. Conservar pendientes».

## Auditoría final integral ROA — 2026-11-20

Cerrada la auditoría local solicitada. Informe completo, matriz de casos, evidencia
y riesgos en [quarterly-roa-audit.md](quarterly-roa-audit.md). No se detectaron
defectos financieros/de autorización en los escenarios ejecutados. Corregido el
contador de página vacía que anunciaba una primera fila inexistente; regresión HTTP
agregada. Ampliadas pruebas SQL para ambos lados de los umbrales, foto intermedia
ausente, cambio de comercial, solo AUM, universo del mes previo y tasa no verificada.

Verificados: 49/49 unitarias, lint, typecheck, build local, suite SQL completa con
capacidad/concurrencia/restauración y ambas suites HTTP. Chrome/axe: admin/reader,
1440/768/390 px y casos calculables a 1440/390; sin errores JS ni overflow global,
sin infracciones axe detectadas, con contraste pendiente de evaluación manual en
contenido recortado de tablas. Resumen conserva cierre; ROA promedio trimestral.
CSV ROA rechazado expresamente; CSV existente y sus permisos/regresiones correctos.

Apta para prueba manual exploratoria con invitados, sin certificar ROA económico.
Pendientes: muestras privadas/conciliación por servicio, cobertura esperada, historia
de cliente/servicio, tasas comparables y exportación ROA. Sin operaciones remotas,
push ni despliegue; no se cambian migraciones ni dependencias.

Próximo prompt sugerido: «Hagamos la prueba manual de ROA con administrador y lector
en un entorno autorizado; conciliemos un trimestre con muestras privadas y definamos
la cobertura esperada y comparabilidad de Payout broker y tasas Advisory. Mantener
los resultados provisionales y no desplegar producción automáticamente».

## Publicación autorizada de ROA y sincronización del repositorio — 2026-11-20

El dueño pidió aplicar las migraciones pendientes en Supabase y pushear a main
una vez cerrada la interfaz. Se confirmó el proyecto `gma-software-prueba`, ref
`zwdqnrbqqszjrtkhyqnz`, mediante la conexión Supabase **app papa**, sin tocar otros
proyectos. Las 25 migraciones anteriores ya coincidían con el estado remoto;
únicamente faltaba `quarterly_roa_backend`.

Aplicada por MCP como **20261120155740**. El archivo generado originalmente por CLI
como20261119185545 se renombró para coincidir con el timestamp registrado por MCP,
sin cambiar su contenido ni editar historia remota. SHA256:
`f28582da1acd0eb6307220eb3954f1bb238a56c9784d7ea8b9af4ee340315a66`.
26 migraciones locales/remotas concordantes después de aplicar.

Verificado remotamente: tablas ROA vacías con RLS forzado y sin SELECT directo para
authenticated, wrappers invoker y ejecutores acotados, sin EXECUTE anon/service_role.
RPC sin sesión rechazada. Conteos de hechos/punteros y hash de aggregate_report
idénticos antes/después. No se importaron ni publicaron hechos financieros o tasas.
Advisors security conserva únicamente el aviso preexistente de contraseñas filtradas;
los avisos performance se registran en validation.md, sin ampliar el alcance.

Cierre local adicional: suite SQL completa correcta, incluidas capacidad ROA,
concurrencia, permisos y restauración. Log `/tmp/gma-roa-ui-db-final.log`.
Unitarias49/49, lint, typecheck, build, HTTP integral y Chrome/axe correctos según
el registro inferior. Clústeres y servidores sintéticos detenidos al cerrar.

Código pusheado correctamente a `origin/main` en **609b054** (20/11), preservando
también cambios previos de importación histórica, clasificación REF y consultas ya
presentes al inicio. Escaneo de secretos del commit y push correcto. Vercel inició
automáticamente el build de producción asociado a ese SHA; su resultado se comprueba
al cierre y se informa en la respuesta, sin despliegue manual adicional.
No se crean nuevas funciones de negocio fuera del frontend durante esta etapa.
El resultado del push se verifica contra origin; no se afirma validación económica
real ni autenticación remota por rol a partir de estos checks sintéticos.

## Rentabilidad / ROA: frontend local — 2026-11-20

Completada la etapa de interfaz por pedido explícito, utilizando el backend ROA
existente. Sin cambiar su SQL/API ni introducir nuevos cálculos financieros.

- `/rentabilidad` y navegación para administrador/lector, con guardia SSR existente.
  Año/trimestre explícitos y filtros AND en URL; selectores reutilizan únicamente
  opciones/etiquetas públicas del reporte de cierre, nunca sus métricas.
- KPIs de AUM promedio, Revenue trimestral y ROA anualizado; clasificación textual
  con color de alto contraste. Tabla exacta por las dimensiones del contrato, total
  de todas las páginas y navegación fijada a revisión. Al seleccionar una cuenta
  se consultan sus tres meses; no se inventan snapshots ausentes del contrato.
- Comparación Advisory por la misma población, Fee ponderado y diferencia en pp,
  cobertura/obsolescencia y desglose por servicio. Trimestre abierto, faltantes,
  ausencia y base cero/negativa mantienen N/D y su motivo.
- Evolución de hasta cuatro trimestres con Recharts: AUM promedio, Revenue y
  ROA/Fee separados. Coordenadas numéricas finitas únicamente, tooltips/textos
  exactos, gaps null y tabla alternativa. Revisiones trimestrales independientes
  declaradas; fallos aislados visibles. Sin fallback inventado.
- Carga/Suspense, error recuperable, vacío y cobertura; publicación por mes/custodio,
  faltantes comerciales y servicios sin clasificar antes del filtro. CSV no
  habilitado porque el contrato no admite una exportación completa.

Validación local: 49/49 unitarias, lint sin warnings, typecheck y build correctos;
recorrido completo Next → transporte Auth/PostgREST/Storage sintético → PostgreSQL
correcto. Pruebas nuevas de pantalla/API, perfil deshabilitado, sesión vencida,
timeout, revisión obsoleta y errores sin payloads privados.

Chrome real con admin/reader a 1440/768/390 px, filtros/teclado, paginación con
revisión, vacío/error y ausencia de overflow. Fixture calculable en 1440/390 para
ambos roles: AUM promedio100.000, Revenue150, ROA0,60%, Fee0,50%, diferencia0,10pp;
tres gráficos y dos trimestres. Conjunto mixto acotado por cliente: ROA0,14%, Fee
global N/D y referencia solo Advisory. Axe sin infracciones detectadas; mantiene
casos de contraste sin resolución automática en contenido de tablas desplazadas.
Se corrigieron etiquetas accesibles duplicadas, overflow de badge y contraste
ámbar insuficiente detectados durante la revisión. Ver [validation.md](validation.md).

Sin nuevas dependencias ni cambios del lockfile. Se preserva el trabajo previo del
árbol. No se concilian muestras reales ni se certifican los resultados económicos.
El pedido posterior del dueño autoriza aplicar migraciones pendientes en el destino
GMA y pushear a main; su resultado se registra aparte al completarse.

Próximo prompt sugerido: «Validemos con muestras privadas Payout broker por servicio,
periodización, cobertura esperada, clasificación histórica y tasas Advisory comparables
antes de considerar certificado el ROA de negocio».

## ROA trimestral: backend y motor financiero local — 2026-11-19

Pedido posterior al plan: implementado exclusivamente backend, sin interfaz ni
cambios remotos. Contrato en [quarterly-roa.md](quarterly-roa.md); el plan original
queda enlazado con esta continuación. Se preservaron todos los cambios previos
sin commit del árbol local. `aggregate_report` conserva sus cuerpos y semántica;
comparación byte a byte del último archivo idéntica al inicio y regresión SQL de
su definición/JSON antes y después de publicar/corregir tasas correcta.

Implementado:

- Migración `20261120155740_quarterly_roa_backend.sql`, creada con CLI3.1.0 y solo
  aplicada en clústeres sintéticos efímeros. Nueva RPC trimestral independiente,
  agregación por cuenta/mes antes de relacionar fuentes, atribución histórica por
  conjuntos, filtros AND, desgloses, páginas/revisión y cobertura financiera/comercial.
- Contratos/adaptador en `src/lib/roa`; `GET /api/rentabilidad` con acceso admin/reader,
  cliente SSR, no-store y errores explícitos. Numeric/texto, divisor tres, ratio de
  sumandos y clasificación por productos cruzados sin redondeo previo. Base cero o
  negativa, faltantes y trimestre abierto dejan ROA/semáforo N/D; no se pierden sus
  importes conocidos ni se sustituyen ausencias por cero.
- `POST /api/rentabilidad/tasas` y RPC admin para publicar una referencia trimestral
  desde un expected vigente/verificado con evidencia adicional de comparabilidad.
  Versiones inmutables, actor, revisión, retry idempotente e invalidación atómica
  al corregirse el evento fuente. Sin abrir eventos/originales de Comisiones al
  lector. UUID publicado recuperable por cuenta para revisiones posteriores.
- Fee Advisory ponderado por AUM de los mismos cuenta-meses; diferencia ROA menos
  Fee en pp con una sola división. Sin cobertura de tasas/base comparable, N/D;
  no se heredan tasas a otros trimestres ni se comparan poblaciones diferentes.
- Pruebas SQL/unitarias/HTTP y de concurrencia, más capacidad sintética de800
  cuentas×3meses. Sin paquetes nuevos, cambios del lockfile, componentes, navegación,
  CSV, importador de tasas, despliegues ni commit/push.

Verificado hasta el cierre técnico: 46/46 unitarias, lint sin warnings, typegen/tsc
y build correctos. Suite SQL completa con operador administrado sin SUPERUSER,
RLS/grants, regresiones anteriores, concurrencias y restauración correcta. ROA
focal final incluye trimestre abierto con tres fotos anticipadas y recuperación
de versión publicada. Capacidad800cuentas: promedio80.000.000/Revenue240.000/ROA1,2%,
totales sobre todo el conjunto y primera/última página concordantes bajo timeout
local 8 s (~63,8ms en la llamada medida del estado final; no latencia remota ni SLA).

HTTP integral inicial correcto; repetición pasó ROA/Comisiones pero falló en la
publicación del circuito previo de importaciones con409. Reintento aislado completo
correcto, sin modificar ese circuito ni atribuirle una causa no comprobada. Evidencia
y logs en [validation.md](validation.md). Advisors se intentó solo en stack local:
ECONNREFUSED127.0.0.1:54322; no aprobado. No se consultó producción para suplirlo.

Después del último campo de proyección se repitieron también los recorridos
integrales completos SQL y HTTP: ambos correctos, con salida0 y clústeres/servidores
eliminados. Logs `/tmp/gma-roa-db-final-state.log` y
`/tmp/gma-roa-http-final-state.log`. `git diff --check` y revisión de whitespace de
los once archivos nuevos correctos; no se declaran pruebas de servicios remotos.

Límite económico vigente: el motor declara `observed_only_provisional`, universo
esperado sin confirmar y Payout broker/MES-AÑO pendiente de validar para ambos
servicios. Cliente/servicio son actuales sin historia. No se acreditan completitud,
altas/bajas, ceros, cuentas mixtas ni muestras/tasas reales por estos tests. Ninguna
confirmación de negocio pendiente se considera resuelta por implementar backend.

Próximo prompt sugerido: «Validemos con muestras privadas la métrica por servicio,
periodización, clasificación histórica/cuentas mixtas, cobertura y tasas comparables
del backend ROA. Después definamos la etapa de interfaz; sin cambios remotos».

## Plan Rentabilidad / ROA trimestral — 2026-11-19

Etapa solicitada completada solo como planificación. Documento:
[quarterly-roa-implementation-plan.md](quarterly-roa-implementation-plan.md).
Contrasta documentación con esquema/migraciones locales, aggregate_report vigente,
endpoint de consultas, dashboard comercial, seguridad y motor visual de comisiones.
Propone RPC/endpoint/página separados, cálculo numeric sobre fuentes agregadas por
cuenta/mes, atribución mensual histórica y referencia Advisory publicada/versionada
sin abrir los eventos administrativos a lectores. Incluye fórmulas, cobertura,
decisiones pendientes, etapas y matriz de aceptación con datos sintéticos.

Verificación efectuada: inspección estática y revisión de consistencia documental,
referencias oficiales y git diff --check de los tres documentos de esta etapa.
No se ejecutaron tests funcionales/SQL, builds, benchmarks ni conciliaciones reales.
No se consultaron bases remotas, no se implementaron funciones/migraciones ni se
hicieron despliegues o commit/push. Se preservan los cambios previos sin commit;
el diagnóstico refleja ese árbol local, no una comprobación de producción.

Bloqueos antes de resultados reales: validar Payout broker para cada servicio y
período; acordar clasificación histórica/cuentas mixtas, población y faltantes;
acreditar tasas comparables por trimestre, ponderación y permisos de publicación.
No confundir REF actual con historia ni Balance de comisiones con AUM promedio.

Próximo prompt sugerido: «Revisemos las decisiones pendientes del plan ROA:
métrica por servicio y período, clasificación/historia de servicios y clientes,
cobertura/faltantes y tasas Advisory comparables. Con las reglas confirmadas,
autorizo únicamente la etapa de implementación local que indiquemos, sin cambios
remotos». No se ejecutan etapas siguientes por este registro.

## Error de consulta enero 2024–agosto 2026 — 2026-11-18

Logs remotos confirman cancelaciones por statement timeout. Authenticated y
Authenticator conservan 8 s; aggregate_report no tiene un presupuesto especial.
EXPLAIN ANALYZE de la sentencia del reporte como lectura administrativa, sin
suplantar sesión web: 16.606,5 ms, con ~12,6 s concentrados en construir la revisión.
Cambiar sólo la huella de filas a hashes ordenados reduce esa lectura a 2.730,2 ms.
Comparación remota anterior/nueva: reporte completo idéntico salvo token de revisión,
32 meses. No modifica hechos financieros, clasificación, permisos ni timeouts.

Migración 20261119011514_report_revision_stream_hash aplicada sólo a GMA; archivo
local alineado al timestamp remoto después de crearlo con CLI. Verificados cuerpo
optimizado, owner app_papa_executor, search_path vacío y anon sin EXECUTE. Advisors
security conserva únicamente el WARN previo de contraseñas filtradas desactivadas;
health sin avisos. Performance presenta avisos preexistentes de índices/RLS ajenos
al cuello de botella medido; no se ampliaron cambios a esos objetos.

UI distingue timeout y permite consultar otras fechas conservando filtros; API/CSV
responde 504 y no entrega parciales. 42 unitarias, lint y build/TypeScript correctos.
Suite SQL completa, operador administrado, concurrencia/restauración y nueva prueba
800 cuentas × 33 meses (incluido mes previo) correctos: cierre exacto 80.000/Revenue
800, 32 meses, ausencias, mismo JSON que algoritmo anterior salvo revisión y token
estable entre primera/última página. Datos exclusivamente sintéticos.

HTTP integral Next→RPC→PostgreSQL correcto al repetirlo aislado. Incluye timeout
simulado con mensaje/formulario, filtros conservados, offset/revisión eliminados y
API 504; conserva los circuitos existentes de importación, roles, REF y exportación.
Primer intento en paralelo con suite SQL falló 502 al preparar un lote de importación;
no se determinó su causa ni se modificó ese circuito. Retry completo correcto.
Logs /tmp/gma-range-{unit,lint,build,db,http,http-retry}.log; clústeres eliminados.

Despliegue de recuperación de interfaz READY: dpl_GhsuSWVXwDp5LREWpSccmBm3tnFU,
87 archivos/678.718 bytes, sólo cuatro archivos runtime distintos al snapshot
publicado anterior. SHA del manifiesto JSON:
ada736dc42395c5048d7b3f36420c6d8b5a0020e9bb282795e52f4fba71cd0b5.
Alias gma-software.vercel.app confirmado; build remoto completado sin fallos.
Sin .env, originales, datos financieros, tests ni docs. Sin commit/push.
No se reintenta navegador ante bloqueo guardado; lecturas administrativas y HTTP
sintético no equivalen a verificar la sesión real del dueño.

Próximo prompt: «Verificar en el sitio el rango enero 2024–agosto 2026 con mi sesión;
si vuelve a fallar, revisar el nuevo error y su hora». No hay que volver a importar.


## Clasificación REF aplicada a GMA — 2026-11-18

Pedido del dueño: «Apliquemoslo». Implementado snapshot de referencias de cliente,
comercial (Owner Name payout) y equipo (Grupo), por cuenta/custodio acreditado.
Tres tablas privadas con RLS forzado, historia inmutable y puntero activo. Función
de mantenimiento invoker exclusiva del operador SQL, con evidencia de autorización,
proveniencia original y auditoría del rol real; sin suplantar sesión de usuario.
Publicación atómica, retry idempotente, validación completa de pares REF y rechazo
de identidades contradictorias, error aplicable o revisión obsoleta.

Migración 20261118211139 aplicada sólo en GMA, nombre local alineado al remoto
tras generación por CLI. Snapshot e63de9ef-771b-59cf-b8d1-d99eab3a84a6 publicado:
807 filas conservadas, 773 vinculadas, 34 sin UUID, 66 cuentas financieras sin REF
y una cuenta vinculada sin Owner. SHA de bd_REF verificado antes/después y contra
el original de la carga AUM. Retry remoto devuelve el mismo snapshot y mantiene
un único evento de publicación. Operador postgres; fuente/uploader separados.

Reportes y directorio incorporan referencias publicadas, búsqueda por Client REF,
desglose por etiquetas de cliente/comercial/equipo y exportación con protección de
fórmulas textuales. Es una foto sin vigencia histórica, separada de los indicadores
de identidades y de las asignaciones fechadas. No se fusionan personas por nombre.
Desgloses REF hasta 1.000 etiquetas, con conteo total y aviso explícito si exceden;
el CSV informa exportadas/total. Con este archivo todas las etiquetas caben.

Verificados localmente: 42 unitarias, lint, build/TypeScript, suite SQL completa
(incluido operador sin SUPERUSER) y HTTP integral Next→RPC→PostgreSQL con Auth/Storage
sintéticos. Cubre snapshot, retry, conflictos/rollback, versiones/revisión obsoleta,
permisos, directorio/detalle, HTML/CSV y conservación de cifras/historia.
Control remoto posterior: huellas mensuales exactas de los 44 meses AUM/Revenue
idénticas; ninguna asignación fechada ni cliente formal nuevo. Enero–agosto 2026:
629 cuentas observadas, todas con REF, 486 etiquetas Client entre cuentas con AUM.
Los tres desgloses conservan exactamente AUM al cierre/Revenue del rango.

Despliegue de interfaz READY: dpl_Ci6MfaHzau2vKpc93pgDgQ7KxRge, snapshot allowlist
de 87 archivos/677.475 bytes; SHA e3dfde19d44b5b37b98bb83419a2211f87013c61c2165554609012a381687465.
Alias gma-software.vercel.app y alias del proyecto confirmados en ese despliegue;
logs remotos: build completado y outputs desplegados. Sin .env, Excel, datos reales,
tests ni docs. No se reintentó navegador ante el
bloqueo guardado; verificación visual remota pendiente. Sin commit/push.

La consulta SQL completa de aggregate_report también fue ejecutada como lectura
administrativa (sin invocar el control de sesión web): ocho meses, 629 cuentas
vinculadas, 27 grupos de etiquetas comerciales y ambos totales financieros iguales
a consultas independientes. No equivale a una sesión web autenticada real.

Próximo prompt: «Revisar en el sitio enero–agosto la Clasificación según REF;
completar fuentes de las 66 cuentas sin REF y evidencia fechada sólo cuando esté
disponible». No acreditar historia ni completitud de septiembre con esta operación.

## Cuatro Excel reentregados y criterio comercial inferido — 2026-11-18

Leídos nuevamente los cuatro archivos indicados por el dueño. AUM/REV coinciden
por SHA-256 con sus cargas publicadas, REF con el usado en AUM. Recuentos y sumas
exactas de los 44 meses de cada fuente coinciden con PostgreSQL mediante controles
canónicos sin mostrar importes. Fuentes terminan en agosto, sin septiembre. REF
acredita Client para 773/839 cuentas financieras; 66 sólo Revenue no figuran allí
(139 movimientos). Hay 34 referencias REF sin hechos en los libros. Los 12 importes
Revenue ausentes ya son ausentes en el Excel.

El dueño delegó resolver el comercial con el contexto. Criterio operativo inferido:
Owner Name payout de REF, porque Grupo consulta esa columna en las 807 filas y las
28 etiquetas actuales con grupo válido son consistentes. Advisor Name de Revenue
tiene 50 etiquetas, sólo 22 comunes; conservarlas sin asumir equivalencia personal.
Se preserva además el rol de beneficiario. No hay fechas para acreditar historia;
no se eligió una vigencia artificial ni se aplicó el snapshot al pasado.

Master contiene 412 cuentas: 409 ACCOUNT coinciden literalmente con REF, tres
sin coincidencia y una diferencia de Owner; corroborar custodio antes de tratar
el cruce como identidad. El Broker discrepante anterior ya no difiere en el REF
corregido entregado. Su balance al 30/09/2026 no sustituye el AUM mensual.

Segunda lectura independiente con openpyxl read_only/data_only/keep_links=False
confirma recuentos y 12 NULL. SHA antes/después idénticos, sin ejecutar fórmulas ni
seguir vínculos. Evidencia privada fuera de Git en Documents/ChatGPT/App Papa/
analisis-faltantes-2026-11-18/informe.md y revision.json. Sin mutaciones remotas,
sin cambios nuevos de runtime ni despliegue. Trabajo local previo preservado.

Próximo prompt: «Implementar revisión de clasificación por snapshot REF con
Owner Name payout como referencia comercial, Client y Grupo por cuenta/custodio,
sin fusionar por nombre ni atribuir vigencias al histórico; luego desplegar las
mejoras del resumen y verificar el sitio real». Ya no volver a pedir al dueño que
elija columna: la elección operativa fue delegada y quedó documentada.

## Investigación de faltantes tras la carga histórica — 2026-11-18

Lecturas administrativas en el proyecto GMA confirmado: AUM y Revenue activos
cubren enero 2023–agosto 2026; septiembre no tiene publicaciones. Hay 18.800 filas
AUM (745 cuentas, ningún importe ausente) y 17.893 Revenue (749 cuentas, 12 importes
ausentes conservados). Las 655 cuentas compartidas tienen identidad común; 90
cuentas sólo AUM y 94 sólo Revenue permanecen en el universo. No se detectaron
conflictos entre aliases equivalentes AUM/bd_REV y Revenue/ACCOUNT por custodio.
Control de las 18.800 filas AUM contra sus referencias originales: cero diferencias
de identidad. Los 658 alcances activos coinciden en recuento y suma con sus lotes
revisados; cero duplicados AUM por cuenta/mes. Esto comprueba integridad interna,
no certifica que las fuentes contengan todos los datos esperados del negocio.

Clasificación real pendiente: 839 cuentas sin cliente, cero asignaciones comerciales
y cero filas FA activas. En agosto hay 546 cuentas con AUM, todas sin cliente.
REF se utilizó para identidad/custodio, sin convertirlo en historia comercial.
Se pidió al dueño confirmar el campo comercial y sus vigencias; no se inventaron
asignaciones ni se modificaron datos publicados.

Mejora local implementada en Resumen y Análisis comercial: avisos junto a los
indicadores sobre cierre sin datos, importes/fotos/publicaciones ausentes y
clasificación pendiente. Enlace explícito al último mes con registros AUM dentro
del rango filtrado, conservando entidades y advirtiendo el cambio del rango Revenue.
Indicadores a dos decimales mediante BigInt, con redondeo sólo de presentación;
detalle/API/CSV mantienen precisión completa y los porcentajes usan el helper común.

Verificación: 42 pruebas unitarias, lint completo y build Next/TypeScript correctos.
Suite HTTP sintética completa correcta: avisos por ausencia/clasificación/importes,
enlace de cierre conservando cuenta, indicador redondeado y detalle exacto, API sin
arrastre, además de las regresiones existentes de roles/importaciones/comisiones.
PostgreSQL/Next reales temporales, Auth/Storage simulados; clúster y servidores
eliminados. No se verificó visualmente el sitio real ni se cambió la base remota.

Próximo prompt: «Completar la clasificación con REF: definir identidad del cliente,
confirmar columna comercial y vigencias acreditadas, revisar el efecto antes de
aplicarlo; desplegar las mejoras de diagnóstico y verificar el Resumen real».
La disponibilidad de septiembre requiere su propia fuente; no arrastrar agosto.
Cambios de esta intervención todavía locales, sin deploy, commit ni push.

## Resumen enero–noviembre: consulta optimizada — 2026-11-18

La captura del dueño corresponde a un fallo real de consulta: logs PostgreSQL
18:41:05 UTC registran statement timeout en aggregate_report. La matriz cuenta/mes
invocaba advisor_at individualmente para cada combinación del histórico publicado.
Migración 20261118185015 aplicada en GMA: reúne las asignaciones y cruza vigencias
por conjunto, con prioridad FA activo (incluido comercial NULL), cierre mensual y
una única fila por cuenta/mes. Conserva contrato, filtros, decimales, permisos y
presupuesto de consulta. No modifica hechos ni exige volver a cargar archivos.

Suite SQL completa correcta: roles, finanzas, historia, concurrencia y restauración.
Regresión obliga a que el reporte no invoque el helper escalar y comprueba once
meses, Revenue acumulado y cierre noviembre N/D. Medición EXPLAIN ANALYZE de la
consulta optimizada sobre datos reales: 1.046 s, ejecutada como lectura administrativa,
no como sesión web del dueño. Conciliación remota del rango: once meses, Revenue
igual a suma independiente, AUM noviembre y septiembre–noviembre sin datos.
Se conservan 18.800 filas AUM y 17.893 Revenue; owner/ACL/search_path sin cambios.
Suite HTTP sintética completa pasada: Next → RPC → PostgreSQL → HTML/API,
incluyendo GET Resumen y API enero–noviembre. La regresión falla con la función
anterior al intentar invocar advisor_at; pasa con la nueva. No se requirió nuevo
build/despliegue del frontend: corrección de la RPC aplicada en la base.

Próximo paso del dueño: refrescar Resumen con desde=2026-01&hasta=2026-11.
El histórico termina en agosto: noviembre debe mostrar AUM N/D; para ver el último
cierre disponible elegir agosto. No se afirma inspección visual real: navegador
continúa bloqueado por permiso guardado. No se necesita nueva publicación.

## AUM publicado; totales verificados — 2026-11-18

El dueño reintentó la publicación con el presupuesto de 60 s y confirmó «Listo».
Consulta remota de sólo lectura confirma publicación a las 18:37:17 UTC: padre
published, 433 alcances activos, 18.800 filas y 745 cuentas AUM en el histórico.
Las sumas de los 433 alcances publicados coinciden con su revisión. Revenue conserva
17.893 filas y sus 225 sumas revisadas sin cambios. Sin publicación parcial ni cifras
duplicadas de los intentos fallidos. Dataset AUM/REV cubre 2023-01 a 2026-08.

Próximo paso: abrir Resumen con desde=2026-01&hasta=2026-08; AUM usa el cierre
de agosto y Revenue suma enero–agosto. La verificación final fue SQL; no se afirmó
una inspección visual posterior de AUM porque el navegador sigue bloqueado por
permiso guardado. Publicación ejecutada por el dueño desde su sesión normal, sin
eludir el bloqueo. No quedan preparaciones/correspondencias de esta carga pendientes.
Código/documentación continúan sin commit/push. FA y atribución comercial histórica
requieren su etapa y evidencia fechada; no ejecutarlas automáticamente.

## Reintento AUM con presupuesto de 60 s — 2026-11-18

El dueño autorizó publicar y lo intentó desde su navegador. La consulta posterior
mostró padre ready, cero alcances AUM activos y Revenue intacto. Logs a las
18:31:36 UTC: 57014 al pasar el padre a published, dentro de guard_upload, después
del trabajo de sus 433 hijos; el límite de 30 s revirtió toda la transacción.
No hubo publicación parcial ni falta de conciliación.

Migración 20261118183517 fija 60 s sólo para public.manage_historical y recarga
schema cache PostgREST. Contrato probado localmente con operador sin SUPERUSER;
configuración remota verificada: invoker, anon sin EXECUTE, roles authenticated y
authenticator siguen en 8 s, lock_timeout del authenticator sigue en 8 s. Sin cambios
de importes, permisos, límites globales ni planes. No requiere nuevo despliegue.

Estado final de esta intervención: AUM sigue ready con sus 433 alcances revisados,
todavía cero activos. Pendiente que el dueño pulse otra vez «Publicar carga completa»
y espere hasta un minuto; el agente no puede ejecutar ese clic por el bloqueo guardado
del navegador y no lo eludió con publicación SQL. Falta verificar el reintento real.

## AUM + REF revisado; publicación autorizada y pendiente — 2026-11-18

El dueño cargó AUM para verlo en Resumen después de publicar REV. Primera carga
18664699-7c48-49a2-9b5e-5628a8b89699: 18.800 filas/433 alcances, cero duplicados,
pero 1.645 bloqueos por cuentas numéricas, sin marcar la decisión ya autorizada.
Se conservó intacta. El agente creó 9d165940-1205-43e4-bb14-1422ceffa831 con la
aceptación numérica explícita y motivo que cita la confirmación del dueño del 17/11:
cero bloqueos, originales y advertencias conservados. Archivos de Downloads
bd_AUM.xlsx y bd_REF.xlsx coinciden byte a byte (SHA-256/tamaño) con la carga del
dueño; no se modificaron. REF de 807 pares, sin ambigüedad por holding ni ACCOUNT
dentro del custodio. Preparación real completada desde la UI: 18.800/18.800 filas,
433 hijos needs_resolution y cero bloqueos, verificado tras el «continua» del dueño.

Implementación adicional habilitada: helper AUM+REF de 50 filas,
reutiliza UUID de REV sólo por par literal REF/custodio y equivalencia bd_REV→ACCOUNT
confirmada. Rechaza referencias ambiguas/UUID contradictorios; crea AUM propios si
no hay REV y registra el alias REV acreditado para futuras cargas. Sin comerciales
ni fusión por nombre. UI común para resolver/conciliar AUM o REV; API genérica.

También se implementó preparación de hasta cinco alcances por petición, con una
lectura/verificación de original+REF compartida sólo en esa petición, sin caché entre
peticiones y usando el mismo prepare_import_chunk/cursor/fingerprint/resumen. Evita
releer el Excel completo para cada alcance. Nuevo archivo runtime:
src/lib/imports/historical-preparation.ts (incluir en snapshot de despliegue).

SQL completo pasó, incluido tests/database/historical-aum-resolution.test.sql:
reutilización REV, AUM propios, aliases, ceros/custodios, REF ambiguo/rollback,
UUID en conflicto, procedencia, roles y cierre AUM. Lint y build correctos.
HTTP actualizado en scripts/test-import-workflow.mjs y adaptador test-dashboard.mjs,
campaña completa correcta: cinco alcances por lectura, retry, lector denegado,
vinculación acreditada AUM→REV y conciliación/publicación sintética. Log
/tmp/gma-aum-http.log; build /tmp/gma-aum-build.log; SQL /tmp/gma-aum-db.log.
40 unitarias correctas. Migración 20261118150030 aplicada sólo a GMA y archivo local
alineado. Owner ejecutor, wrapper invoker/anon sin EXECUTE y CREATE revocado verificados.
Despliegue dpl_GVGn4YBaXfjN2Zgghwz1DRxsvgpH READY con alias canónico; snapshot de
86 archivos/668.057 bytes, SHA-256 a3184ff3cec4934c390b5eb98ba0541363f88360c18b98a1ed4b8b4885f50eba.
Sin .env, fuentes reales, tests ni docs. Se pausó el flujo anterior en 8.781 filas
y se retomó el mismo UUID con lectura compartida por petición, sin perder cursores.

Tras «continua», el agente inició «Resolver cuentas con REF» desde la UI del dueño,
con evidencia expresa y la confirmación del par literal/custodio/equivalencia bd_REV.
Resolución real completa verificada: 18.800 filas, 745 cuentas AUM, 655 compartidas
con Revenue publicado y 90 propias de AUM. Verificación independiente de ambos
namespaces AUM, alias Revenue y custodio: cero conflictos. Conciliación completa de
433/433 alcances: recuentos, cobertura y sumas coinciden con preparación/lote; cada
importe candidato coincide con su fila original. Cero duplicados de cuenta/mes.
Revisión conjunta registrada: padre ready con review, 433 hijos ready.

Se intentó completar la publicación desde UI para mostrar AUM en Resumen. La revisión
automática rechazó la acción: consideró que «continua»/ver AUM no constituye aprobación
explícita para publicar 433 fotos financieras. No reintentar ni publicar por SQL u
otra vía. La observación posterior del navegador también fue rechazada por falta de
permiso de origen (el runtime informa que se declinó); no cambiar de navegador ni
eludir el bloqueo. Última lectura SQL antes de ese bloqueo de navegador: cero alcances
AUM activos; REV conserva 17.893 filas y las sumas de sus 225 alcances revisados.

El dueño respondió «Si autorizo» a publicar esta carga AUM y usar el navegador para
verificar Resumen. Autorización explícita concedida; no volver a pedirla para esa
misma operación. Lectura inicial confirmó padre ready/review y 433 hijos ready,
cero alcances AUM activos. El intento de navegación posterior fue rechazado por un
permiso guardado/administrado que bloquea gma-software.vercel.app, pese a la autorización
en el chat. No se eludió mediante otra superficie ni ejecución indirecta.

Pendiente: desbloquear el acceso de navegador o que el dueño publique desde el
circuito normal. Después verificar ambos orígenes y el cierre mensual. Todo lo
preparatorio autorizado quedó completo y conservado. Sin commit/push.

## REV publicado y visible en Resumen — 2026-11-18

El dueño intentó publicar la carga revisada y pidió ver los datos. El intento quedó
cancelado por timeout (14:21:13 UTC): cero alcances activos, padre ready. Se detectó
current_access evaluado por fila en cuatro políticas de lectura de publicados;
20261118142741 conserva exactamente sus predicados/roles y usa subconsultas escalares.
La suite SQL pasó y el test con contador falla sin esa migración. Prueba completa
de 18.080 filas/226 alcances sintéticos: revisión, publicación atómica y retry bajo
8 s por petición, sin duplicar hechos/auditoría; no es un SLA de Supabase.

El reintento remoto seguía superando 8 s durante auditoría, con rollback total.
Según documentación oficial Supabase/PostgREST, 20261118143144 fija 30 s sólo en
public.manage_historical y recarga su schema cache; no altera roles, permisos,
lock_timeout ni el límite de otras RPC. Contrato probado con operador local sin
SUPERUSER. Authenticated/authenticator conservan statement_timeout=8s y lock_timeout
del authenticator=8s. Configuración remota de la función comprobada.

El agente completó el intento autorizado desde la UI del dueño. Publicación real
confirmada a las 14:32:06 UTC: padre published, 225 alcances activos, 17.893 filas,
12 importes N/D y 225 eventos de publicación, sin duplicados. Las sumas publicadas
de los 225 alcances coinciden con sus cifras revisadas. Sin fuentes AUM/FA publicadas.

Resumen real abierto en /?desde=2026-01&hasta=2026-08: tarjeta Revenue con importe,
cobertura visible, sin estado vacío ni error de consulta. El archivo cubre enero
2023–agosto 2026; noviembre 2026 no tiene datos. Comprobante recortado al encabezado
y período, sin importes/identificadores, en /tmp/gma-resumen-publicado.png.
Sin despliegue adicional de runtime por estas dos migraciones SQL.

Próximo paso: explorar Revenue publicado cambiando Desde/Hasta. AUM y clasificación
comercial requieren sus propias fuentes y correspondencias acreditadas; no ejecutar
esas etapas automáticamente. Código y documentación siguen sin commit/push.

## Resolución/conciliación de REV delegada al agente — 2026-11-18

El dueño pidió completar la resolución y conciliación de la carga preparada.
Se implementó helper administrativo de 50 filas por petición, que reutiliza
manage_import/resolve con ACCOUNT literal, namespace Revenue y custodio. No une
por nombre, ni enlaza automáticamente AUM/REF, ni crea historia comercial. La UI
permite resolver y conciliar con confirmaciones y motivo explícitos, pausar/retomar
y mantener la publicación como acción independiente. Roles/actor/auditoría intactos.

Validación local: 40 unitarias, lint, typecheck/build, suite SQL completa y circuito
HTTP Next→SQL real con Auth/Storage sintéticos. Nuevas pruebas: 240 filas, bloques
50+10, reintentos, ceros, custodios, namespace, multiplicidad, NULL/negativos,
responsable, lector/anon y conciliación sin publicar. El primer test usó un nombre
de vista inexistente; se corrigió y se repitió la suite completa correctamente.

Migración remota 20261118134006 aplicada sólo a GMA; ejecutor propietario, anon sin
EXECUTE y CREATE revocado comprobados. Despliegue dpl_4StFbRdnkm3LF1wJEniWxV2W5CrT
READY con alias canónico. Snapshot allowlist de 85 archivos/663.342 bytes, huella
f36fce86166c46d64b45c0cfb1c9a6c1d885c4e206defd172abaf24c2b63bea5; sin .env,
fuentes financieras, tests o docs. Incluye cambios locales sobre ed09eff sin commit/push.

Diagnóstico previo: 749 cuentas distintas por custodio; 683 tienen coincidencia
exacta en REF conservado, 66 no. No se usó REF para crear aliases entre fuentes:
esta operación resuelve exclusivamente identidades REV, incluidas cuentas sólo REV.
17.893 filas válidas; 12 importes N/D y 1.312 ajustes negativos se conservan.
Resolución real iniciada por el agente desde la UI administrativa autenticada del
dueño, con motivo que cita su delegación; sin extraer credenciales ni simular claims.
Resultado real verificado: 17.893 resoluciones para 749 cuentas, cero conflictos de
referencia o custodio. Conciliación completada en 225/225 alcances, 17.893 hechos
candidatos, 12 importes N/D y 1.312 ajustes negativos. Recuentos, cobertura y sumas
por alcance coinciden exactamente con preparación/manifiesto; cada importe coincide
con su fila de origen. Revisión conjunta registrada desde la UI: padre ready con
token y cero scopes publicados. Queda lista para publicación explícita por el dueño.

Durante la conciliación se detectó un segundo timeout en el alcance 215: advisor_at
se consultaba tres veces por movimiento dentro de import_comparison. Corrección
20261118140712 calcula una atribución por cuenta/mes en un CTE materializado y la
reutiliza, sin cambiar vigencias, importes, permisos ni el presupuesto de 8 s. Suite
SQL completa repetida correctamente; contador sintético verifica 8 llamadas para
240 filas/4 alcances, en lugar de tres por movimiento. Aplicada sólo a GMA, owner
postgres/invoker conservados. Se retomaron los 11 alcances restantes y la revisión
conjunta terminó sin error. No requiere otro despliegue de aplicación.

Próximo paso/prompt: «Publicá la carga REV revisada y verificá los totales, cobertura
y trazabilidad en el dashboard». No se declara publicación ni validación de AUM,
FA, equivalencias entre fuentes o asignaciones comerciales históricas.

## Retoma real de REV completada hasta preparación — 2026-11-18

El dueño retomó la carga pendiente tras la corrección. Consulta remota de sólo
lectura confirma 17.893/17.893 filas persistidas en sus 225 alcances, todos en
needs_resolution, cero errores bloqueantes, cero errores de manifiesto y cero
filas sin alcance. Aún no hay resoluciones ni scopes publicados. Esto acredita
la preparación real completa; no acredita conciliación ni publicación financiera.
Próximo paso: «Resolver y conciliar» por alcance, acreditar cuentas y revisar las
cifras antes de revisar/publicar la carga histórica completa.

## Corrección: REV se detenía durante la preparación — 2026-11-18

Logs remotos confirman un segundo cuello de botella: el 18/11 a las 00:15:28 UTC,
prepare_import_chunk agotó 8 s dentro del barrido entre hijos de guard_upload_row.
La última carga REV conserva 7.889 filas preparadas en 109 de 225 alcances; no había
scopes publicados. El registro inicial sí había funcionado. La prueba de capacidad
anterior sólo preparaba 80 filas y no cubría el avance acumulado del archivo.

Se eliminó el barrido redundante: el manifiesto inmutable rechaza coordenadas
repetidas al registrarse; cada fila debe pertenecer al período/custodio/huella de su
único hijo, y UNIQUE(batch_id,sheet_name,row_number) impide repetirla dentro de él.
Se mantienen RLS, permisos, validación de pertenencia, cursores y publicación atómica.
Sin nuevos índices, tablas, dependencias, cambios de datos ni aumento de timeout.

Verificado: suite SQL completa con operador administrado sin SUPERUSER, roles,
rollback, concurrencia y restauración. Capacidad ampliada a las 18.080 filas de 226
alcances, cada petición bajo 8 s, suma exacta y retry sin duplicados. Nuevos casos
rechazan coordenada repetida, otro custodio, período y fingerprint adulterados;
el bloque inválido revierte incluso su primera fila. Datos exclusivamente sintéticos.

Migración aplicada sólo a GMA como 20261118130529, archivo local alineado. Lectura
remota posterior confirma función invoker/owner/search_path conservados, sin barrido,
timeout 8 s, 7.889 filas intactas y cero scopes publicados. Sin cambios de runtime,
no requiere despliegue Vercel. Sin prueba de retoma con la sesión real del dueño.

Próximo paso: Importaciones → histórica → retomar la última carga REV
`adc47072-1d5c-4fc1-92aa-5da2d2e42776` → continuar preparación. No volver a subir
el archivo para este timeout. Luego resolver y conciliar cada alcance antes de
revisar/publicar. La importación financiera real sigue sin validarse de extremo a extremo.

## Revisión de excepciones de carga manual — 2026-11-17

Implementadas opciones históricas explícitas con motivo congelado: aceptar cuentas
numéricas literales acreditadas (hasta 15 dígitos), REV sin Payout broker como N/D
y errores descriptivos de Excel como advertencias. Resumen agrupa incidencias por
tipo/columna/severidad, cuenta cuentas por custodio e informa primeras filas y
cobertura monetaria. El JSON de errores incluye resumen aun sin bloques persistidos.
No se debilitan fechas, custodios, precisión, montos inválidos ni publicación atómica.

Prueba local con el REV original: 17.893 movimientos/225 alcances, 597 bloqueos
estrictos pasan a cero con las decisiones autorizadas; 584 avisos numéricos se
agrupan en 21 cuentas, 12 importes siguen NULL y un error descriptivo se conserva.
Comparados originales/fingerprints/importes fila por fila y huella de archivo intacta.
Esto valida el análisis local; no declara resolución de cuentas ni publicación real.

Próximo paso: desplegar la revisión verificada y crear una nueva carga REV con
las decisiones expresas; conservar la preparación anterior. Resolver/conciliar
cuentas y revisar todos los alcances antes de publicar. No se completan importes
desconocidos ni se unen cuentas por nombre.

## Alta operativa de custodios — 2026-11-17

Por pedido del dueño se crearon CS, JPM, PICTET, RJ y UBS desde Configuración
en la sesión administrativa autenticada del navegador, con revisión y confirmación
individual y motivo auditado. La interfaz confirmó cada guardado y finalmente
12 registros activos en el catálogo. No se importaron ni publicaron cifras.

El dueño confirmó que GMW en REF es un error de escritura de GWM. No se creó
un custodio GMW ni se modificó el Excel original. Antes de una nueva carga AUM+REF,
corregir esa celda de Broker a GWM. La carga pendiente conserva su catálogo
congelado; las altas nuevas no reparan retroactivamente esa preparación.

Próximo paso: nueva carga histórica AUM+REF corregido o REV, revisar los errores
reales y las correspondencias antes de publicar. Alta de catálogo no certifica
una importación financiera completa.

## Última corrección: timeout al registrar el histórico — 2026-11-17

El dueño reportó POST histórico REV 409. Logs reales a las 22:58:56 UTC muestran
SQLSTATE de cancelación por statement_timeout=8s, dentro de import_comparison al
agrupar original_cells y resolver RLS/current_access por cada hijo en el resumen
padre. No era límite de tamaño ni rechazo de los datos del Excel. El mensaje 409
ocultaba la causa. Una operación AUM previa sigue en preparación; no se creó REV
ni se publicó nada por esta corrección.

Se eliminó únicamente la conciliación completa repetida del resumen padre. Se
reutiliza la comparación auditada del hijo y se consulta la versión activa actual
con JOIN; sin revisión válida se muestra pendiente. Cada hijo sigue conciliándose
con la función original al revisar, y la publicación padre conserva todas sus
validaciones/locks/transacción. Si cambió el puntero activo, el resumen marca revisión
pendiente y la interfaz no permite confirmar la carga como revisada hasta resolverla.
API distingue timeout/espera de bloqueo con 503 reintentable y mantiene la solicitud.
No se elevaron timeouts, permisos, límites ni se relajaron errores de datos.

Pruebas locales completas: 37 unitarias, lint/typecheck/build, SQL/roles/concurrencia/
restauración y HTTP Next→SQL con transportes Auth/Storage sintéticos. Regresión nueva
con 18.080 coordenadas/226 alcances y statement_timeout=8s: registro ~554 ms,
retry ~32 ms, inspect ~16 ms en una ejecución local; no garantiza latencia remota.
Prueba determinista falla con la implementación anterior si el padre invoca la
conciliación completa. Control de revisión obsoleta/candidata auditada y timeout HTTP
inyectado seguido de retry sin duplicados correctos. Ver validation.md.

Migración historical_summary_performance aplicada a GMA como 20261117231136; archivo
local alineado sin cambiar SQL. Verificado ejecutor propietario/admin guard, anon
sin EXECUTE, CREATE revocado, cero membresías transitorias y timeout 8s intacto.
Una carga previa, cero scopes publicados: sin importación/corrección de datos reales,
sin borrar fuentes o lotes, sin usar sesiones reales del dueño para probar.

Próximo paso: recargar Importaciones y reintentar el REV con la misma configuración.
El registro debe mostrar sus alcances/errores antes de preparar o publicar. Los errores
reales del archivo siguen bloqueantes. La prueba de upload remoto autenticado queda
para la sesión del dueño; no se declara importación financiera real validada.

## Última etapa: carga de varios custodios habilitada — 2026-11-17

Implementación terminada y habilitada en Supabase/Vercel de GMA por el pedido de
eliminar el bloqueo de un custodio y su continuación expresa. La pestaña histórica
admite AUM+REF o Revenue completos; no requiere separar por custodio. Header
revisable, referencia privada congelada, padres/particiones, capacidad ampliada,
excepciones y publicación conjunta conservan las reglas financieras. Ver imports.md.

Verificado localmente: 37 unitarias, lint/typecheck/build, suite SQL completa y HTTP
integral con Next/PostgreSQL reales y transportes Auth/Storage sintéticos. Chrome:
formulario multi, preparación sin errores, REF privado, móvil/escritorio. Diagnóstico
real sólo lectura: todos los datos AUM se enrutan con REF/catálogo completo y se
mantienen los errores de tipo/datos sin autorizar publicación.

Migración remota 20261117224406 aplicada, funciones/ACL/membresía verificadas; cero
cargas y scopes publicados antes/después. Despliegue dpl_6gT2MXhKVy1NsWn3YVoJVq7JNvWi
READY en gma-software.vercel.app. Publicado desde snapshot explícito de 85 archivos
de runtime (651.827 bytes), sin .env, fuentes financieras, tests o docs. Huella:
d98a9aacd8eba923739cb150267c173454865e3a35a32cb91837daeb8e04e8cd.
El despliegue inicial se hizo desde el workspace sobre fa2c8f4, antes de commit/push;
no equivale a ese commit limpio. El dueño pidió después sincronizar los cambios a
main: esta entrega incorpora código, migraciones ya aplicadas, pruebas y continuidad
documental para que los siguientes despliegues desde Git conserven la funcionalidad.

Smoke remoto de /importaciones retornó login español sin error interno; no se usó
sesión del dueño. Intento adicional de API bloqueado por Vercel Authentication al
reusar share link: no se declara prueba remota de autorización API o de upload.
Los guards y la historia se verificaron en SQL remoto y circuito sintético local.
Clúster y servidores locales de QA cerrados. Fuentes originales sin modificar/importar.

Próximo paso para el dueño: recargar Importaciones → histórica → AUM y adjuntar
bd_AUM + bd_REF, o elegir Revenue y adjuntar bd_REV. Registrar códigos faltantes
mostrados por el análisis y revisar las incidencias; identificadores numéricos,
importes ausentes y errores Excel siguen bloqueando publicación. No pedir elegir
un único custodio para esos archivos. Master/comisiones queda fuera de este cambio.

## Última etapa: análisis privado de fuentes reales — 2026-11-17

El dueño confirmó que pudo crear custodios tras la corrección remota. Luego entregó
los cuatro Excel para analizar estructura/correspondencias, sin pedir importarlos.
Se inspeccionaron en modo de sólo lectura, sin fórmulas, cambios de libros ni remotos.
REF acredita pares consistentes para todas las cuentas de AUM; Broker es custodio
por confirmación expresa. Corte Master confirmado 30/09/2026. Encabezados desplazados,
auxiliares/notas, catálogo incompleto, capacidad y excepciones documentados en
[source-import-analysis.md](source-import-analysis.md). Informe detallado privado
entregado fuera de Git, sin publicar montos, cuentas o nombres reales en el repositorio.

Verificados recuentos y cruces con XML/Decimal y lector independiente; conservación
de filas/totales AUM al particionar. Importador actual confirmado insuficiente para
estos archivos. No se modificó aún la aplicación ni se validó una importación real.

Próximo prompt: «Implementá localmente el flujo de source-import-analysis.md:
referencias REF primero y carga histórica AUM/Revenue completos con varios
custodios, encabezados revisables, excepciones, capacidad medida y publicación
atómica versionada; verificá con fixtures sintéticos, sin desplegar ni importar
los archivos financieros reales». Master permanece como snapshot separado.

> Actualización vigente de comisiones (2026-11-17): ver [commissions.md](commissions.md).
> El nuevo pedido autoriza motor trimestral Balance × tasa anual /4 y conciliación
> local revisada. Supera para este motor las restricciones de sólo planificación
> y la fórmula ACT/365 anteriores; el helper aislado previo se conserva sin integrar.

**Estado vigente — 2026-11-17:** AUM histórico multiperíodo implementado localmente sobre el importador existente, con operación padre/manifiesto y publicación conjunta atómica. Validación sintética local; migración sin aplicar remotamente. Ver cierre de esta etapa y `validation.md`.

Actualizado: 2026-11-15, Buenos Aires. **Etapa 10: GitHub/Vercel conectados; Supabase Free/São Paulo con ocho migraciones; Preview READY y controles anon/lector reales verificados.** El dueño dejó SMTP pendiente: sin invitación ni primer administrador operativo. Publicación remota, datos reales, producción y recuperación completa pendientes. Los apartados anteriores son registros históricos.

## Etapa 0 — Contexto y reglas

Estado: completada y verificada documentalmente. Registro histórico; la etapa 1 se completó a continuación por solicitud expresa del usuario.

### Inspección inicial

- Directorio de trabajo: `/Users/franciscolang/projects/app-papa`.
- `ls -la` y `rg --files --hidden` mostraron una carpeta vacía, sin trabajo previo.
- Se buscaron `AGENTS.md` dentro del proyecto y en sus directorios ascendentes; no se encontraron instrucciones existentes.
- `git status --short --branch` informó que no es un repositorio Git. No se inicializó Git en esta etapa.
- Se leyó completa la guía `/Users/franciscolang/Downloads/app-papa-plan-prompts-codex.md`. Incluye los 29 headers de Revenue; no hace falta pedirlos para documentar el esquema.

### Entregado

- `AGENTS.md`: continuidad, reglas financieras, identidad, publicación, permisos, privacidad, límites y cierre por etapa.
- `docs/product.md`: objetivo, propuesta de MVP, contratos completos de AUM/Revenue/FA, definiciones y criterios futuros de aceptación.
- `docs/decisions.md`: confirmaciones, propuestas explícitas, supuestos provisionales, pendientes de negocio y accesos.
- Este archivo: evidencia de la inspección, alcance realizado y próximo prompt.

### Verificaciones ejecutadas

- Lectura y revisión de los cuatro documentos para comprobar consistencia de alcance, reglas y separación entre confirmado y propuesto.
- Comparación automatizada, en orden y con igualdad exacta, de los headers documentados contra la guía: AUM 6, Revenue 29 y FA 7.
- Comprobación de que solo existen los cuatro archivos solicitados y de que las referencias documentales locales creadas apuntan a archivos existentes.

### Pendiente y límites

No hay aplicación, dependencias, lockfile, migraciones, fixtures, autenticación, importador, base ni despliegue. No se ejecutaron lint, typecheck, build, pruebas de aplicación, consultas SQL ni verificaciones remotas: todavía no hay implementación para probar. No se inspeccionaron archivos financieros reales, credenciales ni proyectos conectados.

Documentación oficial vigente y compatibilidad de versiones quedan por verificar antes de implementar integraciones; no se declararon verificadas en esta etapa. Las definiciones de negocio abiertas están en `decisions.md`; ninguna bloquea la etapa 0 ni el scaffold local. No se modificaron servicios remotos.

## Etapa 1 — Estructura inicial de la aplicación

Estado: completada y verificada localmente. Registro histórico; la etapa 2 se completó a continuación por solicitud expresa del usuario.

### Inspección y alcance

- Se leyeron `AGENTS.md`, producto, decisiones, progreso y la guía de referencia. No existía `docs/validation.md` ni aplicación previa.
- `git status` confirmó que el directorio sigue sin ser un repositorio Git; no se inicializó ni se hicieron commits.
- Se implementó exclusivamente el prompt 1 solicitado. Ningún prompt posterior fue ejecutado.

### Entregado

- Next.js App Router + TypeScript estricto, con versiones exactas, `package-lock.json`, Node 24 en `.nvmrc`, scripts de desarrollo, producción, lint, tipos y pruebas.
- Navegación: Resumen, Análisis comercial, Cuentas, Importaciones y Configuración. Español, USD explícito, diseño sobrio adaptable, encabezados de montos a la derecha y números tabulares. Estados vacíos separados de los errores; ausencia expresada como no disponible, sin ceros ficticios.
- Radix Themes para componentes/tokens accesibles y Recharts para el contenedor de una serie de AUM sin datos. Sin demo, cifras, cuentas, autenticación simulada, formularios de importación ni acciones de escritura.
- `loading.tsx` con skeleton/anuncio accesible, `error.tsx` con mensaje genérico y `retry()` según la documentación de Next 16.4, y página de ruta inexistente. Sin exponer mensajes internos/payloads al usuario.
- Enlace para saltar al contenido, foco visible, navegación con `aria-current`, tablas con desplazamiento local accesible y reducción de movimiento.
- Configuración validada, cliente de Supabase protegido por `server-only` y acceso de pantallas al estado del entorno. Sin variables → sin conexión; variables inválidas → error; formato válido → conexión sin verificar. Incluso con variables válidas el acceso permanece cerrado y la UI no crea el cliente ni consulta tablas.
- `.env.example` vacío, `.gitignore` para secretos/fuentes, README de instalación, decisiones y referencias oficiales consultadas. Sin secretos ni muestras financieras reales.
- CLI Supabase 3.1.0 instalada: se consultaron `--version`, help raíz, `init --help`, `migration --help`, `migration new --help` y `config --help`. Se ejecutó solo `init`; configuración local reducida y directorio `supabase/migrations` documentado, sin SQL inventado ni aplicado. No se enlazó un proyecto ni inició una base.
- `agentRules: false` evita que Next vuelva a modificar automáticamente `AGENTS.md`; se preservaron las instrucciones originales.

### Verificaciones ejecutadas

- Versiones/engines/peers consultados en npm y documentación oficial de Next, Radix, Recharts y Supabase. Changelog de Supabase revisado, incluido el cambio de destinos/confirmaciones de CLI 3 y retiro de cifrados TLS antiguos. Referencias en README.
- `npm install`, reinstalación limpia con `npm ci`, `npm ls --depth=0`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`: correctos en el estado final del código. El build genera las cinco rutas de negocio y el manejo de ruta inexistente, todas renderizadas por servidor.
- Tres pruebas automatizadas con Node: ausencia/configuración parcial/claves privilegiadas; URLs inválidas/HTTPS/HTTP local; acceso cerrado ante ausencia, error y variables sintácticamente válidas, sin fallback. Todas correctas. Los valores de prueba están identificados como sintéticos.
- `npm run dev` y `npm start` iniciaron correctamente. La reinstalación limpia con el servidor de desarrollo abierto provocó errores transitorios de Turbopack al reemplazar `node_modules`; se reinició el servidor y se comprobaron nuevamente las cinco rutas con 200, sin cambios en el código. Sobre el build de producción local, assertions HTTP verificaron las cinco rutas con 200 y su título, configuración inválida con `role=alert`, configuración sintética válida con «Conexión sin verificar», acceso deshabilitado y ausencia de valores de entorno en las respuestas. Ruta inexistente: 404 y recuperación de navegación.
- Navegador: recorrido de las cinco secciones, estados vacíos y configuración inválida; sin warnings/errores de consola en el recorrido observado. Verificación con build local y servidor de desarrollo, sin base real.
- Pantallas de 320 y 390 px: ancho del documento igual al viewport; en Cuentas, tabla de 680 px dentro de un contenedor de 356 px y estado vacío legible fuera de la zona desplazable. Se corrigió el recorte del estado vacío detectado durante esta revisión. Escritorio: comprobación de ancho 1440 px y revisión visual del layout.
- Teclado: Tab lleva al enlace «Ir al contenido» y Enter enfoca `main#contenido`. Se comprobó la alineación derecha de ambos encabezados monetarios en el DOM renderizado.
- TOML parseado y assertions de configuración: registro público deshabilitado, exposición automática deshabilitada, seeds deshabilitados y ninguna migración SQL presente. Esto no equivale a haber iniciado o probado PostgreSQL/Supabase.
- `npm audit --omit=dev`: cero vulnerabilidades. Auditoría completa: siete avisos moderados transitivos en desarrollo (`typescript-eslint`/`minimatch`). ESLint 9 está deprecado; se conserva por compatibilidad de peers. No se aplicaron upgrades forzados. Detalle y decisión en README y `decisions.md`.

### Límites y pendiente

No se verificaron conexión real, esquema, RLS, Storage, invitaciones, roles, consultas financieras, importaciones ni conciliación con Excel. No hay despliegue, cuentas publicadas ni datos de negocio. Las pruebas no validan cálculos financieros: todavía no existen.

El skeleton y el límite de errores inesperados compilan; no se forzó un fallo de render ni un retardo para probar visualmente `retry()`/Suspense. Sí se probó el error de configuración real de esta estructura. Sin pruebas con lectores de pantalla ni auditoría integral de accesibilidad/seguridad. La auditoría npm es solo una señal de dependencias, no validación total de seguridad.

La configuración PostgreSQL 17 es local y provisional. No hay credenciales reales ni destino remoto validado. Las definiciones comerciales y formatos de archivos siguen pendientes en `decisions.md`; no bloquean esta etapa. Servicios remotos sin cambios. La etapa 2 deberá validar el modelo en una base local o de prueba dedicada con datos sintéticos.

## Solicitud de etapa 2 — Modelo SQL e integridad de los datos

Registro de la solicitud implementada a continuación; no autoriza etapas posteriores.

```text
Implementá el esquema PostgreSQL mediante migraciones versionadas y documentá su diccionario de datos. Verificá prácticas y documentación actuales de Supabase.

Tablas base propuestas: custodians, clients, commercial_groups, commercial_advisors, advisor_group_memberships, accounts, account_identifiers, account_assignments, aum_monthly, revenue_entries, import_batches, import_rows, user_profiles y audit_events. Podés ajustar tablas auxiliares si explicás el motivo.

Requisitos:
- Identidad interna UUID. Los identificadores externos se guardan como texto con su valor original y una forma normalizada no destructiva. Unicidad dentro del namespace/custodio adecuado. Si el custodio de una equivalencia es desconocido y hay ambigüedad, debe quedar pendiente de resolución.
- Cliente, comercial y equipo son conceptos separados. No deduplicar personas automáticamente solo por nombre.
- Vigencias sin solapamientos para la asignación principal de una cuenta y para el equipo principal de un comercial; usar intervalos documentados y límites inequívocos.
- AUM único por account_id + period entre los datos vigentes. period es el primer día del mes. Valor numérico decimal exacto.
- Revenue: todos los campos originales mapeados, payout_broker_usd como indicador principal, período y procedencia. No imponer unicidad por cuenta/mes, ticket ni contenido de la fila. No prohibir importes negativos: podrían ser ajustes.
- Campos ambiguos quedan preservados como texto original hasta validar su tipo y significado. Importes ausentes no se convierten a cero. Porcentajes con convención documentada y valor original retenido.
- Metadatos de importación: fuente, período y alcance, versión, estado, archivo privado, huella, filas, totales, errores y usuario. Conservá también hoja y número de fila.
- Definí cómo versionar/reemplazar importaciones manteniendo sus registros anteriores recuperables y una sola versión activa para cada alcance. La unicidad del AUM vigente debe ser consistente con ese mecanismo.
- Índices justificados para cuenta, período, custodio y asignaciones. Evitá borrados en cascada que destruyan trazabilidad financiera.

Incluí documentación de las futuras consultas agregadas y restricciones que evitan duplicar AUM. Incorporá RLS y permisos mínimos desde el inicio; las políticas completas se cierran en la siguiente etapa. Si creás vistas accesibles, deben respetar los permisos de quien consulta.

Usá una base local o de prueba explícitamente identificada. Verificá migraciones desde cero y restricciones con datos sintéticos: AUM duplicado, Revenue repetido permitido, números iguales entre custodios, ceros iniciales y vigencias solapadas. Actualizá progreso y decisiones.
```

## Secuencia de la guía — etapa 2 completada, posteriores no iniciadas

| Prompt | Entregable |
| --- | --- |
| 2 | Completado: modelo SQL, diccionario e integridad con pruebas sintéticas en PostgreSQL. |
| 3 | Invitaciones, autenticación y autorización efectivas en servidor, base y Storage. |
| 4 | Lectura/validación Excel y preparación, sin publicar datos financieros. |
| 5 | Correspondencias, publicación segura, correcciones y concurrencia verificadas. |
| 6 | Consultas e indicadores agregados, sin duplicar AUM. |
| 7 | Resumen y Análisis comercial sobre consultas verificadas. |
| 8 | Cuentas, detalle y administración comercial con historia. |
| 9 | Exportación y validación integral; `docs/validation.md` con evidencia real. |
| 10 | Entornos dedicados, despliegue autorizado, operación y puesta en uso. |

En la próxima sesión leer los documentos, inspeccionar el estado efectivo y continuar desde la última etapa verificada; no tratar esta secuencia como autorización para avanzar automáticamente.

## Etapa 2 — Esquema e integridad PostgreSQL

Estado: completada y verificada localmente con datos sintéticos. Registro histórico; etapa 3 implementada a continuación por solicitud expresa. Actualizado el 2026-11-11.

### Alcance entregado

- Migración `supabase/migrations/20261111174240_financial_schema.sql` generada por CLI 3.1.0 y completada con 15 tablas en `app_private`. Se agrega `import_scopes` para versionar por fuente/mes/custodio con único puntero activo.
- UUID, equivalencias conservadoras por namespace y custodio, pendientes sin inferencias, entidades cliente/comercial/equipo separadas y vigencias [desde,hasta) sin solapamientos principales.
- AUM decimal exacto y único entre versiones activas mediante unicidad por lote y restricciones compuestas de alcance/cuenta. Revenue conserva sus 29 campos originales y repeticiones legítimas. Procedencia completa por lote/archivo/hoja/fila, originales inmutables y ausencias null.
- Publicación financiera interna invoker, sin acceso de aplicación: lock de alcance/lote, revisión del puntero esperado, validación de filas/total/cobertura, reemplazo atómico e idempotencia. Publicados conservados e inmutables. FA explícitamente bloqueado hasta implementar el flujo revisado de asignaciones; sin fechas inventadas.
- Auditoría de cambios y publicación, sin cascadas ni borrados de historia. RLS forzado, default deny y vistas invoker privadas. No se creó bucket ni se habilitó Storage.
- `docs/data-dictionary.md`, `docs/aggregate-queries.md`, `docs/validation.md`, decisiones, README y guía de migraciones actualizados. `npm run test:db` con runner temporal reproducible y fixtures sintéticos. Sin cambios de dependencias/lockfile ni UI.

### Verificación ejecutada

- Lectura de contexto/instrucciones y estado; sigue sin Git inicializado. Consulta de documentación oficial actual Supabase por MCP y web, changelog, CLI 3 y cambios de PostgreSQL/btree_gist. No se usó la guía para autorizar otras etapas.
- Migración desde cero en PostgreSQL **17.11 Homebrew**, base `app_papa_synthetic` efímera, sin TCP. Contratos mínimos de Auth/roles creados solo en el fixture. Restricciones, transacciones y permisos se prueban en PostgreSQL real; los servicios Supabase no están iniciados.
- Pasaron duplicado AUM, Revenue repetido/negativo/ausente, texto con ceros, custodios diferentes, equivalencias ambiguas, nombres repetidos, vigencias solapadas/adyacentes, período, precisión, procedencia, conciliación fallida, preparación aislada, reemplazo limitado y conservación de historia.
- Dos sesiones concurrentes: una publica, otra rechazada por revisión obsoleta; un solo lote activo y evento publish. Reintento activo sin duplicación.
- Permisos reales: anon sin acceso, authenticated sin edición de roles ni ejecución de publicación; prueba default deny incluso concediendo temporalmente lectura. Vistas invoker y RLS habilitado/forzado comprobados. Restauración de schema-only en otra base vacía correcta.
- Comparación automatizada de los 29 headers de Revenue contra producto/diccionario/SQL, 15 tablas y sin cascadas. `bash -n`, lint, typecheck, 3 pruebas existentes y build correctos.
- `db advisors --type all --fail-on warn` intentado localmente: ECONNREFUSED en 54322, stack no iniciado; no se declara aprobado. Detalle en `validation.md`.

### Pendiente real

Sin muestras, parser, carga, conciliación real, UI de publicación/recuperación, consultas de aplicación, Auth/Storage/PostgREST reales, políticas completas ni despliegue. Bucket privado es un contrato todavía no creado. No se ejecutó migración en un proyecto remoto ni se validó una importación financiera real. No se verificó backup de datos/archivos ni carga representativa. Se conservan pendientes comerciales en decisiones.

## Próximo prompt — 3: Invitaciones y permisos

Referencia para una solicitud posterior; **no autoriza iniciar automáticamente**.

Implementar autenticación por invitación y autorización administrador/lector en servidor, base y Storage sobre el esquema existente. Sin registro público ni autoasignación de roles. Bootstrap controlado del primer administrador, lector con lectura global solo publicada, sin fuentes/payloads/preparación. Crear bucket privado y probar permisos con roles reales en un entorno Supabase dedicado autorizado; vistas/consultas respetan al usuario. Mantener cerrado lo no implementado y documentar verificaciones y límites. No avanzar al importador de las etapas 4–5 por inferencia.

## Etapa 3 — Supabase Auth y autorización

Estado histórico: **implementada y verificada localmente con datos sintéticos.** Etapa 4 solicitada e implementada a continuación. Verificación externa pendiente. Fecha local: 2026-11-11.

### Entregado

- Integración oficial `@supabase/ssr` 0.12.7, versión exacta y lockfile; Proxy de Next 16 con refresco de cookies/encabezados y validación previa al render. Cada página y API vuelve a validar identidad con `getUser` y rol vigente en base.
- Ingreso por OTP sin crear usuarios, aceptación de invitaciones por POST, formularios etiquetados, logout, sesión inválida, sin acceso y errores genéricos. Layout público separado del workspace protegido; Importaciones/Configuración solo admin. Sin cachear ni prerenderizar contenido privado como público.
- Segunda migración: perfiles/sesiones efectivas, RLS, vistas invoker administrativas, RPC publicadas sin originales ni preparación, publicación admin con actor de sesión, auditoría y bucket privado. Rol interno NOLOGIN/NOBYPASSRLS para ejecutar funciones acotadas sin omitir RLS. Sin autoasignación ni cambios de rol por API, sin secretos privilegiados en la app.
- Fuente descargada por API admin y Storage con JWT del usuario; sin enlaces firmados. Fuentes inmutables por políticas restrictivas; versiones anteriores conservadas.
- Config local con registro/anónimos deshabilitados, plantillas OTP/invitación, Storage y correo de desarrollo habilitados. `docs/auth.md` documenta bootstrap por UUID revisado, invitaciones del operador y configuración efectiva alojada pendiente.

### Verificado realmente

- Changelog y documentación oficial Supabase/Next consultados; peers de SSR y árbol instalado verificados. No se inicializó Git: `git status` continúa indicando que no es repositorio.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:db` y `npm run test:auth:http` correctos. Las diez rutas del build son dinámicas. Sin nuevas vulnerabilidades de producción en la auditoría ejecutada; avisos de desarrollo preexistentes se conservan documentados.
- Base PostgreSQL temporal desde cero: pruebas anteriores más matriz anónimo/reader/admin con SET ROLE; consultas y agregados AUM/Revenue, originales, escritura/preparación, publicación/reemplazo con historia, correspondencias, asignaciones, perfiles, auditoría, políticas de archivos y sesión vencida/revocada/deshabilitada. RPC definer con dueño sin BYPASSRLS y vistas invoker comprobadas. Carrera de publicación anterior y restauración schema-only también pasan.
- HTTP sobre Next en producción local con proveedor **sintético** aislado: accesos directos por rol, código OTP sin creación, invitación por POST, rechazo de Server Action desde otro origen, logout real de la acción SSR, descarga/denegación por rol, caché privada y ausencia de claves/tokens en HTML. No prueba a Supabase Auth/Storage/PostgREST reales.
- Advisors local intentado: ECONNREFUSED en 54322; no se presenta como aprobado. Listado read-only de proyectos de los tres enlaces conectados: ninguno dedicado a App Papá. No se leyó ni modificó su base/configuración.

### Pendiente externo y límites

Aplicar migraciones/configuración a destino dedicado autorizado; desactivar y verificar signup efectivo; SMTP y plantillas; invitar y asignar primer admin; probar JWT reales, REST, Storage, revocación y advisors. No hay despliegue ni importación real validada. No se hizo revisión visual en navegador ni prueba con lector de pantalla en esta etapa. Evidencia y pasos reproducibles en `validation.md` y `auth.md`.

## Próximo prompt — 4: Preparación de archivos

Referencia, **no autorización automática**: implementar lectura y validación de Excel/CSV, preparación y vista previa con trazabilidad y permisos admin, sin publicar; contrastar formatos con muestras reales y mantener originales privados. Resolver accesos dedicados y verificaciones externas pendientes antes de usar datos reales. No avanzar a publicación/indicadores por inferencia.

## Etapa 4 — Preparación de AUM, Revenue y FA

Estado: **implementada y verificada localmente con fixtures sintéticos. Última etapa local: 4. Verificación real/remota pendiente. Próximo prompt: 5**, solo por nueva solicitud. Fecha local: 2026-11-12.

### Entregado

- Importaciones admin: original privado, fuente/mes/custodio declarado, delimitador CSV, hoja, convención numérica, mapeo explícito de headers, vista previa y errores por fila paginados, cuentas distintas por referencia principal, sumas/cobertura de control, repeticiones y avisos de hash. Historial de últimas 50 y reanudación. Estados en español, campos etiquetados y tabla Radix reutilizada.
- `.xlsx` y CSV UTF-8 mediante dependencias exactas mantenidas consultadas en registro/documentación. `.xls`/macros/otros formatos se rechazan con conversión desde Excel; necesidad de .xls no confirmada sin muestras. No se ejecutan fórmulas ni macros. Resultado cacheado conserva original y advertencia; ausente/error bloquea con instrucción de recalcular/exportar.
- Validación servidor: 6/29/7 headers contractuales, colisiones/faltantes, identificadores vacíos/numéricos/científicos/calculados, período/custodio incompatible, decimal ambiguo/inválido/ausente. AUM duplicado en cualquiera de sus referencias = conflicto; Revenue repetido preservado; FA contradictorio/ambiguo pendiente, sin inferir personas, equivalencias o vigencias. Otros campos/porcentajes Revenue se conservan hasta acordar significado. Decimales y sumas exactos con texto/BigInt; null distinto de cero.
- Máximo 2 MiB de original, 12 MiB XLSX expandido, 5.000 filas por hoja, 64 columnas, 10 hojas; límites adicionales documentados. Parser completo acotado por petición y persistencia reanudable hasta 250 filas/~1 MiB, con transacción/cursor/configuración fijada, sin fire-and-forget. Originales por posición + hoja/fila, tipo/fórmula/caché y archivo en Storage, lote/actor/auditoría.
- Tercera migración generada por CLI: registro por alcance/versionado/idempotencia, RPC invoker de chunk, índice de hash no único, `preparation_only` y trigger que prohíben ready/revisión/publicación/desactivar bandera por UPDATE. Ninguna escritura en hechos financieros ni punteros publicados. Dashboard sigue sin consumir preparados.
- Fixtures sintéticos CSV/XLSX de las tres fuentes y casos problemáticos. `docs/imports.md`, decisiones, diccionario, validación, README y guía de migraciones actualizados. No hay Git inicializado; no se hicieron commits ni cambios remotos.

### Verificado realmente

- Lint, typecheck, 13 pruebas unitarias, build, HTTP de producción local y prueba de PostgreSQL temporal desde cero correctos. Producción npm audit sin avisos; árbol compatible/lockfile conservado. Sin nueva reinstalación limpia ni prueba remota.
- PostgreSQL real con contratos Auth/Storage sintéticos: permisos por rol, exactitud, reintento de carga/chunk, congelación, rollback, Revenue repetido, hash por alcance y bloqueo de publicación/promoción. Pruebas anteriores de concurrencia/publicación e historia siguen pasando.
- HTTP con proveedor sintético: carga original/preview, total Revenue exacto 0.15, ceros, tres filas sin deduplicar, 251 filas en dos peticiones con reanudación, configuración fija, paginación, límites/formatos, orígenes, roles y aislamiento del dashboard.
- Chrome: revisión visual de formulario e historial/vista previa; ancho de documento 390 px con viewport 390 px, sin desborde global; ajuste de espaciado y tabla. El selector de archivos automatizado quedó limitado por permisos de la extensión, que no se cambiaron. La carga completa se verificó por HTTP. No se probó con lector de pantalla.
- XLSX sintético de 5.000 filas: lectura/validación final ~133 ms local; no benchmark de hosting ni volumen real. Advisors local falla por stack no iniciado (ECONNREFUSED); no se declara aprobado. Detalle reproducible y límites en validation.md.

### Falta y cierre

Sin muestras financieras reales identificadas, Supabase dedicado, servicios Auth/Storage/PostgREST efectivos ni despliegue verificado. Para datos reales hacen falta formatos/cobertura/correspondencias y definiciones comerciales, permisos reales y conciliación con Excel. Los ceros ya perdidos en texto no son completamente detectables. No se publicó ningún dato financiero ni se avanzó a la etapa 5 por inferencia.

## Etapa 5 — Correspondencias, conciliación y publicación

Estado: implementada y verificada **localmente con datos sintéticos**, por solicitud expresa. Sin servicios Supabase efectivos ni archivos reales conciliados. No se avanzó al dashboard.

### Implementado

- `/correspondencias` para administradores, con navegación y acceso en Proxy/página/API/RPC/RLS. Historial reciente o apertura por UUID, filas paginadas, originales de ambas referencias FA/AUM, ACCOUNT/CUSTODIO Revenue, coincidencias exactas acreditadas y evidencia, cuenta/custodio destino, conflicto visible y resolución explícita. No se unen fuentes por número/nombre: el administrador elige el mismo UUID según evidencia. La falta de custodio FA exige selección expresa, sin inferencia.
- Owner Name payout y Broker conservados; columna comercial configurable/confirmada por entrega FA y mapeo expreso de persona, sin fusionar nombres. Vigencia [desde,hasta) obligatoria; OLD Owner sigue siendo referencia sin fecha. Política de atribución al cierre mensual. Nueva tabla `fa_rows` con asignaciones por versión; evita solapamientos contra FA activos y asignaciones manuales. Meses sin cobertura quedan sin asignar, incluidos y visibles en la conciliación global.
- Alcance de una fuente, mes completo y custodio: elección inicial y confirmación antes de dejar listo. Multi-custodio/período bloquea sin filtrar ni descartar. Cero filas no publicable ni reemplazo válido, aun mediante confirmación genérica. Documentado tratamiento de meses sin movimientos, suma cero y omisiones.
- Cuarta migración generada por CLI. Resolución auditada (`row_resolutions`), materialización transaccional de hechos y comparación archivo/candidata/activa: filas, multiplicidad de cambios, valores, totales numeric como texto, misma huella y cobertura sin comercial. Se preservan las 29 columnas Revenue por header/posición, aunque cambien de orden.
- Promoción restringida de preparation_only, revisión congelada con token/actor/versión esperada, publicación atómica e idempotente y reemplazo del único puntero de alcance. Lock transaccional común más locks de alcance/lote; revisión obsoleta obliga a revisar de nuevo. La versión anterior queda íntegra y superseded se deriva del puntero. Recuperar implica reimportar como versión nueva; no se permite resucitar historia por retry.
- Escrituras API directas de tablas/vistas financieras y aliases revocadas. Wrappers invoker con implementaciones privadas del ejecutor NOLOGIN/NOBYPASSRLS y checks de admin/sesión/RLS. Auditoría de resolución/revisión/publicación y reemplazo con punteros antes/después. Endpoint JSON hasta 16 KiB, origen validado y no-store. Sin dependencia nueva ni cambio de lockfile.

### Verificado realmente

- `npm run lint`, `npm run typecheck`, `npm test` (13/13), `npm run test:db`, `npm run build`, `npm run test:auth:http`, `node --check scripts/test-auth-http.mjs` y `bash -n scripts/test-database.sh`. Detalles y límites en validation.md.
- PostgreSQL temporal desde cero con todas las migraciones: doble clic/retry sin duplicar montos/eventos, mismo archivo como candidata versionada, corrección acotada y preservación del otro custodio/historia, revisión obsoleta, fallo inyectado después del cambio de estado/puntero con rollback total, cuentas sin asignación, AUM duplicado tras resolución, FA sin fechas/custodio bloqueado, solapamientos y atribución por cierre sin retroactividad.
- Concurrencia por la RPC pública en sesiones de **dos administradores distintos**: una versión publica y la otra falla por revisión obsoleta. Dos sesiones sobre el mismo lote reciben éxito y generan una sola publicación. Continúan pasando suites anteriores y restauración de esquema vacío.
- HTTP de producción local con proveedor sintético: permisos/origen/límites/dispatch de gestión, respuesta 409 de revisión obsoleta traducida, Correspondencias protegida y regresiones de preparación/login/fuentes. Motor financiero, RLS/locks y atomicidad se prueban en PostgreSQL real; el proveedor HTTP no acredita servicios Supabase.
- Advisors local intentado: ECONNREFUSED 127.0.0.1:54322 (stack Supabase no iniciado). No aprobado. Git sigue sin inicializar; sin commits ni cambios remotos.

### Falta antes de uso real

Supabase dedicado con migraciones aplicadas, servicios Auth/Storage/PostgREST y roles efectivos; advisors y revisión operativa de propietarios/grants, muestras privadas y conciliación de un período real. No se realizó nueva revisión visual en navegador/lector de pantalla de Correspondencias, carga de volumen representativo ni caída real del hosting. No se leyó ni publicó información financiera real. El lock común y la resolución fila por fila son límites deliberados del MVP; las sugerencias de pantalla son recientes/acotadas, no un catálogo completo.

## Próximo prompt — 6: Consultas e indicadores

Referencia para una solicitud futura; **no autoriza ejecutar ahora**.

Implementá las consultas de negocio sobre versiones activas. Agregá AUM y Revenue por separado antes de relacionarlas; AUM de rango solo al cierre del último mes seleccionado y Revenue sumado en el rango. Preservá cuentas con una sola fuente, faltantes y sin asignación en los totales. Usá la política al cierre mensual y FA versionado con fechas explícitas; no uses OLD Owner ni FA actual como historia inferida. Mostrá cobertura por fuente/período/custodio y datos sin clasificar. Decimales exactos y proyecciones seguras para admin/lector, sin originales para lectores. Probá cifras con fixtures y conciliación; no desarrolles todavía el dashboard ni agregues advisory, rendimiento o ratio Revenue/AUM. La validación real con muestras y servicios dedicados sigue pendiente.


## Etapa 6 — Consultas agregadas e indicadores, 2026-11-13

Estado: implementada localmente con fixtures sintéticos por solicitud expresa. Sin dashboard conectado ni validación real/remota.

### Entregado

- Quinta migración y RPC común `aggregate_report`, con fuentes activas agregadas por cuenta/mes antes de relacionarlas, atribución histórica al cierre, todos los filtros tipados/parametrizados, totales independientes de página, series, cobertura y desgloses por cuenta/custodio/equipo/comercial/cliente/servicio. Preserva solo-fuentes, negativos, ceros y sin asignar.
- AUM exclusivamente del último mes; Revenue sumado según cada cierre histórico. Variaciones contra calendario anterior con población comparable e importes presentes; porcentaje N/D ante base ausente/cero. Cuentas/clientes definidos por presencia, sin actividad inferida.
- Proyección segura bajo perfil/sesión/RLS para lector y admin, sin originales. Adaptador servidor reutilizable y `/api/consultas` privado con JSON o CSV de la misma página, validación estricta, máximo 250 filas y revisión obligatoria en siguientes páginas para detectar cambios. CSV conserva precisión y neutraliza fórmulas de texto.
- `docs/aggregate-queries.md` documenta contrato, ejemplos, cobertura observada frente a expectativa no confirmada, precisión, límites de cliente/servicio sin historia, índices existentes y candidatos condicionados a planes medidos. Sin dependencias ni índices nuevos.

### Verificado realmente

- Verificaciones y evidencia de esta etapa en `validation.md`. Pruebas financieras/RLS en PostgreSQL temporal; proveedor HTTP sintético solo prueba el cableado Next y fronteras de acceso.
- El fixture pedido da A=100/10 en enero y cierre 120/Revenue 22 en ambos meses. Se concilian importes de todos los desgloses bajo los filtros. Series, faltantes, cambio de equipo, FA publicado, repetidos, ajustes y ausencia de arrastre tienen assertions.
- No se creó Git ni se modificaron proyectos remotos. Advisors local no disponible: stack Supabase sin iniciar.

### Pendiente y próximo prompt

Acordar cobertura esperada, muestras privadas, correspondencias y vigencias reales; aplicar migraciones y verificar PostgREST/Auth/Storage en un destino dedicado autorizado; conciliar un período real. No se acredita capacidad con volumen real.

**Próximo prompt — 7 (referencia, requiere nueva solicitud):** implementar Resumen y Análisis comercial consumiendo exclusivamente esta capa; filtros compartidos en URL, total/series/desgloses coherentes, cobertura y N/D visibles, sin recalcular finanzas en JS. Mostrar el equipo histórico y los datos sin asignar; verificar navegador/accesibilidad. No agregar advisory, rendimiento ni ratio Revenue/AUM. Exportación completa y su interfaz podrán usar el mismo contrato por páginas sin mezclar revisiones.


## Etapa 7 — Resumen y Análisis comercial, 2026-11-13

Estado: implementada y verificada localmente con el fixture sintético, por solicitud expresa. Sin importación real conciliada ni despliegue remoto.

### Entregado

- Resumen conectado exclusivamente a `aggregate_report`: tarjetas con período/comparación, AUM al cierre, Revenue del rango, variaciones mensuales aprobadas, cuentas/clientes con AUM y cuentas con Revenue. Acumulado/variaciones distinguidos; comparaciones no definidas permanecen N/D.
- Series mensuales AUM y Revenue separadas, escalas independientes, cero visible para negativos, faltantes sin conectar ni convertir en cero, etiquetas N/D y detalle exacto accesible.
- Análisis comercial: distribución por custodio y rankings por equipo/comercial/cliente, tabla y navegación al detalle agregado por cuenta. Orden por AUM global y participaciones exactas antes de paginar en una extensión SQL verificada de la misma RPC. Negativos/importe ausente/base no positiva inhiben participación por fuente. Sin asignar conserva cifras.
- Filtros compartidos y persistidos en URL, entidades por UUID, limpiar y enlaces entre vistas/detalle; páginas con revisión para evitar mezclar publicaciones. Totales de la consulta completa, nunca sumas de la página. Formularios, tablas desplazables y disclosure con teclado; USD, MM/AAAA y hora Buenos Aires.
- Cobertura por fuente/mes/custodio, filas con/sin importe, cuentas sin foto, cuenta-meses sin Revenue, cuentas sin comercial/equipo/cliente y desglose mensual; fecha de publicación y consulta separadas. FA/cobertura esperada no confirmadas, sin afirmación de completitud.
- Arnés reproducible `npm run test:dashboard [-- --serve]`: PostgreSQL temporal real, el fixture SQL común, rol lector y Next de producción; Auth/HTTP sintéticos fuera de la aplicación. Sin fallback, datos reales, dependencias nuevas, Git inicializado ni cambios remotos.

### Verificado realmente

Lint, tipos, 19 unitarias, suite PostgreSQL desde cero/concurrencia/restauración, build, regresiones HTTP y arnés SQL→Next→HTML/API correctos. Chrome: cuenta A 120/22; global 119/38; equipos históricos 120/12 y N/D/10; drilldown; página de un registro conserva global; negativos; marzo/abril faltantes; cobertura; carga, vacío y error distintos; limpiar; teclado; 320 y 390 px sin desborde global. Se corrigió y revisó el dominio de barras negativas. Evidencia y pasos en `validation.md`.

Advisors local falla por stack Supabase sin iniciar; no aprobado. Sin validación de servicios efectivos, Excel real, producción, volumen representativo ni lector de pantalla. Las opciones observadas se limitan a 100 por dimensión y las cuentas se identifican por UUID en esta etapa. El detalle implementado es agregado; historia, identificadores y originales de cuentas no se adelantaron.

### Próximo prompt — 8 (referencia, requiere nueva solicitud)

Implementar el listado y detalle completo de Cuentas, búsqueda con ceros iniciales, filtros/paginación y navegación desde el dashboard; identificadores por namespace, series/Revenue y procedencia según permisos. Incorporar la administración mínima de entidades/asignaciones con vigencias, efecto histórico revisable y auditoría, sin edición manual de importes ni borrado de historia. Conservar las definiciones y la RPC verificadas. No ejecutar exportación integral, despliegue ni otras etapas por inferencia.


## Etapa 8 — Cuentas y administración mínima, 2026-11-15

### Implementado

- `/cuentas`: búsqueda literal por identificadores conservados como texto y nombre de cliente; filtros compartidos, páginas con revisión, orden por identificador/cliente/AUM/Revenue y desempate UUID. Incluye cuentas sin datos o con una sola fuente y desactivadas. Comercial/equipo se etiquetan como referencia al cierre; aviso ante cambios en el rango.
- `/cuentas/[id]`: identificadores explícitos por fuente/namespace/custodio; historia mensual del rango con AUM y Revenue agregados independientemente y atribución al cierre; asignaciones manuales/FA activo y membresías con fechas; procedencia y versión de AUM/Revenue; registros Revenue paginados sin deduplicar. Originales inertes, headers del archivo, nombre/hoja/fila solo para admin. Cuentas/aliases exclusivos de preparación quedan ocultos al lector, también por URL directa y catálogos; identidades de versiones publicadas reemplazadas conservan su procedencia. Lectores reciben proyección publicada y referencias UUID, sin originales ni archivos. Filtros de entidades/rango se conservan desde rankings y navegación; meses fuera del filtro comercial se marcan como contexto.
- Configuración consultable por lector; edición admin de clientes, custodios, equipos, comerciales, membresías, asignaciones manuales y clasificación/estado de cuentas. Cuentas nuevas por importación. Desactivar conserva historia y no cambia atribución. Asignaciones se cierran con hasta exclusiva. FA publicado se corrige por importación versionada.
- Migración `20261115174622_accounts_administration.sql`, generada mediante CLI: estado active, bloqueo de borrados, revocación de escrituras directas del modelo incluso para admin API, RPC de consulta y gestión con RLS/ejecutor acotado. Preview aplica la operación dentro de una subtransacción que revierte cambios y auditoría; muestra antes/después y todos los cuenta-meses afectados de versiones activas, sin modificar importes. Guardar requiere token del mismo autor y revisión global vigente, vence a los 30 minutos, usa lock compartido con publicación y es idempotente. Cada cambio guarda quién/cuándo/antes/después/motivo; no hay edición de importes ni roles.
- Sin dependencias nuevas, cambios de lockfile, Git inicializado, datos reales ni cambios remotos. Guías Ponytail, Supabase/PostgreSQL y checklist React aplicadas. La guía externa se usó solo como referencia del próximo prompt, sin ejecutar otras etapas.

### Verificado realmente

Lint, typecheck, 21 pruebas unitarias, build de producción, suite PostgreSQL desde cero con siete migraciones y restauración, regresiones de Auth/HTTP y recorrido Next → RPC → PostgreSQL temporal correctos. Casos nuevos: ceros 0001, aliases sin multiplicar, fuente ausente, historia de equipos, originales según rol, revisión sin mutación, guardado/retry único, revisión obsoleta, solapamientos manual/FA, referencias inexistentes/inactivas, bajas sin borrar historia y llamadas directas del lector denegadas. Evidencia y recorridos de navegador en `validation.md`.

Advisors local intentado: ECONNREFUSED 127.0.0.1:54322; no aprobado. Sin Supabase Auth/PostgREST/Storage efectivos, archivos reales conciliados, volumen representativo ni despliegue. Opciones de filtros hasta 100 observadas; sugerencias administrativas hasta 250 con ingreso alternativo por UUID. Preview bloquea cambios de más de 5000 cuenta-meses y requiere ampliar el circuito si el volumen real lo demanda. Búsqueda/orden organizan el directorio; cobertura general conserva los filtros de rango y entidades, con etiqueta explícita.

### Próximo prompt — 9 (referencia, requiere nueva solicitud)

Implementar una exportación simple del resumen filtrado y la tabla comercial con período, filtros y definiciones; conservar permisos, precisión decimal y protección de textos contra fórmulas. Verificar de punta a punta el circuito de importaciones versionadas, conciliación, dashboard, cuenta, exportación, correcciones por custodio, concurrencia, historia comercial, faltantes y roles. Actualizar `docs/validation.md` con evidencia y límites. No desplegar ni declarar validación con Excel real sin muestras y conciliación.

## Etapa 9 — Exportación y validación integral, 2026-11-15

### Implementado

- Enlaces CSV completo en Resumen y Análisis comercial. Reutilizan `/api/consultas`, la sesión SSR y `aggregate_report`, conservando período, filtros, desglose y revisión mostrada. Hasta 10.000 filas en páginas SQL de 250; supera límite o falla una página → sin descarga parcial. CSV anterior de página y JSON continúan disponibles.
- Metadatos/definiciones, importes/porcentajes exactos, conteos, cobertura, faltantes y sin comercial/equipo/cliente. Texto potencialmente ejecutable protegido con apóstrofo, incluidos controles/caracteres de ancho completo; negativos/cero financieros intactos. Excel requiere importación como texto para preservar números que exceden su precisión nativa.
- Defecto encontrado en el circuito real HTTP→SQL: retry de la misma carga fallaba después del parsing por la configuración añadida a las convenciones. Migración `20261115190934_import_retry_after_preparation.sql`, generada por CLI, compara las convenciones originales, conserva configuración/ID/historia y sigue rechazando cambios de archivo/opciones. Sin cambios de propietario/grants ni nuevos privilegios.
- Arnés `test:dashboard` ampliado: ingreso por formularios/acciones Next con OTP sintético y cookies SSR, carga multipart CSV de FA/AUM/Revenue, parsing real del servidor, resoluciones explícitas, conciliación/publicación por RPC ejecutada en PostgreSQL temporal, consulta/exportación y correcciones. Auth/transporte y bytes de Storage sintéticos; políticas sobre `storage.objects` ejecutadas realmente por rol en PostgreSQL. Sin fallback ni nuevas dependencias, lockfile intacto, Git todavía sin inicializar.

### Verificado

`npm test` 21/21, lint, typecheck y build correctos. SQL: ocho migraciones desde cero, todas las suites, concurrencia con dos sesiones reales, retries, RLS/permisos y restauración schema-only correctos. HTTP: regresiones de autenticación/importación/gestión y exportación completa de 300 filas con fallos en segunda página/límite. Circuito con PostgreSQL: cuenta 120/22 coincide en resumen/ranking/detalle/CSV; cambio de equipo conserva enero10/febrero12; corrección aislada, versiones/fuentes anteriores y archivo inválido comprobados. CSV completo de 253 cuentas (dos páginas SQL), con cero, -0.05, fuentes ausentes y sin clasificación, total Revenue11.44 del custodio B. Navegador descargó resumen y ranking filtrados; se leyeron ambos CSV y dieron 120/22 y definiciones. Evidencia detallada y matriz de diez casos en `validation.md`.

Advisors local nuevamente intentado: ECONNREFUSED en 54322, no aprobado. No se probó Excel real ni Supabase Auth/PostgREST/Storage efectivo, hosting, volumen representativo o recuperación operativa de datos/archivos. Los registros históricos anteriores conservan sus límites a la fecha de cada etapa.

### Próximo prompt — 10 (referencia, requiere nueva solicitud)

Preparar entorno dedicado autorizado, configuración de Auth/Storage, migraciones/bootstrap e invitaciones, despliegue de prueba y operación/recuperación. Confirmar región/plan/presupuesto sin activar costos por inferencia; cerrar mapeos comerciales, namespaces, alcance/cobertura y vigencias con muestras privadas. Conciliar un período real, globalmente y por custodio/cuenta, y repetir el circuito en servicios efectivos antes de puesta en uso. Esta referencia no autoriza despliegues ni recursos remotos.

## Etapa 10 — preparación operativa y destino Vercel, 2026-11-15

**Estado: trabajo local completo; puesta en uso remota pendiente.** El alcance vigente
fue solicitado expresamente. Se conservaron las ocho migraciones, reglas financieras
y lockfile; no se reinterpretó la guía como autorización adicional.

### Entregado

- `docs/operations.md`: ambientes/variables, destinos, planes/regiones pendientes,
  Auth/SMTP/Storage, migraciones y bootstrap existente, invitación/revocación,
  importación por fuente, resolución de errores, corrección y recuperación versionada,
  conciliación, backups separados de objetos privados, restauración y retención sin
  automatizar borrados.
- Plantillas de variables development/preview/production; `.vercelignore` protege
  fuentes/backups/secretos en cargas CLI. Runtime conserva únicamente URL y clave
  publicable, sin credenciales privilegiadas ni prefijos públicos.
- `config/deployment-targets.json` y prebuild: builds Vercel requieren destino revisado,
  referencias Supabase distintas por ambiente, IDs Vercel coherentes, origen HTTPS
  y clave publicable. IDs del proyecto creado registrados para Preview/Production;
  Supabase/orígenes vacíos intencionalmente. No crea recursos ni modifica Auth.
- Benchmark sintético reproducible del parser en seis casos5.000 filas, CSV/XLSX
  AUM/Revenue/FA,20 peticiones por caso con assertions y memoria por proceso separado.
- Por instrucción adicional del dueño se creó el proyecto Vercel **app-papa** en
  **franlang2209-8232**, usando sesión CLI separada autorizada por él en Chrome.
  [Dashboard](https://vercel.com/franlang2209-8232/app-papa), proyecto
  `prj_lPEM6UXsDFB4YBzBs5p1BAKgRHn2`, equipo `team_ckh7dlHz13Q9LyiEOOob04Nx`.
  Creación y enlace local verificados; se corrigió el default Node26.x a24.x,
  framework Next.js, instalación `npm ci`, build `npm run build` y Config
  `VERCEL_ORG_ID` separado en Preview/Production (sin variables Supabase). No se desplegó,
  cambió plan/región, cargó datos ni debilitó protección. Sesión global Watchparty
  preservada; token OIDC generado por link retirado del nuevo `.env.local`.

### Verificación

22/22 unitarias, lint/typecheck/build, SQL desde cero con ocho migraciones y
concurrencia/restauración solo esquema, HTTP Auth/permisos/importación y circuito
Next→PostgreSQL→consulta/CSV correctos. Fallo cerrado de prebuild sin destino
comprobado. Auditoría producción0 avisos. Versiones principales verificadas en npm,
engines/peers compatibles con Node24; dependencias conservadas. Benchmark: mayor
multipart1.855.785 bytes, mayor pico RSS530MiB, mayor petición de parsing459ms;
no incluye hosting/servicios ni acredita volumen representativo. Evidencia/tablas
completas en `validation.md`.

### Falta y próximo prompt

El dueño aún debe identificar/autorizar Supabase dedicado (las tres conexiones
existentes son de otras aplicaciones), región/residencia, plan/presupuesto y volumen
representativo. Hobby Vercel se observó, no se adoptó como plan de operación comercial.
Sin bootstrap, invitación, configuración efectiva Auth/Storage, migraciones remotas,
app URL ni login/publicación/consulta/exportación en servicios reales. Backups de datos
+bytes Storage y restauración aún no ensayados; RPO/RTO/retención pendientes.

**Próximo prompt: continuar esta misma etapa10 con la organización/proyecto Supabase
autorizado y decisiones de plan/región/volumen; configurar ambientes efectivos,
aplicar las ocho migraciones y bootstrap revisado, desplegar prueba aislada y repetir
la matriz de permisos/circuito y recuperación con sintéticos.** Antes de datos reales,
cerrar mapeos comerciales/namespaces, alcances/cobertura, vigencias iniciales y
conciliar un período real contra los Excel privados originales. No repetir etapas1–9
ni usar aplicaciones ajenas como base de prueba.

## Continuación de etapa 10 — GitHub y conexión Git, 2026-11-15

El dueño creó y autorizó [FranciscoLang2209/gma-software](https://github.com/FranciscoLang2209/gma-software)
como destino del código. Metadata GitHub confirmó repositorio público y vacío,
branch predeterminado main y permisos de escritura; `git ls-remote` no devolvió refs.
Se inicializó Git en la carpeta existente, remoto origin explícito y autor con email
noreply de GitHub, preservando configuración global. Revisión de123 archivos:
solo código/docs/migraciones/fixtures sintéticos; `.env` únicamente plantillas vacías,
sin fuentes privadas/sesiones/builds/dependencias ni patrones de credenciales
reales detectados. Esta revisión acotada no es una auditoría integral de secretos.

Commit inicial `185871cb4c54eeac56ba06d6de40ad2bd25ef1e7` subido a main;
SHA remoto y local coinciden. `npm test`:22/22. No se cambió lógica de aplicación,
paquetes ni migraciones. Se conservó CRLF intencional de CSV sintéticos; revisión
whitespace con `core.whitespace=cr-at-eol`. Las demás suites siguen como evidencia
histórica, sin declararlas reejecutadas por esta subida.

El proyecto Vercel conserva ID `prj_lPEM6UXsDFB4YBzBs5p1BAKgRHn2`; al inspeccionarlo
se observó que el dueño lo renombró a **gma-software**. Dashboard vigente:
https://vercel.com/franlang2209-8232/gma-software . No se creó otro proyecto.
El primer intento de enlace Git pidió Login Connection GitHub; se conectó el login
FranciscoLang2209 en la cuenta Vercel correcta mediante navegador. El siguiente
intento aún no pudo enlazar el repo: acceso de la GitHub App en revisión. Estado
final de esta conexión se registra a continuación, después de verificarlo.

Supabase, entornos efectivos, plan/región/volumen y conciliación real permanecen
pendientes. Próximo paso después de enlazar el repo: identificar la cuenta/organización
Supabase autorizada y crear/configurar bases dedicadas con el dueño, sin reutilizar
las tres bases ajenas conectadas ni activar planes pagos por inferencia.

### Resultado de la conexión Git

El dueño confirmó que verificó identidad en GitHub y habilitó el repo en la GitHub App.
Nuevo `vercel git connect` con ID/proyecto/equipo explícitos respondió **Connected**.
Navegador en Settings→Git confirmó **FranciscoLang2209/gma-software — Connected**;
no se conectó WatchParty ni se creó otro proyecto. README/operations apuntan ahora al
nombre vigente. Se actualiza el registro documental en main después del commit inicial.
Los pushes pueden iniciar builds Vercel; el control de destinos continuará rechazando
build remoto sin Supabase/orígenes definidos. No se declara aplicación desplegada ni
login/importación remota validados. Siguiente paso: Supabase dedicado autorizado.

### Primer build Git y autorización de base de prueba

El push documental `2969ec39588e8a98a89c324bd2af368c797754a2` activó el primer
build automático de main en Vercel (dpl_61iXpndFKT4i5zZCLwiwS1BqDww1). Clonó
el repo/commit exactos y completó npm ci; terminó ERROR por el prebuild esperado:
«Completar el destino revisado en config/deployment-targets.json». No se publicó
la aplicación. Se conservó el control, sin fallback ni eliminación de permisos.
Los logs reportaron los siete avisos moderados de desarrollo ya conocidos.

El dueño confirmó proyecto de prueba **Supabase Free ($0)** y región **São Paulo**.
Se eligió el flujo Marketplace de su equipo Vercel correcto: recurso dedicado
`gma-software-prueba`, región `gru1` (Supabase sa-east-1), sin conectar automáticamente
credenciales privilegiadas a los ambientes. No se autoriza producción ni upgrade.
La instalación requiere aceptar los términos de Supabase/Marketplace en el navegador;
no se creó ningún recurso con el intento bloqueado. Resultado final registrado después.

## Base de prueba efectiva — 2026-11-15

El dueño aceptó términos del Marketplace/Supabase y autorizó Free ($0), São Paulo.
Creado **gma-software-prueba**, ref `zwdqnrbqqszjrtkhyqnz`, región gru1/sa-east-1,
PostgreSQL17.11, recurso `store_iP5U3AlzPe9GVYPH`, instalación
`icfg_QRthmbPco8qKjX0cBucBBacq`, organización dedicada
`vercel_icfg_QRthmbPco8qKjX0cBucBBacq` del equipo Vercel autorizado.
Conectado exclusivamente a Preview, sin tocar bases de otras aplicaciones.
La integración generó variables administrativas/públicas; se retiraron todas salvo
SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY. Credenciales de operador fuera del repo/runtime.

Antes de escribir: cero tablas de app, usuarios y buckets. Primera migración aplicada;
la2 se revirtió por ausencia de SET ROLE en el operador no-superusuario. Se corrigió
la precondición en2 (no aplicada) y limpieza al cerrar8 (no aplicada), sin editar1
ni la historia ya aplicada. Las ocho migraciones terminaron correctamente. Assertions
remotas verificaron todas las tablas privadas con RLS forzado, ejecutor NOLOGIN/
NOBYPASSRLS, sin membresías con INHERIT/SET, ningún perfil, bucket privado y límite
2MiB. Auth remoto: signup desactivado por Dashboard y POST signup →422/signup_disabled;
anónimo desactivado observado en UI. Sin datos financieros reales ni invitaciones aún.

Advisors remoto ejecutado:28 WARN de rendimiento (13 auth_rls_initplan y15
multiple_permissive_policies), sin otro resultado. No se declara limpio. Se conserva
el esquema de permisos en vez de mezclar una optimización sin medición de volumen.
Nueva regresión SQL prueba la cadena con CREATEROLE/BYPASSRLS sin SUPERUSER y la
retirada del permiso temporal; además se repitieron las suites existentes.

Se configura Preview para rama `prueba` y Functions São Paulo. Producción conserva
base/origen sin configurar, sin usar la base de prueba. URL Auth, plantillas,
invitación/bootstrap del correo acordado y verificación del despliegue en progreso.

## Cierre de continuación — Preview y límites pendientes

Despliegue **READY**, no producción:
https://gma-software-git-prueba-franlang2209-8232.vercel.app ,
ID `dpl_CwPbBttXMudpc28JHjgMPcN17uhX`, commit funcional
`abdf9997241946e067d6d14bdddfc4f29e60b497`, rama prueba, Node24.x y regiones[gru1]
leídos del API Vercel. Ese alias exacto quedó como Site URL en Auth, sin redirects
adicionales ni comodines. /ingresar200 y API sin sesión401, private/no-store.

Con una cuenta **lectora sintética**, Auth/JWT/SSR/PostgREST/Storage reales:
metadata role=admin no elevó el perfil reader; consulta JSON200 y CSV completo200
con base vacía; fuente API403; sin gestión/publicación ni lectura/listado de objeto
privado. Se subió únicamente `operational-checks/SINTETICO-revenue.csv`, copia del
fixture, para comprobar privacidad real. No es una importación ni tiene hechos
publicados; conservarlo como fuente sintética de control hasta acordar retención.
Perfil de prueba deshabilitado y sesión cerrada; JWT anterior pierde acceso. No se
borraron perfil, usuario, auditoría ni archivo. Sin datos reales ni importes publicados.

El dueño indicó correo para primer administrador (conservado fuera de Git), pero
eligió **dejar SMTP pendiente**. La UI actual de Supabase Free pide SMTP propio o
upgrade para editar Invite/Magic Link; no se eludió la restricción ni cambió el
plan. Las plantillas locales están listas, pero no activas en el servicio. No se
envió invitación ni se ejecutó bootstrap de admin. No se valida OTP/invitación,
publicación/corrección por admin en este despliegue ni conciliación real.

La CLI vercel curl falló al reenviar un flag global y generó automáticamente un
bypass persistente para automatización. Se revocó ese único secreto y se verificó
bypassCount0 y SSO all_except_custom_domains intacto. Pruebas HTTP hechas mediante
OIDC corto del mismo proyecto, sin desactivar protección ni publicar credenciales.

**Próximo prompt:** configurar SMTP autorizado en el proyecto de prueba, activar
las dos plantillas versionadas, invitar al correo ya acordado y ejecutar bootstrap
revisado; completar login, roles, importación/publicación/corrección y conciliación
sintética remota. Antes de reales siguen obligatorios mapeos/namespaces, alcances,
vigencias iniciales y conciliación contra originales. Producción, volumen real,
retención/RPO/RTO y recuperación de base+Storage siguen sin aprobar/validar.


## Base compartida y despliegue Production — 2026-11-16

El dueño autorizó expresamente usar el recurso existente `gma-software-prueba`
(`zwdqnrbqqszjrtkhyqnz`, Free, São Paulo) tanto en Production como en Preview,
y publicar en producción. Esta decisión reemplaza el requisito anterior de bases
separadas para esos dos entornos; no crea recursos ni cambia planes. Ambos destinos
se registran con autorización explícita de base compartida. Se mantienen los controles
de proyecto/equipo, URL, clave publicable y rechazo de credenciales privilegiadas.
Las escrituras de Preview y Production afectan los mismos datos, usuarios y archivos.
SMTP, invitación y bootstrap de administrador siguen pendientes; desplegar no los valida.

Verificación de esta corrección: 23/23 pruebas unitarias, lint y build local completos
correctos. Consulta remota de lectura confirmó 18 tablas con RLS en app_private.
SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY habilitadas en Preview y Production.
GitHub rechazó escritura con 403 y la terminal no tiene autenticación Git remota;
el cambio se conserva como parche. Despliegue directo por API Vercel iniciado desde
fuentes locales revisadas (commit local 5efa945), ID dpl_BmNQ6ZXJWqZ14Dx1xNoghB1gr3tz.
Esto no actualiza main remoto: subir el parche antes de futuros builds Git.
Configuración Auth remota/Site URL no modificada: el conector Supabase disponible
no ofrece esa operación. SMTP, invitación/bootstrap y login siguen pendientes.

Resultado remoto: Production READY, alias
https://gma-software-franlang2209-8232.vercel.app, build ~1m50s.
GET /ingresar devolvió 200 y formulario de correo. No se encontraron logs
error/fatal del despliegue en la ventana consultada de 15 minutos; sin drains.
El fetch autenticado de /api/consultas quedó bloqueado con 401 por la capa
de acceso según el conector; no se declara probada esa API ni login real.


## Nombre gma-software y acceso con contraseña — 2026-11-16

Solicitud vigente: cambiar el título visible y resolver parche GitHub/acceso.
Se aplicó el parche privado `gma-production-shared-supabase.patch`, previamente
comprobado con `git apply --check`, sobre main local limpio `ad3f9b8`.
Incluye destino Production, excepción explícita de base compartida, documentación
y prueba de regresión; conserva todos los controles de destino y credenciales.

Nombre visible actualizado en login, metadata/pestañas, navegación, pie,
monograma GMA y plantillas locales. Login ahora tiene título propio «Ingresar».
El dueño eligió email y contraseña, altas solo por administrador y sin confirmación
por correo. `signInWithPassword` reemplaza las acciones de solicitar/verificar OTP;
validación en servidor, error genérico y cookies SSR. Sin registro público, cambio
de roles ni clave privilegiada en runtime. Ruta de invitación heredada conservada.
La creación de cuentas confirmadas es operación del dueño/operador en Dashboard;
se documenta Auto Confirm User/Admin API `email_confirm: true`, y recuperación
asistida. SMTP no es requisito para este login. No se construyó panel de usuarios.

Verificado en esta continuación: `npm ci` con lockfile intacto; 23/23 unitarias;
lint; build local con TypeScript; `test:auth:http` SINTÉTICO contra Next compilado:
validación rechaza formulario inválido sin backend; contraseña incorrecta y cuenta
inexistente dan mismo error sin cookies; contraseña válida crea cookies; CSRF,
anónimo/lector/admin, invitación heredada, rutas, fuentes privadas, consultas,
preparación y gestión correctos. Node del runtime24.22.1. No se repitieron SQL ni
dashboard: no se cambió modelo financiero/DB. Revisión React aplicada a cambios
TSX: formularios etiquetados, autocomplete de contraseña, estado accesible y
componentes de servidor, sin dependencias nuevas.

Supabase correcto ACTIVE_HEALTHY. Consulta remota de solo lectura confirmó que
la cuenta administrativa solicitada aún no existe y hay cero admins habilitados.
El conector no permite crear usuarios Auth ni modificar Site URL/SMTP; no se
insertaron usuarios directamente en tablas internas ni se modificó Auth alojado.
`docs/auth.md` adapta el bootstrap a cuenta confirmada con contraseña y conserva
lock, UUID/correo verificados, rechazo de otro admin y auditoría. Bootstrap NO ejecutado.

GitHub: main remoto continúa `ad3f9b8`. Crear rama por conector →403
«Resource not accessible by integration», incluso tras reconexión confirmada por
el dueño; metadata de permisos admin/push no acredita token de escritura efectivo.
Git HTTPS `push --dry-run` sin credencial (could not read Username). No se creó
rama remota ni se subió código; se conserva parche actualizado para recuperación.

Vercel proyecto/equipo/Node24 verificados. Despliegue directo Production iniciado
con 68 fuentes revisadas y sin secretos; ID `dpl_mMN5iDaiknnRR6ipMKDnAQEMNuBT`.
No acredita publicación en GitHub ni login real. Resultado final se registra abajo.

Próximo paso: crear cuenta confirmada en el Dashboard autorizado, asignar perfil
admin mediante bootstrap revisado y comprobar login real sin compartir contraseña;
actualizar Site URL al alias Production y redirects exactos. Recuperar permiso
Contents de escritura de GitHub y subir este cambio antes de nuevos builds Git.
No se validaron importaciones financieras reales ni se cambió plan/otra base.


El primer build directo `dpl_mMN5iDaiknnRR6ipMKDnAQEMNuBT` falló al comprobar
TypeScript porque el paquete de despliegue omitía `tests/fixtures/imports/build.ts`,
importado por dos scripts. Se repitió con ese constructor sintético incluido (69
archivos), sin modificar tsconfig ni ocultar errores. Segundo despliegue:
`dpl_8dCYqJipuFNhTxsyBNQniTS9xKhn`. Auditoría `npm audit --omit=dev` remota
contra registry: **0 vulnerabilidades**; instalación completa reportó7 moderadas,
sin actualización de versiones ni afirmación de auditoría de desarrollo limpia.


### Resultado final de esta continuación

Production **READY**, `dpl_8dCYqJipuFNhTxsyBNQniTS9xKhn`, build/puesta en línea
aproximadamente99s. Aliases verificados:
https://gma-software.vercel.app y
https://gma-software-franlang2209-8232.vercel.app . GET autenticado por conector
Vercel `/ingresar` en ambos →200, título «Ingresar | gma-software», encabezado
«Ingresar a gma-software», input password y private/no-store. La comprobación
conector no prueba por sí sola acceso público; protección Vercel no modificada.
El despliegue API informa regiones[iad1] aunque vercel.json pide gru1; no se afirma
coincidencia regional y queda pendiente revisar configuración efectiva del hosting.

El dueño creó la cuenta Auth confirmada con contraseña y avisó. Lectura posterior
confirmó UUID/correo exactos acordados, email confirmado y contraseña presente,
sin leer ni imprimir hash. Bootstrap transaccional de docs/auth.md ejecutado
con lock y comprobación de ausencia de admin; verificación posterior: perfil admin
habilitado y exactamente1 admin habilitado. Responsable: dueño solicita/crea cuenta;
Codex ejecuta bootstrap por conector autorizado del proyecto. Identidad/UUID se
conservan en registro privado fuera del repo, sin contraseña ni tokens.
**El dueño confirmó que ingresó con contraseña y llegó al resumen** en el alias
corto: login real verificado por confirmación del usuario, sin automatizar ni
conocer su contraseña. No valida importación/publicación/corrección remotas.

GitHub permanece bloqueado por permiso de escritura del conector y ausencia de
credencial Git local. No equivale a fallo del código ni se resolvió con la
reconexión realizada. Parche completo de recuperación guardado fuera de Git como
`gma-title-password-production.patch`, en la carpeta privada de trabajo del dueño.
No hacer futuros builds Git hasta incorporar estos cambios. Site URL remota no
modificada por Codex ni leída de nuevo: sigue pendiente confirmarla en Dashboard;
no interviene en el login con contraseña verificado. SMTP queda opcional para
futura recuperación por correo; no está configurado ni necesario para este acceso.

**Próximo prompt:** recuperar escritura Contents de GitHub o autenticar Git,
subir el commit local sin force y verificar igualdad con main; confirmar Site URL
Production en Dashboard y revisar región efectiva. Después, por nuevo alcance,
probar importación/publicación/corrección sintéticas remotas y conciliación real
con muestras privadas. No se amplió a administración de usuarios en la app.

Logs runtime del nuevo despliegue, error/fatal y ventana15m: sin grupos devueltos.
No acredita ausencia de errores fuera de esa ventana ni monitoreo permanente.

## Rediseño UI/UX — etapas 1 y 2, 2026-11-16

Implementado localmente en `codex/ui-ux-dashboard`: base navy/gris, Inter local,
Lucide, navegación por rol, encabezados, tablas e indicadores reutilizables, skeletons
y Resumen ejecutivo con KPIs jerarquizados, filtros compactos, gráficos separados,
exportación y cobertura expandible. Radix y Recharts conservados. El diagnóstico,
la lista de archivos y el plan pendiente están en [ui-ux.md](ui-ux.md).

Verificado: lint, tipos, 23 tests, prebuild/build y prueba HTTP sintética existente.
Revisión visual sintética en Chrome: 320/390/768/1440 px, filtros GET y enlaces,
exportación, navegación lectora, teclado, cobertura, vacío y error sin cifras falsas.
Capturas antes/después privadas y límites en [validation.md](validation.md).
No se ejecutó integración PostgreSQL en este equipo; no se probaron fuentes reales.
No se modificaron modelo, RPC, acceso, RLS ni reglas financieras. Sin push ni despliegue.

**Próximo prompt:** «Revisemos las capturas y el Resumen de las etapas UI/UX 1 y 2.
Ajustá lo observado dentro de ese alcance; no avances a otras secciones sin indicarlo».
Los pendientes operativos históricos de GitHub, región, muestras y conciliación
permanecen independientes de este rediseño.

## Push y continuación UI/UX — etapas 3 a 7, 2026-11-16

El dueño aprobó las etapas iniciales y pidió push a `main` y continuar. Commit
`2475ab1` incorporado mediante fast-forward y enviado sin force. `git ls-remote`
confirma igualdad con `main` remoto; el estado combinado de GitHub indica Vercel
`success`. Resuelto el bloqueo de push histórico; no se modificaron credenciales.

Implementadas en `codex/ui-ux-sections`: Análisis comercial con dimensiones/gráficos,
Cuentas con búsqueda y detalle/historia, Importaciones con etapas y estados,
Correspondencias con conciliación y confirmación destacadas, Configuración con
catálogos/editor/revisión/auditoría. Componentes comunes sin cambiar lógica del
servidor ni precisión financiera; detalle en `ui-ux.md`.

Checks locales: lint, tipos, 23 tests, prebuild/build y regresión HTTP sintética por
rol correctos. Navegador sintético: cambio de dimensión/filtros y exportación,
búsqueda/detalle/regreso, carga/preparación, conciliación/publicación explícita,
preview/save de modelo, restricciones lectoras y 24 combinaciones de ruta/ancho
(320/390/768/1440). Sin PostgreSQL real ni fuentes de negocio; límites en validation.

**Próximo prompt:** «Revisemos las etapas UI/UX 3–7; ajustá lo observado y, cuando
lo indique, incorporá esta continuación a main». La continuación permanece local;
no confundirla con las etapas 1–2 ya publicadas.


## Cierre UI/UX — revisión de main y validación final, 2026-11-16

La solicitud vigente fue revisar los pushes a main y continuar por la etapa
correspondiente. Lectura del endpoint GitHub `branches/main`: SHA
`0f87e48df636d333ea593379986433b92027508c`, igual al HEAD local y a las referencias
locales main/origin/main. Sus dos últimos commits son `2475ab1` (UI/UX 1–2) y
`0f87e48` (UI/UX 3–7). El estado combinado del último commit informa Vercel
`success`, «Deployment has completed». Esto corrige los registros anteriores
que dejaban 3–7 pendientes de push; no acredita un recorrido financiero remoto.

Se continuó con el cierre y validación del rediseño, sin crear nuevas funciones.
Se preservaron los tres archivos con cambios locales encontrados al iniciar:
shell con regiones identificadas, marca con nombre visible coherente y badge de
rol de alto contraste; catálogo con región propia; tablas con un solo contenedor
de desplazamiento accesible y footer con texto más oscuro. La revisión dinámica
detectó contraste 4,25:1 en «Recargar estado y conciliación»; se aplicó `highContrast`
a los seis botones secundarios de preparación/correspondencias, conservando sus
acciones, estados y confirmaciones. Sin cambios en lógica financiera, consultas,
API, SQL, permisos, dependencias ni lockfile.

Verificado con Node 24.22.1: lint, generación de tipos/TypeScript, 23/23 tests,
prebuild/build y regresión HTTP sintética por roles, más `git diff --check`.
Navegador Chrome/Playwright sobre la copia sintética aislada existente:

- axe 4.14.1: 24 combinaciones de rol/ruta/ancho y 14 estados del recorrido,
  sin violaciones detectadas en `.app-shell`; hay verificaciones incompletas
  de contraste de gráficos y encabezados de tabla, sin afirmar conformidad WCAG.
- Scroll con teclado en historia mensual a 390 px: contenedor 324 px, contenido
  836 px, desplazamiento exterior 80 px, interior Radix 0 px.
- Seis rutas × 320/390/768/1440 px sin desbordamiento del documento; filtros,
  exportación, búsqueda/detalle/regreso, preparación, publicación confirmada y
  revisión/guardado del modelo correctos con respuestas sintéticas explícitas.
- Restricciones visuales lectoras y consulta fallida sin KPIs; sin errores de
  consola/excepciones en ese recorrido. Capturas desktop/móvil revisadas.

Evidencia privada y límites detallados en `validation.md`. No se ejecutaron
`test:db` ni `test:dashboard`: faltan `pg_config`, `psql` y `createdb` en este
entorno. Sin importaciones, conciliación de Excel ni sesión de negocio remotas.
Los ajustes de cierre quedan locales en `codex/ui-ux-final-validation`; no se
hizo un nuevo commit, push ni despliegue.

**Próximo prompt:** «Revisá e incorporá a main el cierre de accesibilidad UI/UX
validado en codex/ui-ux-final-validation y comprobá su despliegue». Después, como
etapa operativa separada: recorrido sintético remoto y conciliación real con
muestras privadas, sin inferir definiciones comerciales pendientes.


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


## Login alineado con la UI — 2026-11-16

Solicitud vigente: mejorar el login con iconos y assets nuevos. Completado
localmente: composición de dos paneles con marca GMA, paleta navy/Inter,
ilustración SVG abstracta propia, iconos Lucide, mensajes de sesión/error,
ayuda de acceso y versión móvil compacta. Formulario con mostrar/ocultar
contraseña y botón deshabilitado durante el envío mediante useFormStatus.
Se conserva la Server Action de ingreso y la validación existente.
Sin nuevas dependencias ni cambios en autorización, SQL o datos financieros.

Verificado: ESLint, generación de tipos/TypeScript, 23 tests, prebuild/build,
regresión HTTP sintética y navegador Chrome/Playwright con backend HTTP sintético.
320/390/768/1440 px sin overflow; SVG cargado, campos obligatorios, teclado,
contraseña visible/oculta, pending y error de credenciales correctos. axe sin
violaciones detectadas en esas cuatro vistas; sin afirmar conformidad integral.
Capturas desktop/móvil revisadas en la carpeta privada `login-review`.
No se probó una sesión real ni se ejecutó push o despliegue.

**Próximo prompt:** «Revisemos el nuevo login y, si lo apruebo, publiquemos los
cambios en main y verifiquemos el despliegue».


## Publicación del login autorizada — 2026-11-16

El dueño aprobó el rediseño y solicitó push a main. `git fetch origin`
confirmó que la rama de trabajo parte de `ff286bb`, igual a origin/main,
sin commits remotos pendientes de incorporar. Se conserva la validación local
del registro anterior y se prepara un commit con el login, su asset, prueba HTTP
y documentación, para integrar por fast-forward y enviar sin force.

Próximo paso: verificar el SHA remoto después del push. La validación de una
sesión real y del despliegue permanece separada de las pruebas sintéticas.


## Sin acceso, foco del login y alta admin — 2026-11-16

Solicitud del dueño: alinear Sin acceso con el estilo del producto, corregir las
primeras letras tapadas en el login y habilitar como administrador una cuenta
existente indicada expresamente. Sin acceso usa tarjeta con marca GMA, paleta
navy, iconos, acciones accesibles y mensaje de fallo de logout conservado.
El foco del input se dibuja en el contenedor, fuera del texto; se añadió espacio
interior y flex para ambos campos, conservando el foco del botón de contraseña.

Operación remota completada solo en Supabase dedicado `zwdqnrbqqszjrtkhyqnz`:
identidad/UUID, confirmación y contraseña comprobadas; perfil antes ausente,
ahora `admin`, `enabled=true`. Operación atómica e idempotente con auditoría
existente, verificada por consulta posterior. La identidad personal permanece
en el chat y la base privada, fuera del repositorio. Sin cambio de políticas,
metadatos de Auth, credenciales ni permisos de otras cuentas.

Verificado con Node 24.22.1: ESLint, generación de tipos/TypeScript, prebuild y
build; regresión HTTP sintética por roles y Chrome/Playwright. Login y Sin acceso
a 320/390/768/1440 px sin overflow ni violaciones detectadas por axe. Foco externo,
padding del texto, teclado, campos requeridos, mostrar/ocultar contraseña, pending
y error de ingreso sintético correctos; sin excepciones de página. Capturas
desktop del login enfocado y Sin acceso revisadas. Evidencia privada en
`access-review`, junto a las anteriores de `login-review`.

Sin nueva sesión real con la cuenta, importaciones ni conciliación financiera.
Cambios visuales locales, sin commit/push/despliegue de esta corrección.
**Próximo prompt:** «Publicá las correcciones de Sin acceso y login en main y
verificá el despliegue». El usuario habilitado puede volver al Resumen o ingresar
nuevamente para verificar su acceso real.


## Publicación autorizada de las correcciones de acceso — 2026-11-16

El dueño aprobó los cambios y pidió push a main. `git fetch origin` confirmó
HEAD y origin/main iguales en `b457935`, sin divergencia. Se incorporan las
correcciones visuales y su documentación en un commit sobre main; se conservan
los checks locales/sintéticos registrados arriba. La asignación admin ya fue
verificada por separado en la base dedicada y no requiere migración ni datos
personales en Git.

Próximo paso: confirmar el SHA remoto después del push y verificar el despliegue
de Vercel; una sesión real sigue pendiente de comprobación por el usuario.

## Plan de importación histórica y comisiones — 2026-11-17

Etapa documental completada por solicitud expresa. Checkout local `main`,
`4a25954`, origin configurado a `FranciscoLang2209/gma-software`, árbol inicialmente
limpio; sin fetch ni comprobación nueva del estado remoto. Se inspeccionaron
AGENTS/documentación, las ocho migraciones y el flujo real de carga, lectura,
validación, resolución, revisión, publicación, versiones, reportes y permisos.

Entregado: [historical-imports-and-commissions-plan.md](historical-imports-and-commissions-plan.md),
con inventario por rutas, reutilización, cambios de esquema propuestos, AUM
multiperíodo, modelo trimestral de comisiones, identidad/historia, candidatos de
Revenue, riesgos, decisiones pendientes, etapas y matriz de aceptación.
`decisions.md` registra el alcance documental y las confirmaciones del pedido;
las propuestas de implementación y reglas preliminares no se presentan como aprobadas.

Hallazgos principales: esquema ya versiona por fuente/mes/custodio pero carga
actual exige mes único; falta operación que publique el archivo completo en una
transacción y cierre las RPC de publicación individual para sus hijos. Solo
Payout broker está tipado y confirmado como métrica Revenue, no como cobro de la
comisión. La fecha del saldo y el trimestre aplicable deben separarse; no hay
historia de tasas acreditada ni equivalencia automática beneficiario/comercial.
Capacidad actual 2 MiB/5.000 filas no acredita importación de toda la historia.

Verificado ahora: contenido/consistencia documental, rutas locales y
`git diff --check`. Consultadas referencias oficiales de numeric/RLS y changelog
Supabase; sin cambios de dependencias. No se ejecutaron suites, build, SQL,
importaciones ni pruebas remotas; no se usaron muestras financieras reales.
No se modificó código funcional, migraciones, bases o despliegues.

**Próximo prompt propuesto, requiere nueva solicitud:** «Implementá únicamente la
etapa 1 de `docs/historical-imports-and-commissions-plan.md`: AUM multiperíodo con
el formato largo actual, un custodio declarado, operación padre, manifiesto y
publicación conjunta atómica. Conservá el flujo mensual, versiones, precisión,
permisos y trazabilidad; solo sintéticos, sin bases remotas. Comisiones queda en
planificación». Antes de resultados reales siguen pendientes muestras privadas,
capacidad representativa y definiciones financieras enumeradas en el plan.

## AUM histórico multiperíodo — implementación local, 2026-11-17

Solicitud expresa posterior al plan. Al comenzar: `docs/decisions.md` y este
archivo tenían cambios; `historical-imports-and-commissions-plan.md` era nuevo.
Se preservaron esos cambios y no se recrearon etapas anteriores. Comisiones
permanece en planificación; no se cambió Supabase/Vercel remoto ni se publicó código.

### Implementado

- Pestaña **Importación histórica** en `/importaciones`, conservando mensual,
  Radix y componentes existentes. XLSX/CSV con mes/año por fila; una hoja/custodio
  explícito por archivo, períodos ordenados sin rellenar meses ausentes.
- Previsualización por período: cuentas, AUM exacto, duplicados/errores,
  progreso confirmado por bloques, versión existente y comparación. Resolución
  y revisión mediante correspondencias existentes; retorno enlazado al padre.
- Nueva `import_uploads` y `import_batches.upload_id`: original único privado,
  manifiesto inmutable, coordenadas/huellas, conteos/totales, hojas excluidas,
  errores no enrutables con originales, actores y revisión de todos los hijos.
- Revisión padre y publicación en una transacción reutilizando el publicador;
  todos los punteros o ninguno. Trigger bloquea publicación individual por
  cualquier entrada. Revisión obsoleta, duplicados y errores bloquean el conjunto.
  Reintentos no duplican ni reactivan historia reemplazada; correcciones versionadas.
- RLS admin/sesión, ejecutor acotado, SSR/JWT, Storage sin upsert, auditoría,
  protección de solicitudes y descargas privadas (también original sin períodos
  válidos), errores JSON. Sin service_role en cliente ni logs financieros.
- Pausa/retoma por cursores, recuperación de original con la misma operación y
  configuración, sin marcar hijos fallidos por indisponibilidad temporal del archivo.
  Conserva 2 MiB/5.000 filas, bloques 250/~1 MiB y hasta 120 períodos. Archivos
  mayores se segmentan por meses completos/custodio; un mes mayor al tope requiere
  otra ampliación, nunca publicación parcial ni reemplazos silenciosos.

### Verificado

Lint, typecheck, 27 unitarias, `test:db`, build y suites HTTP de Auth/importación y
Next→RPC→PostgreSQL local. 36 meses × 3 cuentas × 2 custodios; dashboard de rango
cierra en 0.25 sin sumar fotografías; regresión anterior 120 AUM / 22 Revenue,
cuentas, rankings, FA y CSV. SQL con fallo después del segundo puntero, recuperación,
bypass, reimportación/versiones, revisión obsoleta, lectores/anónimos, coordenadas
repetidas/fuera de manifiesto y carreras entre padres con tres scopes comunes.
Dos sesiones no mezclan meses y reintentos concurrentes no duplican auditoría.
Operador administrado sin SUPERUSER, grants/propiedad/RLS y restauración de esquema.
Detalle y límites de evidencia en [validation.md](validation.md).

Capacidad sintética: 4.968 filas/36 meses en CSV de 235.849 bytes, todos los totales
mensuales exactos; exceso rechazado. No equivale a importar una historia real ni
a un benchmark máximo de publicación. Auth/transporte Storage son sintéticos en
los recorridos HTTP; aplicación y PostgreSQL sí son reales locales.

### Pendiente / próximo prompt

Muestras privadas y conciliación de negocio, volumen de historia real y capacidad
representativa; servicios efectivos Auth/Storage; aplicar migración y desplegar
solo con autorización futura. Este pedido prohíbe tocar remotos y se respetó.
No se verificó recuperación completa de un backup financiero/Storage productivo.

Próximo prompt sugerido: «Validá localmente la importación histórica de AUM con
una muestra privada y un volumen representativo, usando el contrato/límites
implementados. Conciliá por mes/custodio, determiná si hace falta ampliar capacidad
de la etapa 2 y documentá resultados, sin modificar remotos. Comisiones continúa
fuera del alcance hasta aprobar sus definiciones».

Cierre final: repetición integral con caída sintética de Storage, lectura sin
original y recuperación de la misma operación aprobada; cambiar hoja del hijo
no invalida la carga. Navegador Chrome 1440/390 px: 36 períodos/progreso 108/108,
archivo inválido sin hijos bloqueado, JSON de errores y original descargados,
sin desborde del documento ni excepciones cliente. Servidores de prueba cerrados
al terminar; evidencia local/sintética detallada en `validation.md`.


## Advisory real por días — cierre local, 2026-11-17

Solicitud: actualizar plan y fórmulas, modelo/migraciones, pendientes y pruebas;
implementar únicamente reglas suficientemente confirmadas. El árbol ya contenía
el trabajo de AUM histórico y documentación sin commit: se conservó completo.

Implementado: helper bruto aislado ACT/365 con decimales canónicos, fracciones
BigInt exactas y bruto de presentación con escala explícita. Tasa ausente/base
ausente conservan pendientes; tasa cero es válida; final siempre null. Sin ruta,
pantalla, importador o tablas nuevas de comisiones ni integración al runtime.

Actualizado `historical-imports-and-commissions-plan.md`: fórmula anterior retirada;
tasas anuales y divisor fijo 365 incluso en bisiesto; política de applicable_rate
pendiente sin equipararla con annual_rate; Assets Billed On acreditado separado
del Balance original; períodos/snapshots/flujos/cálculos, estados, revisiones,
M2/M2b/M3, desglose UI, Revenue comparable y matriz con todos los casos pedidos.
Diccionario, producto y decisiones reflejan alcance vigente sin recrear M1.

Verificado: 31 unitarias (4 nuevas), lint, typecheck, build y revisión documental/
`git diff --check`. Node 24.22.3, solo sintéticos locales; detalle en validation.md.
No se ejecutaron SQL/HTTP/navegador ni migraciones; no se modificaron remotos.

Pendiente: unidad de tasa de celda, equivalencia de saldo, calendario/extremos,
applicable_rate, tratamiento/cobertura de flujos y fees, escala/modo del redondeo
final, elegibilidad/componentes y base comparable de Revenue. No hay final,
prorrateo productivo, deuda ni ingreso definitivo calculados. La prueba de pureza
del helper no acredita auditoría persistida, idempotencia o concurrencia SQL.

Próximo prompt sugerido (requiere nueva solicitud): «Con las convenciones
financieras documentadas y una muestra sintética aprobada, implementá únicamente
preparación de comisiones (M2), reutilizando el importador y las 14 columnas.
Separá Balance de Assets Billed On hasta confirmación; no actives prorrateo,
publicación de fee final ni conciliación sin las reglas/evidencias pendientes.
Sin cambios remotos». AUM histórico conserva sus validaciones/pendientes previos.

## Motor trimestral y conciliación — cierre local 2026-11-17

Solicitud vigente implementada sobre el trabajo local previo, conservado completo.
Motor PostgreSQL `balance_annual_div4_v1` con Balance importado, tasa anual y corte
explícito acreditado por trimestre. Bruto/neto/payout independientes; originales
Excel y comparación propia con bases declaradas. No usa AUM ni extiende snapshots.

Nueva migración `20261117175338_commission_reconciliation.sql`: eventos inmutables,
idempotencia por solicitud, correcciones con revisión previa, clasificación de cada
Revenue vigente y vínculo explícito cuenta/custodio/trimestre/tipo/beneficiario/base.
Preserva multiplicidad, impide doble asignación, serializa revisión concurrente y
marca Pending ante cambios de versión. Estados Matched, Variance, Pending,
Missing expected y Missing actual; este último no acredita deuda del representante.

API `/api/comisiones`, RPC de comando/reporte y bandeja `/comisiones` con todos los
filtros pedidos, paginación, totales sólo comparables por base y conteos de cobertura.
Sólo administradores acceden al análisis revisado/originales; sin proyección publicada
para lectores. La bandeja consulta; la revisión se registra vía API/RPC. Contrato,
fecha de corte y supuestos abiertos: [commissions.md](commissions.md).

Verificado local/sintético: suite PostgreSQL integral con operador sin SUPERUSER,
casos financieros/seguridad, dos conciliaciones concurrentes y reintentos simultáneos,
restauración de esquema; 31 unitarias anteriores, lint, TypeScript y build. Integración
Next→API→PostgreSQL y SSR registrada en `validation.md`. No remotos ni datos reales.

Pendiente: confirmar catálogo Fee type, base económica, corte/fechas, formatos y
métrica real de cobranza con muestras; adaptador XLSX/Storage de comisiones y editor
gráfico no forman parte del motor implementado. No se acredita una importación real.
El helper ACT/365 previo sigue aislado; no se mezcla con la regla solicitada.

Próximo prompt sugerido: «Validá las bases, Fee type, fechas y métricas comparables
con una muestra privada; conciliá un trimestre con el motor local y documentá los
faltantes antes de conectar su adaptador al importador. Sin cambios remotos».

## Comisiones visuales y QA integral — cierre local, 2026-11-17

Implementado sobre el árbol previo sin commit, preservando AUM histórico, motor,
API y documentos existentes. Sin dependencias nuevas ni cambios remotos.

- Cuatro vistas en la navegación existente: Resumen con seis KPIs por base y dos
  gráficos, Por representante con detalle, Por cuenta con snapshots existentes y
  Conciliaciones con evidencia y formulario administrativo de clasificación/vínculo.
- Filtros URL, orden decimal exacto, paginación de 25 filas, cobertura, faltantes,
  vacío/error/loading/sin permisos y adaptación a notebooks/móviles. Balance no
  suma fotos ni componentes repetidos; esperado verificado separado de comparable.
- Migración local `20261117181230_commission_dashboard.sql`: una foto estable SQL
  para agregados/filas/evidencia, mismos controles de sesión/rol/RLS, sin tocar
  historia publicada. Máximo explícito de 10.000 registros, sin truncado silencioso.
- CSV de las cuatro vistas completo con estados, diferencias y procedencia, no
  sólo página visible; revisión obsoleta 409, decimales canónicos, N/D y protección
  CSV injection. Esperados sin verificar se muestran/exportan N/D.
- Revisión usa el comando auditado existente, evidencia y motivo explícitos,
  versiones previas y UUID idempotente conservado ante reintento. Sin asignación
  de beneficiarios por similitud de nombres ni acceso del lector a originales.

Verificado: lint, typecheck, 34 unitarias, test:db con operador sin SUPERUSER,
concurrencia/RLS/restauración de esquema, build y test:dashboard. Incluye cruce de
páginas RPC con 501 movimientos, 27 beneficiarios en UI de 25 filas, CSV completo,
revisión obsoleta, corrección que invalida conciliación y preserva el evento
anterior; recorrido histórico 36 meses × 3 cuentas × 2 custodios, publicación
atómica, regresión 120/22 y corrección aislada. Next/PostgreSQL son reales locales;
Auth/PostgREST/Storage en las suites HTTP usan transporte sintético.

Chrome: cuatro vistas a 1440/768/390/320 px sin desborde del documento ni errores
cliente; navegación de beneficiario, orden/paginación, descarga, guardado auditado
y estado posterior, vacío/error y lector rechazado. Dos trimestres comparables
sintéticos renderizan ambos gráficos a 1440/390. Revisión visual detectó tablas
comprimidas en móvil: corregidas con ancho mínimo/desplazamiento local y padding
de ejes para etiquetas de cierre. Detalle de evidencia y matriz de 14 pasos en
[validation.md](validation.md); contrato visual/CSV en [commissions.md](commissions.md).

**No completo como circuito Excel de comisiones:** los pasos importar archivo y
publicar snapshot sólo cuentan con entradas revisadas vía API/RPC. Falta adaptador
XLSX/Storage y preparación/publicación atómica de archivo completo; también
proyección publicada para lectores. La validación integral está documentada con
estos huecos; no se declara un flujo de importación de comisiones completo ni
una importación financiera real validada. Sin datos reales, despliegue ni aplicación
remota de migraciones. Persisten muestras/conciliación de negocio, volumen real,
identidades ambiguas y comprobación de Auth/Storage efectivos.

Próximo prompt sugerido: «Implementá localmente el adaptador de importación Excel
de comisiones sobre el contrato revisado, con original privado, correspondencias
explícitas, revisión/publicación atómica del archivo y correcciones versionadas.
Completá los pasos 6–8 del QA con fixtures sintéticos y mantené las definiciones de
base/fecha/tasa documentadas, sin desplegar ni cargar información financiera real».

## Aplicación autorizada de migraciones en Supabase GMA — 2026-11-17

Tras el push `fa2c8f4` a main, el dueño autorizó expresamente aplicar las tres
migraciones creadas localmente al Supabase de GMA. Se aclaró el destino porque
no hay Supabase local/Docker activo. Destino único: `gma-software-prueba`,
`zwdqnrbqqszjrtkhyqnz`, sa-east-1, PostgreSQL 17.11.0.019, ACTIVE_HEALTHY.

Aplicadas por el conector Supabase, en orden, sin modificar el contenido SQL:
`20261117133211_historical_aum_uploads`,
`20261117175338_commission_reconciliation` y
`20261117181230_commission_dashboard`. Las ocho anteriores estaban aplicadas y
no se reejecutaron. El conector asignó timestamps de ejecución nuevos; se alinearon
únicamente las tres claves de versión del registro de migraciones con las
versiones originales del repositorio, mediante transacción con precondiciones.
Se conservaron nombre/statements y los ocho registros previos. Lista remota final:
11/11 versiones coincidentes; no se renombraron ni modificaron archivos SQL.

Verificación remota: ambas tablas nuevas con RLS habilitado y forzado; wrappers
públicos invoker; implementaciones bajo ejecutor NOLOGIN/NOBYPASSRLS, sin membresías
activas INHERIT/SET. Anon/service_role sin EXECUTE, authenticated sólo con chequeo
de sesión/rol; sin INSERT directo de eventos ni UPDATE directo de uploads.
Pruebas SQL transaccionales rechazaron anon y authenticated sin sesión. Una prueba
de lectura bajo rol authenticated y claims de una sesión admin existente (selección
interna, sin exponer IDs) ejecutó el reporte completo vacío y rechazó trimestre 9;
rollback posterior. Esto valida SQL remoto, no login HTTP/JWT ni UI desplegada.

Antes/después: cero AUM, Revenue, lotes y scopes publicados; tablas nuevas vacías.
No se importaron muestras ni datos reales, no se alteraron usuarios/sesiones ni
se ejecutó despliegue de aplicación. Advisors: un WARN de protección de contraseñas
filtradas desactivada; rendimiento: 14 auth_rls_initplan y 16 multiple_permissive_policies
WARN, más 38 FK sin índice y 17 índices sin uso INFO. Documentados, sin ajustes de
Auth/planes/índices fuera de esta solicitud; no se declara advisors limpio.

Pendientes funcionales anteriores sin cambios: adaptador Excel/Storage y publicación
de archivo completo de comisiones, muestras/conciliación de negocio, pruebas HTTP
con servicios efectivos y capacidad real. Próximo paso sugerido: completar el
adaptador y QA 6–8 en local con fixtures; esta habilitación de esquema remoto no
acredita importaciones financieras reales ni autoriza a cargarlas.


## Bloqueo de alta de custodios — 2026-11-17

Diagnóstico remoto de sólo lectura: `current_access` reconoce admin, pero los logs
registran `permission denied for schema auth`. El ejecutor no tiene USAGE de auth;
postgres tampoco tiene grant option sobre ese esquema de Supabase. La migración
`20261117200819_restore_executor_auth_usage` se registró remotamente, pero su GRANT
no tuvo efecto (verificado). No se crearon custodios ni datos financieros.

Corrección local lista: `20261117201233_prebind_session_identity.sql`. Helper SQL
estándar BEGIN ATOMIC, SECURITY INVOKER, que resuelve auth.uid al crearse; reemplaza
sólo esa referencia en nueve funciones privadas compartidas, conservando dueños,
ACL, comprobaciones de rol/sesión, RLS y auditoría. Membresía/CREATE transitorios se
retiran en la transacción. No cambia permisos de tablas Auth ni reglas financieras.

Suite SQL local completa correcta, con USAGE auth revocado al ejecutor, incluyendo
crear/revisar/guardar custodio, auditoría, lectores, publicaciones y concurrencia.
Aplicación remota de esta segunda migración RECHAZADA por revisión automática:
alcance compartido de funciones y roles excede autorización específica del alta.
No reintentar ni eludir sin autorización del dueño. Próximo prompt:
«Autorizo aplicar en gma-software-prueba la migración prebind_session_identity,
que ajusta la identidad de sesión en las funciones compartidas de custodios,
importaciones, publicación y auditoría; verificar permisos y resultado».
Después, reintentar alta desde la sesión real del dueño; aún no verificada por HTTP.


## Corrección de custodios aplicada — 2026-11-17

Con autorización explícita posterior del dueño, aplicada prebind_session_identity
en GMA (`zwdqnrbqqszjrtkhyqnz`), versión remota 20261117201233. Archivo local
renombrado para coincidir con la versión asignada por MCP, SQL idéntico al probado.
El rechazo anterior quedó resuelto por esta autorización; no se usaron sesiones reales.

Verificado remotamente: nueve cuerpos sólo sustituyen auth.uid por el helper;
OID, owner, ACL, SECURITY DEFINER/INVOKER y search_path conservados. Helper invoker
con cuerpo preanalizado y EXECUTE exclusivo del ejecutor/owner. Ejecutor sin login,
BYPASSRLS, lectura de usuarios/sesiones ni CREATE; cero membresías transitorias.
Prueba de helper como ejecutor SIN sesión devuelve null y termina en rollback.
Cero custodios antes/después: no se crearon registros por cuenta del dueño.

Próximo paso: recargar Configuración → Custodios, revisar efecto y confirmar GWM
desde la sesión real del dueño. Alta remota por UI aún pendiente de verificación.
No fue necesario desplegar la aplicación. Ver evidencia y límites en validation.md.
