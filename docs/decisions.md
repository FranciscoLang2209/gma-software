# App Papá — Decisiones y pendientes

## Aplicación y publicación autorizadas — 2026-11-24

El dueño autoriza aplicar las dos migraciones pendientes y pushear a main las
Fases 1–8. Aplicadas sólo en GMA: 20261124202626 (REF) y 20261124202631 (panel).
Archivos locales renombrados a las versiones asignadas por MCP, SQL idéntico y
sin reescribir registros remotos. Supera la condición de pendientes de los registros
históricos siguientes; no autoriza reparar identidades ni publicar archivos.
Huellas financieras/relacionales conservadas, ACL/RLS y rechazo sin sesión
verificados. No cambia reglas de negocio ni resuelve cobertura económica.
La sesión/UI remota y los pares ambiguos siguen pendientes; próxima fase: 9.

## Calidad de datos: Fase 8 local — 2026-11-24

Panel administrativo con la sesión existente y RLS, sin acceso del lector a cola,
originales o auditoría. Recuentos separados por fuente y grano; relación técnica
no certifica identidad económica. Cobertura por cuenta/trimestre observado, sin
inventar cuentas esperadas ni interpretar faltantes como cero. Fuentes antiguas
sin identificar permanecen explícitas. Meses no atribuyen fechas a catálogos/REF.

Cola e historiales con páginas de 25 y revisión obligatoria al avanzar; cambios
invalidan la consulta. Imágenes auditadas se transportan como texto PostgreSQL
para conservar numeric exacto. Preparaciones Master solo en Storage no tienen
índice SQL y se retoman por UUID en su circuito existente.

Selección/aprobación individual reutiliza Correspondencias. Operación por lote
solo para Revenue needs_resolution/preparation_only sin errores: mismo ACCOUNT
literal, lote y custodio, alias ya acreditado, evidencia, preview y confirmación.
Se usa manage_import bajo lock/transacción y revisión; no cambia publicados ni
crea equivalencias por similitud. Los dos pares reales siguen pendientes, junto
con el adaptador de reparación de Fase 4.

Migración 20261124202631 local; permanece pendiente junto con la de Fase 5.
Sin acceso/escritura remota, despliegue ni cambios de fórmulas/dependencias.
Contrato y límites en [data-quality-panel.md](data-quality-panel.md).
Próxima fase: 9, estados vacíos diferenciados; detener al completar Fase 8.

## Calidad de datos: Fase 7 local — 2026-11-24

Se completa prevención sobre staging/publicación existentes, sin segundo circuito.
Control común de headers/cuentas para financiero, REF y Master; formatos sospechosos
advierten conservando el literal y ciencia/tipos inválidos bloquean. No se eliminan
ceros, espacios ni caracteres para unir cuentas. El consentimiento numérico previo
se explicita también para REF; no habilita recuperar dígitos o aceptar fórmulas.
No se valida financieramente lo que aún carece de unidades/bases acordadas en REV.

Se fija validationVersion=1 separada del formato parserVersion. Preparaciones en
curso de versión anterior deben conservarse y analizarse de nuevo con otra solicitud;
no se parchea historia ni se mezclan reglas entre bloques. Publicaciones existentes
no se revalidan retrospectivamente. Se mantiene idempotencia dentro de cada versión.
Sin migración nueva, publicación remota o despliegue. Detalles en
[data-import-quality.md](data-import-quality.md). Próxima fase: 8, panel de calidad.

## Calidad de datos: Fase 6 — 2026-11-24

Se validan las reglas existentes, sin modificar fórmula ROA, umbrales Brokerage,
unidades o ponderación Advisory. Referencia anual proporcional ponderada por los
mismos AUM cuenta/mes del conjunto Advisory, no promedio simple de tasas/ratios.
No se compara el ROA mixto con un Fee de subconjunto ni se suplen fotos con Master.
Metodología previa y oráculo independiente en
[data-financial-metrics-validation.md](data-financial-metrics-validation.md).

La conservación de sumas reales pasa para 64 cohortes; sus grupos son incompletos
o sin hechos. Las cuentas matemáticamente comparables no autorizan excluir al resto
ni certificar rendimiento/impagos. Se mantiene pendiente cobertura esperada y
validación económica Payout broker/Fee. La migración REF sigue local y no aplicada;
no hay escritura remota ni cambio financiero en esta fase. Próxima fase: 7.

## Calidad de datos: Fase 5 local — 2026-11-24

Se implementa el diseño REF separado: no sustituye cliente/comercial/equipo
canónicos ni acredita vigencias. Filtros AND por población UUID, con snapshot/fila
de grupo literal y Sin referencia. Cambiar la foto exige reiniciar explícitamente;
no se reasigna una selección antigua. CSV y navegación conservan esa misma base.

Se retira el corte de 100 opciones financieras y se agrega búsqueda local sobre
la lista completa. No se promete un buscador remoto ilimitado; paginar al medir
volumen que lo requiera. Comisiones conserva beneficiarios/bases y su permiso
administrativo. Límites de Correspondencias quedan para su circuito de revisión.

Se agregan RPC versionadas *_ref y se conservan las anteriores, con guards/RLS
existentes. Migración local 20261124202626 pendiente de revisión/aplicación expresa;
sin despliegue. No autoriza fusiones, cambios de hechos ni aprobación de reparaciones.
Node/PostgreSQL locales permiten retomar build/typecheck/suites SQL; no cambian
el stack remoto ni dependencias bloqueadas. Próxima fase: 6, validación de métricas.
Ver [contrato y verificación](data-quality-filters.md).

## Calidad de datos: Fase 4 de preparación — 2026-11-24

Se autoriza preparar dry-run/scripts y rollback, no modificar producción. El planner
local requiere revisión explícita por hecho para proyectar una reasignación existente;
esa revisión JSON no equivale a permiso de sesión ni aprobación remota del dueño.
Todos los manifiestos son no ejecutables. Las colisiones AUM o identidades sin
resolver bloquean el lote; no se publica parcialmente. Se comparan sumas/recuentos/
valores conocidos por fuente/mes/custodio, conservando originales y movimientos.

No se inventa una migración de identidad antes de aprobar los dos pares ambiguos.
La resolución existente bloquea aliases de otra cuenta; aplicar la proyección exige
un adaptador versionado con preservación de dependencias/historia, aún pendiente.
No desactivar triggers ni actualizar hechos publicados para evitar ese control.
Backup/rollback locales son imágenes para ensayo, no recuperación PostgreSQL probada.
Ver [preparación y límites](data-repair.md). Lectura GMA conserva los controles de
Fase 1. Próximo paso de producto: Fase 5; reparaciones reales pendientes de evidencia.

## Calidad de datos: Fase 3 autorizada — 2026-11-24

El dueño solicita explícitamente Fase 3. Se implementa un motor local de propuestas,
sin adaptar aún escrituras/consultas remotas. Las propuestas con alias aprobado
se denominan auto-resolved por clasificación; no significan reparación ejecutada.
No hay normalización automática de cuenta más allá de identidad literal. No usar
el orden de prioridad para ocultar destinos contradictorios; exigir respaldo de
todas las referencias y respetar la relación anterior. Nombres solo sugieren.

Trazabilidad: procedencia, proponente, revisión, versión de reglas y evidencia en
cada resultado. Persistencia y rollback productivo pendientes; no simular un evento
publicado. La fase termina con 67 unitarias/lint/tsc aislado correctos. Fase 4 es el
siguiente paso; producción sigue requiriendo dry-run y aprobación específica.
Ver [motor](data-reconciliation-engine.md) y [plan](data-reconciliation-plan.md).

## Calidad de datos: Fase 2 autorizada por continuación — 2026-11-24

«Continua» retoma el próximo paso documentado: normalización implementada localmente
y diseño de filtros REF separados de vigencias. Ver [data-normalization.md](data-normalization.md).
La búsqueda comparte regla textual; la identidad de cuenta conserva fuente,
namespace, custodio y literal. No se eliminan ceros, espacios ni signos de cuentas.
Se reutilizan UUID/aliases/auditoría existentes; no hay migración nueva en esta fase.

Los filtros REF propuestos usan snapshot/fila representativa y selección de cuentas
mediante EXISTS, sin crear clientes/comerciales ni historia. Es diseño, todavía no
es un contrato aceptado por la API. No se cambian permisos, tasas ni fórmulas.
Los dos pares candidatos siguen sin resolver; producción requiere el dry-run y
aprobación explícita pedidos. Fase 3 es el próximo paso, no iniciada.

## Calidad de datos: alcance de Fase 1 — 2026-11-24

El pedido adjunto ordena comenzar por auditoría de solo lectura y presentar plan
antes de reparar. Esta etapa entrega diagnóstico cuantitativo y SQL diagnóstico;
no ejecuta Fases 2–10. Toda futura modificación de producción exige dry-run con
impacto revisable y aprobación explícita del dueño, según el pedido vigente.

Se conserva la separación entre foto REF y cliente/comercial/equipo canónicos
con vigencia. No se convierte sin_clasificar en Brokerage ni Revenue ausente en
cero. Dos pares con espacios quedan como candidatos de revisión; no se aprueba
trim/fuzzy para modificar identidades financieras. No se cambian ROA, umbrales,
ponderación ni método de publicación. Las decisiones de negocio del
[plan](data-reconciliation-plan.md) permanecen propuestas.

Ver [auditoría](data-quality-audit.md), [validación](data-quality-validation.md) y
[progreso](progress.md). Los controles remotos no prueban una sesión de lector;
no se certifica la importación económicamente ni el QA integral posterior.

## ROA: comparación anual y tasas visibles — 2026-11-20

La pantalla compara T1–T4 del mismo año con iguales filtros y revisiones
independientes; el trimestre seleccionado controla el detalle. No agrega un ROA
anual. Separa ROA total y ROA Advisory para comparar el Fee con su misma población.

La tasa anual publicada de una cuenta Advisory se muestra aun sin tres fotos AUM.
Se distingue del Fee ponderado, que conserva sus requisitos existentes. Referencias
pendientes/obsoletas permanecen N/D. Conteos de tasas corresponden a cuentas
observadas, sin certificar población esperada. Etiquetas de cuenta reutilizan
identificador resuelto/custodio sin alterar identidad ni unir por nombre.

Migración aplicada sólo en GMA como `20261120180701`; entrega mediante push a main
autorizada por el dueño. Sin alterar hechos financieros. Ver [progreso](progress.md).


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

## Master Owners: aplicación remota y push autorizados — 2026-11-20

El pedido posterior autoriza aplicar `master_owners_import` en el Supabase GMA y
pushear la entrega a main. Aplicada como 20261120164104; archivo local alineado
al timestamp remoto sin alterar SQL. No autoriza publicar tasas ni datos del Excel:
esa operación sigue requiriendo conciliación y confirmación en la aplicación.
Se conserva el criterio de puntos básicos y el redondeo exclusivamente visual.
Evidencia técnica y límites en progress.md/validation.md.

## Master Owners y formato visual — 2026-11-20

El dueño confirma **Adv Fee / Retro en puntos básicos anuales**: 50 = 0,50 %,
normalizado a proporción `0.005`. No se reinterpretan condiciones textuales como
cero. El corte conocido del Balance sigue siendo 30/09/2026 para la muestra;
el operador debe acreditar por separado el trimestre completo de aplicabilidad.

Se autoriza implementar la carga local del Master: snapshot privado independiente,
14 originales y metadatos de fórmulas/caché, revisión explícita de Broker→custodio y
ACCOUNT exacto de Revenue (o UUID manual con evidencia). Las cuentas numéricas
requieren confirmación literal sin reconstruir ceros. Seleccionar una tasa confirma
su elegibilidad, base bruta, fórmula trimestral existente y comparabilidad ROA;
no se deducen por Fee type/Status. Sólo cuentas ya clasificadas Advisory admiten
esta proyección. Las demás filas permanecen pendientes en el snapshot original.
Una tasa por cuenta/trimestre; componentes múltiples requieren revisión separada.

Publicación conjunta del snapshot y selección, atómica/idempotente, con corrección
versionada de las obligaciones Master existentes y sus tasas ROA. Omisiones no
borran otras cuentas ni fuentes. Revisión obsoleta o selección inválida bloquea toda
la publicación. No cambia AUM, Revenue, REF ni asignaciones comerciales. Sin nuevas
reglas económicas de cobranza, sin aplicar remotamente ni desplegar en esta etapa.

Formato visible solicitado: **máximo dos decimales**, redondeo decimal sin Number.
Importes/participaciones/ROA/diferencias de tablas, tooltips y conciliación comparten
formato. Las proporciones anuales se presentan en porcentaje para no ocultar tasas
pequeñas al redondear. Cálculos, SQL, JSON/CSV y originales conservan su precisión;
los paneles de originales siguen mostrando literalmente la evidencia fuente.

## ROA: cierre de auditoría local — 2026-11-20

La auditoría final no cambia definiciones financieras ni permisos. Se conserva el
carácter provisional y el contrato sin CSV ROA; no se añade una exportación parcial
para cubrir esa ausencia. Resumen sigue usando cierre mensual y Revenue del rango.
La corrección de paginación vacía y las pruebas adicionales se documentan en
[quarterly-roa-audit.md](quarterly-roa-audit.md). Lista para prueba manual exploratoria;
aceptación económica y exportación ROA pendientes. Esta solicitud no autoriza
despliegue de producción; no se hizo push ni ninguna operación remota.

## Rentabilidad / ROA: frontend autorizado — 2026-11-20

> Ampliación posterior del pedido: el dueño autorizó aplicar las migraciones
> pendientes en el Supabase de GMA y push a main al completar frontend. Se aplicó
> únicamente ROA, como20261120155740, pues las25 anteriores ya estaban presentes.
> Código609b054 pusheado a main; ejecución/controles en progress.md y validation.md.

El pedido vigente autoriza únicamente la interfaz sobre el backend local existente.
Nueva `/rentabilidad`, accesible a admin y reader mediante `requireAccess()` y RPC
con sesión del usuario. No hay publicación de tasas en esta pantalla ni cambios de
permisos, SQL, API o despliegues por esta etapa. Se conservan decisiones económicas
pendientes y la advertencia `observed_only_provisional` en resultados calculables.

- Año/trimestre explícitos, sin convertir rangos de Resumen ni elegir períodos
  implícitos. Navegación conserva entidades compatibles; filtros AND en URL.
- Selectores reutilizan únicamente etiquetas/opciones públicas de `aggregate_report`
  bajo el mismo rango y entidades (hasta 100 por selector). Sus cifras de cierre no
  se usan en ROA. Si las opciones fallan se informa, conservando filtros/resultados.
- KPIs y tabla consumen textos/null del reporte ROA; clasificación y comparadores
  provienen de SQL. `Number` solo posiciona coordenadas finitas de Recharts.
- Las tres fotos por cuenta se inspeccionan seleccionando la cuenta desde la tabla:
  el contrato ofrece meses del conjunto filtrado, no snapshots por cada fila. No
  se agregan consultas por fila ni se reconstruyen fotos desde AUM promedio.
- Evolución: hasta cuatro trimestres con iguales filtros. Cada trimestre conserva
  su propia revisión; se informa que no forman un snapshot conjunto. Fallos por
  trimestre se presentan como errores, sin ceros ni datos de sustitución.
- CSV diferido porque el contrato ROA no lo admite. No se exporta solo una página
  ni se reutiliza el CSV de AUM al cierre como si fuera AUM promedio.

Ver implementación, validación local y límites en [quarterly-roa.md](quarterly-roa.md),
[progress.md](progress.md) y [validation.md](validation.md).

## ROA: backend y motor local autorizados — 2026-11-19

Un pedido posterior autoriza exclusivamente migración, motor SQL, contratos/API y
pruebas, sin interfaz ni acciones remotas. Se implementa reporte separado de
aggregate_report: tres fotos/divisor 3, Revenue publicado por MES/AÑO, atribución
histórica al cierre, ratios sobre sumandos y filtros AND. Numeric y texto/null;
faltantes, base cero/negativa y trimestre abierto no generan ROA ni categoría.

Payout broker se reutiliza como métrica existente **sin dar por verificada su
idoneidad para ambos servicios**. Los cálculos posibles se etiquetan provisionales
sobre cobertura observada; cliente/servicio siguen siendo actuales sin historia.
No se agregan certificaciones de cero/completitud ni se infieren cuentas activas.

Advisory admite una publicación administrativa explícita de tasa trimestral desde
un expected vigente/verificado, con evidencia adicional de comparabilidad. Esto
implementa la proyección publicada del plan para admin/reader sin abrir eventos u
originales de Comisiones. Copia tasa de origen, conserva versiones/actor, invalida
al corregirse la fuente y requiere revisión/idempotencia. Fee ponderado por AUM
mensual, diferencia ROA menos Fee en pp con una sola división; tasa incompleta o
incompatible N/D. La selección revisada no prueba por sí misma una muestra real.

Son políticas técnicas conservadoras para este backend local, no una conciliación
económica ya realizada. Siguen pendientes las definiciones/muestras del plan antes
de habilitar resultados reales. Ver [quarterly-roa.md](quarterly-roa.md).

## Rentabilidad / ROA trimestral: alcance de planificación — 2026-11-19

El dueño solicita planificar una sección separada con filtros combinables de
año/trimestre, equipo, custodio, cliente, comercial, cuenta y servicio. Regla del
pedido: AUM promedio de los tres snapshots mensuales; Revenue trimestral sumado;
ROA anualizado = Revenue × 4 / AUM promedio × 100. Bajo <0,40%; OK entre 0,40% y
0,60% inclusive; Muy bien >0,60%. Advisory añade Fee anual y diferencia solo con
base/vigencia comparables. No cambia AUM al cierre del dashboard existente.

Plan en [quarterly-roa-implementation-plan.md](quarterly-roa-implementation-plan.md).
Solo se autoriza documentación en esta etapa, sin implementación ni cambios
remotos. El código confirma Payout broker como métrica general normalizada, pero
no acredita todavía su idoneidad económica para ambos servicios. No se da esa
decisión por confirmada. Comisiones es administrativo y sus tasas no son una
fuente publicada para lectores; REF no acredita vigencias históricas.

Pendientes: métrica/periodización por servicio; cuentas mixtas e historia de
cliente/servicio; universo esperado y faltantes/cero; Fee comparable y evidencia;
ponderación por AUM, signo de diferencia y acceso lector a tasas. La política
estricta de N/D ante faltantes, diferencia ROA menos Fee en pp y publicación
separada de tasas son propuestas del plan, aún sin aprobación de negocio.

## Consultas amplias: huella de revisión acotada — 2026-11-18

Bug informado al consultar enero 2024–agosto 2026. El reporte conserva la matriz
cuenta/mes y todos sus filtros, reglas de cierre, cobertura y atribución. La huella
opaca pasa de un JSON agregado de todas las filas a hashes de fila ordenados por
período/UUID, concatenados y resumidos. Incluye los mismos campos, filtros,
publicaciones faltantes y snapshot REF. La revisión sigue detectando cambios entre
páginas; tokens emitidos antes del cambio requieren reiniciar la consulta.
No se eleva el límite de 8 s ni se recorta el rango o la precisión para ocultar el fallo.

Ante SQLSTATE 57014 se informa tiempo agotado. La pantalla permite editar fechas,
conserva filtros de entidades/desglose y descarta offset/revisión al consultar otra
vez. API/CSV devuelve 504 sin entregar un resultado parcial. Otros errores mantienen
sus estados de acceso, revisión o indisponibilidad.


## Snapshot REF aplicado por autorización del dueño — 2026-11-18

«Apliquemoslo» autoriza aplicar el criterio operativo ya revisado. Se publica una
clasificación de referencias de origen, separada de identidades formales y de las
asignaciones históricas. Client, Owner Name payout y Grupo conservan sus etiquetas
literales por UUID de cuenta/custodio acreditado. Agrupar etiquetas iguales en el
desglose REF no fusiona clientes/personas ni prueba identidad personal.

Snapshot versionado e inmutable con original SHA/hoja/fila y vínculo al AUM que
conserva el REF en Storage privado. Revisión de los 807 pares completos: 773 tienen
cuenta resuelta, 34 se conservan sin UUID. Hay 66 cuentas financieras fuera de REF.
El error Grupo de una referencia sin UUID queda preservado; un error de grupo
aplicable a una cuenta resuelta bloquea la operación completa. No hay sustitución
de hechos financieros ni asignaciones fechadas. Una clasificación posterior
requiere nueva versión y revisión del puntero activo.

La aplicación remota se ejecuta como mantenimiento por el operador SQL real:
función invoker privada, sin EXECUTE para PUBLIC/anon/authenticated/service_role
ni ejecutor de la app. Auditoría con actor_id NULL, database_role postgres y texto
de autorización del dueño, sin simular JWT; el uploader original se conserva
por separado. No hay credenciales privilegiadas en runtime.

Resumen/Análisis/Cuentas/CSV muestran el snapshot explícitamente sin vigencia.
Los filtros y métricas históricos conservan sus reglas y asignaciones fechadas.
Clientes identificados y etiquetas Client de REF son conteos distintos.

## Referencia comercial REF elegida por contexto — 2026-11-18

Ante la pregunta por el campo comercial y vigencias, el dueño delegó al agente
resolverlo con el contexto. Se adopta Owner Name payout de REF como referencia
comercial operativa de ese snapshot. La evidencia es que las 807 fórmulas Grupo
consultan C de su fila y cada una de las 28 etiquetas actuales con grupo válido
mantiene un único grupo. Advisor Name de Revenue tiene 50 etiquetas y sólo 22
coinciden literalmente con REF. No se sustituyen ni se equiparan personas entre
fuentes. Owner conserva además el significado de beneficiario de comisiones.

Es una inferencia operativa documentada por delegación, no una confirmación
independiente del negocio ni permiso para fusionar identidades por nombre.
REF no tiene vigencias: no usar fecha de recepción como inicio, ni aplicar el
snapshot a 2023–2026. Las referencias actuales y la atribución histórica deben
presentarse por separado. No se publicaron asignaciones ni clientes nuevos.

Client aporta etiquetas por cuenta/custodio para 773 de las 839 cuentas con hechos;
66 cuentas Revenue quedan sin REF. Conservar etiquetas originales y resolver
identidades explícitamente. La elección de columna queda resuelta como criterio
operativo del snapshot; las vigencias históricas siguen sin evidencia.

## Faltantes visibles e indicadores legibles — 2026-11-18

La investigación solicitada tras la carga histórica distingue identidad de cuenta,
cobertura financiera y clasificación de clientes/comerciales/equipos. Resolver
cuentas con REF no acredita estas clasificaciones ni vigencias históricas.
No se modifican identidades ni datos publicados sin evidencia adicional.

Resumen y Análisis comercial muestran los faltantes del informe junto a los
indicadores: cierre AUM sin registros, fotos/importes ausentes, publicaciones
faltantes y clasificación pendiente. Un enlace permite elegir el último mes con
registros AUM observado dentro del rango y filtros actuales; la selección es
explícita, conserva filtros de entidades y también cambia el rango de Revenue.
No se arrastran saldos ni se promete cobertura fuera del rango consultado.

Los indicadores monetarios de ambas pantallas muestran dos decimales con redondeo
decimal exacto de presentación (mitades alejadas de cero), reutilizando la regla
de porcentajes existente. Detalles, API, CSV, originales y cálculos conservan toda
su precisión. Se informa esta diferencia de presentación en las pantallas.

## Presupuesto histórico de 60 s para AUM — 2026-11-18

La publicación real AUM (433 alcances) llegó al cierre del padre y agotó 30 s,
revirtiéndose por completo. Se amplía a 60 s únicamente la RPC manage_historical,
dentro del máximo documentado de la API. Conserva permisos, límites de roles/otras
RPC, lock_timeout, validaciones, auditoría e idempotencia/atomicidad. Sustituye el
presupuesto anterior de 30 s para esta función. No autoriza publicar por otra vía
ni eludir el bloqueo del navegador; requiere reintento desde el circuito normal.

## Aplicación del par REF a las identidades AUM/REV — 2026-11-18

Al continuar la carga AUM solicitada por el dueño, se aplica el contrato confirmado:
ACC # Addepar / ACCOUNT / Broker de REF acredita el par de referencias y custodio;
Account Number bd_REV corresponde a ACCOUNT de Revenue. La resolución por bloques
exige el par literal, sin ambigüedad en ninguno de sus lados dentro del custodio.
Consulta ambos namespaces AUM y el namespace ACCOUNT de Revenue: sólo reutiliza
un UUID si todas las referencias acreditadas coinciden. UUID contradictorios bloquean
el bloque completo; no se fusionan cuentas ni se unen por nombre.

Si no existe cuenta, se crea una propia de AUM y se registra también la equivalencia
Revenue/ACCOUNT expresamente acreditada por REF, para que una futura carga REV
reutilice esa identidad. Esto no crea Revenue ni modifica movimientos publicados.
Cada resolución conserva actor, motivo, SHA del REF, hoja, fila y origen AUM.
No se infieren clientes, comerciales ni vigencias históricas.

## Presupuesto acotado para la operación histórica — 2026-11-18

La publicación real de 225 alcances auditados supera 8 s en Supabase aun después
de optimizar consultas repetidas. Se establece statement_timeout=30s sólo en la
RPC pública manage_historical, con hoisting documentado de PostgREST. Roles y otras
RPC conservan sus límites; no se altera lock_timeout, permisos ni atomicidad.
Cuatro políticas de lectura publicada evalúan current_access por consulta mediante
SELECT escalar; sus predicados, roles y límites de publicación no cambian.

## Resolución por bloques de identidad exacta en REV — 2026-11-18

El dueño pidió al agente completar las correspondencias y conciliación de su carga
preparada. Se habilita una operación administrativa por bloques de hasta 50 filas:
reutiliza o crea un UUID por ACCOUNT literal/custodio dentro del namespace Revenue,
usando la resolución existente y su evidencia/actor/auditoría. Sin ceros inventados,
coincidencias por nombre ni aliases entre fuentes. Las cuentas ausentes de REF
permanecen como sólo Revenue; no se inventan clientes o comerciales históricos.
Reintentar conserva resoluciones existentes y no agrega movimientos. La conciliación
por alcance reutiliza el control previo de filas/importes/cobertura/versión activa;
se mantiene separada de la publicación explícita y atómica de la carga completa.

## Preparación histórica sin barrido de coordenadas entre hijos — 2026-11-18

Se conserva la unicidad por coordenada de origen mediante el manifiesto inmutable
validado al registrar la carga, pertenencia de cada fila a su alcance y restricción
UNIQUE por hijo/hoja/fila. El barrido global por cada inserción era redundante y
provocó un timeout real al preparar REV; se retiró sin ampliar permisos ni plazos.
Los movimientos idénticos de Revenue en filas distintas siguen siendo legítimos.
No cambia ninguna decisión de negocio ni se autoriza publicación automática.

## Revisión de carga manual confirmada — 2026-11-17

El dueño autorizó conservar Payout broker ausente como N/D y permitir publicación
revisada mostrando suma conocida y cobertura incompleta. También acreditó usar
las cuentas numéricas exactamente como están en Excel dentro de cada custodio,
sin agregar ceros. La implementación exige decisión explícita y motivo por carga;
solo admite enteros literales no negativos de hasta 15 dígitos, sin fórmulas ni
notación científica. Se conservan tipo, valor original, archivo, fila y advertencia.

En REV, los errores de Excel en columnas descriptivas pueden conservarse como
advertencias mediante otra decisión explícita. No aplica a ACCOUNT, CUSTODIO,
MES, AÑO ni Payout broker. No se evalúan fórmulas ni se inventan importes. Los
errores bloqueantes restantes impiden publicación parcial; correspondencias,
revisión completa, idempotencia y atomicidad siguen vigentes. No se altera el
original ni se reinterpreta una carga antigua con decisiones nuevas.

## Confirmaciones de fuentes reales — 2026-11-17

El dueño confirmó expresamente que el valor GMW de Broker en REF es un error
de escritura y corresponde a GWM. No representa un custodio distinto. Esta
confirmación no implementa un alias automático: el archivo debe corregirse
explícitamente antes de volver a cargarlo; el original conservado no se alteró.

El dueño confirmó en esta conversación que `Account Number bd_REV` de AUM se
corresponde con `ACCOUNT` de Revenue; que `Broker` de REF identifica al custodio;
y que el balance de Master Owners es al 30/09/2026. Broker ya no es candidato a
campo comercial en este contrato. No se acreditaron vigencias históricas ni una
unidad universal de tasa. Análisis y propuesta en [source-import-analysis.md](source-import-analysis.md).
Solicitud de esta etapa: analizar, sin implementar ni cargar datos reales.

> Actualización vigente de comisiones (2026-11-17): ver [commissions.md](commissions.md).
> El nuevo pedido autoriza motor trimestral Balance × tasa anual /4 y conciliación
> local revisada. Supera para este motor las restricciones de sólo planificación
> y la fórmula ACT/365 anteriores; el helper aislado previo se conserva sin integrar.

Actualizado: 2026-11-15. Distinguir reglas confirmadas por el usuario de propuestas de la guía. No presentar propuestas como negocio validado.

## Confirmadas

| Tema | Decisión y consecuencia |
| --- | --- |
| Objetivo | Análisis interno de AUM, Revenue y distribución comercial; Excel como entrada inicial. |
| Identidad | UUID interno y equivalencias explícitas por fuente/namespace/custodio. Identificadores como texto, con ceros y original conservados; no unir por nombre. |
| AUM | Foto mensual USD, una fila consolidada publicada por cuenta/mes. Duplicados bloquean, no se suman. Rango = último mes seleccionado, con faltantes visibles. |
| Revenue | `SUM(Payout broker)` en USD. Múltiples filas y repeticiones legítimas permitidas. Las 29 columnas de la guía se conservan completas en `product.md`. |
| Agregación | Agregar fuentes por separado antes de relacionarlas; ausencia no es cero; no perder cuentas con una sola fuente o sin asignación. |
| Precisión y lenguaje | Decimales exactos para montos y porcentajes; variación de AUM no es rendimiento y Revenue no es ganancia neta. |
| FA | `Grupo` es equipo de comerciales. Conservar todas sus referencias y usar vigencias; un FA actual no acredita historia pasada. |
| Publicación | Preparaciones/fallos no alteran publicados. Corrección trazable y versionada, sin duplicación ni pérdida de la versión anterior. |
| Procedencia | Conservar valores originales, archivo, hoja y fila; no publicar fuentes financieras ni secretos. |
| Exclusiones | Sin liquidación advisory, pagos, cobros, bancos ni integraciones directas con custodios/Addepar. |
| Forma de trabajo | Etapas acotadas; decisiones técnicas rutinarias autónomas; avanzar localmente con datos sintéticos identificados cuando falten accesos o muestras. |
| Protección de entornos | No tocar bases/despliegues ajenos ni hacer cambios remotos destructivos. |

## Propuestas para el MVP y decisiones técnicas diferidas

| Tema | Base de trabajo | Estado |
| --- | --- | --- |
| Stack | Next.js App Router + TypeScript; Supabase PostgreSQL/Auth/Storage privado y Vercel como destino previsto. | Estructura local implementada en etapa 1. Sesiones SSR y permisos implementados localmente en etapa 3; sin conexión remota ni despliegue. |
| Versiones y dependencias | Next 16.4.6, React/DOM 19.3.1, TypeScript 5.9.3, Radix Themes 3.3.0, Recharts 3.10.1 y react-is 19.3.1; Supabase JS 2.119.0, SSR 0.12.7 y CLI 3.1.0. | Documentación oficial, engines y peers consultados; instalación y scripts verificados con Node 24.19.0. Versiones exactas y lockfile. Motivos y limitaciones en README. |
| Acceso | Invitación; administrador y lector, ambos con consulta global publicada. Solo administrador modifica/importa/publica. | Confirmado por solicitud de etapa 3. Implementado en servidor/SQL y probado sintéticamente; configuración alojada y servicios reales pendientes. |
| Asignación | Una asignación principal por cuenta y vigencia; un equipo principal por comercial y vigencia. | Propuesta, debe contrastarse con muestras y reglas reales. |
| Atribución temporal | Usar asignación al cierre de cada mes para AUM y Revenue de ese mes; rango suma Revenue según cada cierre histórico. | Política MVP implementada por solicitud de etapa 5; sin cobertura queda sin asignar, incluido en totales. |
| Servicios | `sin_clasificar` hasta clasificación manual posterior. | Tratamiento provisional explícito, sin inferir servicios de otras columnas. |
| Estados de importación | `uploaded`, `validating`, `needs_resolution`, `ready`, `failed`, `published`; superseded derivado del puntero activo. | Circuito completo implementado localmente hasta etapa 5; `superseded` se muestra derivado sin mutar la versión publicada. |
| Formatos | `.xlsx` y `.csv`; evaluar `.xls` según muestras. Rechazar formatos no soportados con instrucción clara. | Diseño futuro; ninguna biblioteca ni compatibilidad comprobada todavía. |
| Esquema y tipos | SQL versionado en app_private; `numeric` exacto sin escala forzada, normalización identidad, vigencias [desde,hasta), alcance fuente/mes/custodio y único puntero activo. | Implementado y probado desde cero en PostgreSQL 17.11 sintético. Diccionario en `data-dictionary.md`; políticas de roles implementadas en etapa 3; formatos reales y servicios externos pendientes. |

## Definiciones de negocio pendientes

No bloquean la documentación ni la estructura inicial. Pedirlas cuando bloqueen resultados reales; no inventarlas ni declarar validado el mapeo.

| Pendiente | Tratamiento seguro mientras falta | Cuándo se necesita |
| --- | --- | --- |
| ¿Qué campo identifica al comercial: `Broker`, `Owner Name payout` u otro? | Conservar ambos y demás referencias; no atribuir automáticamente cifras reales. Preparar mapeo explícito configurable cuando se implemente. | Antes de publicar asignaciones/análisis comercial real. |
| ¿Qué representan `Advisor Name`, `ADV NAME SEC`, `Rel. 2nd`, `Nacho GMA` y demás referencias de Revenue? | Conservar valores originales. FA como fuente de clasificación es solo propuesta hasta validar. | Antes de usar esas referencias para clasificar. |
| ¿Cada entrega de Revenue cubre todos los custodios o uno solo? ¿Es completa para el alcance? | Exigir selección/revisión explícita de período y alcance. No reemplazar el mes global por defecto ni interpretar ausencia como borrado. | Antes de publicar o reemplazar Revenue real. |
| ¿Qué significa `Top Level Holding Account`? | Conservar sin derivar jerarquías o subtotales. | Antes de usarlo como jerarquía o agregación. |
| ¿Puede haber varios comerciales por cuenta o varias pertenencias a equipos? | Una asignación principal es propuesta, no hecho. Mantener ambigüedades pendientes y validar muestras antes de cerrar cardinalidad. | Antes de cerrar/publicar el modelo comercial real. |
| ¿Desde cuándo aplica el FA inicial y cada cambio? | Exigir vigencia explícita; `OLD Owner Name payout` sin fecha no construye historia. Meses sin cobertura permanecen sin asignar. | Antes de publicar asignaciones reales. |
| Atribución al cierre mensual | Política solicitada para MVP en etapa 5: usar último día del mes dentro de [desde,hasta); sin arrastre ni prorrateo. | Las fechas y la columna comercial se confirman explícitamente para cada FA; muestras reales pendientes. |
| ¿Qué servicios tiene cada cuenta? | `sin_clasificar`, sin excluirla de totales. | Antes de presentar clasificación por servicio como completa. |
| ¿Qué significa `PAGO OK`? | Conservar sin llamarlo cobranza confirmada. | Antes de usarlo como indicador. |
| ¿Cómo vienen decimales, porcentajes, negativos y fórmulas? | Solicitar muestras privadas cuando corresponda; vista previa y formato explícito ante ambigüedad. No convertir ausentes a cero ni ejecutar fórmulas/macros. | Antes de validar parsing con archivos reales. |
| ¿Cuál es el namespace/custodio de cada referencia de AUM/FA y qué equivalencias están acreditadas? | No inferirlo por números o nombres; correspondencias ambiguas pendientes con evidencia. | Antes de publicar cuentas vinculadas entre fuentes. |
| ¿Qué cobertura se espera por fuente/mes/custodio? ¿Cómo se confirma un período sin movimientos? | Mostrar cobertura conocida y desconocida; un archivo vacío no confirma cero ni autoriza reemplazo. | Antes de afirmar completitud o publicar reemplazos vacíos. |

## Accesos y operación pendientes

- Muestras de las tres fuentes no inspeccionadas; no se solicitaron para completar esta etapa documental. Los headers están disponibles en la guía.
- Supabase conectado solo enumera proyectos ajenos. El dueño eligió la cuenta Vercel `franlang2209-8232` abierta en Chrome y solicitó crear allí `app-papa`; resultado en `progress.md`. No usar las cuentas ajenas de conectores/CLI por conveniencia. Destino Supabase, región/plan y validación alojada pendientes.
- Elegir región, plan y presupuesto con el dueño antes de configurar producción o activar costos. Medir volumen/tamaño representativo antes de prometer capacidad de importación.
- Definir retención de fuentes e importaciones y verificar backups/restauración reales, incluidos archivos privados, antes de automatizar borrados o puesta en uso.
- Ejecutar bootstrap seguro del primer administrador e invitaciones según `auth.md`, después de configurar el proyecto dedicado. Mecanismo implementado/documentado; operación real pendiente.

## Registro de la etapa 0

La carpeta se encontró vacía, sin `AGENTS.md` ni Git inicializado. Se decidió crear solo los cuatro documentos solicitados, sin scaffold, dependencias, base, despliegue ni cambios remotos. La guía se usó como referencia de contexto y esquemas; no como autorización para ejecutar los prompts 1–10. No hay decisiones de negocio resueltas por inferencia.

## Registro de la etapa 1

- Cinco rutas navegables en español, sin cifras financieras ni usuarios simulados. No se implementó la demo opcional: el estado sin conexión alcanza para revisar esta estructura.
- Radix Themes aporta componentes y tokens accesibles; CSS propio y fuentes de sistema evitan otra capa de estilos. Recharts se integra en una serie vacía de AUM, con descripción accesible y sin ejes, puntos o importes ficticios. Los importes futuros deberán proceder de consultas decimales verificadas, no de cálculos del gráfico.
- El estado del entorno se evalúa en servidor por solicitud. Variables ausentes, inválidas y configuradas son estados distintos. Variables válidas no confirman conectividad ni autorizan acceso. No se ejecutan consultas ni se usa fallback de datos.
- Clave publicable moderna únicamente, sin secretos privilegiados ni variables públicas. La fábrica del cliente no persiste sesiones ni lee tokens desde URLs; integración SSR con sesiones queda para la etapa 3.
- CLI local instalada y fijada; help de `init`, `migration` y `migration new` inspeccionado antes de usarlos/documentarlos. Se ejecutó solo `init`. `supabase/config.toml` conserva una base local reducida; no hay SQL ni stack iniciado. PostgreSQL 17 es provisional para la base local y no implica versión remota acordada.
- Config local sin registro público/anónimo, seeds ni exposición automática de tablas. Storage, Realtime, funciones y analytics deshabilitados hasta necesitarse. No se crearon recursos ni enlaces remotos.
- ESLint 9.39.5 conserva compatibilidad de peers; está deprecado/no soportado y hay siete avisos moderados transitivos en desarrollo. La prueba con ESLint 10.14.0 produjo conflictos de peers, por lo que se revirtió. No se forzaron versiones transitivas; auditoría de producción sin avisos. Revisar cuando la cadena tenga una actualización compatible.
- Next 16.4 genera un bloque en `AGENTS.md` al iniciar desarrollo. Se consultó su documentación y se fijó `agentRules: false` para conservar las instrucciones del proyecto sin cambios automáticos.
- No se inicializó Git ni se avanzó al modelo SQL. No cambió ninguna definición de negocio pendiente.

## Registro de la etapa 2

- Se implementó únicamente el esquema solicitado. 15 tablas: las 14 propuestas más `import_scopes`, necesaria para bloquear una unidad de reemplazo y seleccionar una sola versión activa sin duplicar flags en los hechos. No hay endpoints ni importador nuevos.
- Cuenta pertenece a un custodio explícito. Equivalencias únicas resueltas por fuente/namespace/custodio; desconocidas permanecen pendientes. Normalización v1 conserva texto exacto. No se deduplican personas por nombre.
- Fechas de vigencia [desde,hasta), fin exclusivo, null sin límite superior; exclusiones para principal de cuenta y de equipo. Esto implementa la restricción solicitada sin decidir atribución mensual ni fechas reales del FA.
- Decimales `numeric` sin escala fija ni redondeo silencioso, finitos y negativos permitidos. Ausencias null. Se retienen 29 campos Revenue como texto y deriva solo `payout_broker_usd`; porcentajes originales sin conversión hasta validar convención. Futura proporción decimal 0.15 = 15 %, sin asumir cómo vienen los archivos.
- Alcance conservador: fuente + mes + custodio, reemplazo completo de esa unidad revisada. No expresa que cada archivo real tenga esa cobertura: un archivo podrá dividirse en varios lotes y su publicación conjunta debe ser atómica. Alcances parciales por lista de cuentas y publicación FA se difieren hasta tener contratos y flujo revisado.
- Un puntero activo por alcance y AUM único por lote/cuenta/mes, con FK compuestas a cuenta/custodio/lote/fila, aseguran unicidad global del AUM vigente. Revenue conserva repeticiones físicas legítimas. Publicados inmutables; superseded se deriva, sin eliminar registros anteriores. Restauración funcional futura mediante nueva versión revisada.
- Función interna invoker de publicación financiera con revisión del puntero esperado, locks, conciliación de filas/total/cobertura y evento de auditoría. No tiene EXECUTE para roles de aplicación y exige actor autenticado administrador habilitado. Su existencia no implica que el circuito de importación esté terminado ni autorizado para datos reales.
- Esquema privado con RLS forzado y default deny, sin grants incluso a service_role. Vistas invoker. Bucket privado reservado documentalmente, sin activar Storage; etapa 3 cierra las políticas, bootstrap e invitaciones.
- PostgreSQL 17.11 nativo temporal sin TCP: migración desde cero, restricciones, permisos, concurrencia y restauración de esquema verificadas con sintéticos. Docker ausente; advisors local falló por conexión rechazada. Sin cambios remotos ni inicialización de Git. Evidencia en `validation.md`.
- No cambió ninguna definición comercial pendiente. Continúan sin validar formatos de Excel, equivalencias reales, cobertura esperada, asignaciones iniciales, atribución y privacidad efectiva de Storage.

## Registro de la etapa 3

- Acceso por invitación confirmado por el usuario: admin y reader global publicado; lector sin preparación/originales/fuentes. Alta, rol y habilitación solo mediante operador autorizado; sin trigger que convierta al primer usuario en admin ni escritura de perfiles por API, incluso para admin.
- `@supabase/ssr` 0.12.7 es la única dependencia nueva, exacta y con lockfile; peer `supabase-js ^2.114.0` compatible con 2.119.0 existente. Sesiones oficiales, `getClaims` en Proxy y `getUser` + perfil actual en servidor. Sin claves privilegiadas en runtime.
- Ingreso OTP con `shouldCreateUser:false`; invitación por plantilla y aceptación POST, sin registro. Plantillas locales versionadas y configuración con registro/anónimos desactivados; requiere replicar/configurar el entorno alojado según `auth.md`.
- RLS requiere perfil habilitado y sesión real no vencida/revocada. Proyecciones publicadas y publicación bajo rol interno NOLOGIN/NOBYPASSRLS, sin membresía de usuarios; vistas invoker. Lookup de perfil/sesión definer acotado en esquema privado. Perfiles sin escritura, originales exclusivamente admin, decimal como texto en respuestas de métricas.
- Bucket privado con SELECT/INSERT admin y políticas restrictivas contra lectura por otras políticas o borrado/sobreescritura. Descarga autenticada sin URL firmada. Logout de sesión actual; deshabilitar perfil corta acceso en todos los dispositivos en consultas posteriores.
- Pruebas PostgreSQL reales con roles SQL y contratos mínimos de Auth/Storage; HTTP Next de producción con proveedor sintético explícito. No se validaron servicios Supabase, SMTP, JWT reales ni registro remoto. Los enlaces conectados solo enumeran otros proyectos; no se usaron ni modificaron.
- Se conserva la separación por etapas: permisos de preparación/publicación disponibles en base; parser, validación Excel, UI de importador e indicadores pendientes de sus etapas. No se ejecutaron etapas futuras ni se validó una importación real.

## Registro de la etapa 4 — 2026-11-12

- Solicitud vigente: solo preparación de AUM/Revenue/FA; guía usada como contrato de headers, no autorización para prompts posteriores. No hay Git inicializado; se preservó el trabajo previo. Sin muestras identificadas de las fuentes, no se confirmó necesidad real de .xls. Se rechaza con conversión explícita a XLSX sin macros o CSV UTF-8; archivos ajenos de Downloads no fueron abiertos como muestras.
- Dependencias exactas: read-excel-file 9.3.15, csv-parse 7.0.3, fflate 0.8.3 y saxen 11.2.0. Actividad/engines consultados en npm y documentación primaria. Números XLSX textuales exactos, inspección de tipos/caché/fórmulas y expansión ZIP acotada. No se ejecutan fórmulas, macros ni conexiones externas.
- Alcance mínimo soportado: una fuente + un mes + un custodio declarado, sin filtrar filas ajenas. Revenue debe declarar ese código en todas sus filas. FA: mes/custodio solo de referencia declarada; no se presume comercial, historia o custodia acreditada. Multi-custodio/multi-período requiere archivos explícitos o una futura orquestación atómica, no descarte silencioso.
- Máximo 2 MiB original, 12 MiB XLSX expandido, 5.000 filas por hoja, 64 columnas, 10 hojas; controles adicionales y recuperación en imports.md. Persistencia hasta 250 filas / 1 MiB serializado por llamada, transacción/cursor y reintentos. Relectura/validación completa por solicitud dentro de estos límites para detectar conflictos cruzados; sin tareas fire-and-forget.
- Posiciones como claves de originales para conservar headers duplicados; mapeo explícito solo trim/espacios/case de headers. Identificadores originales exactos, numéricos/científicos/calculados bloqueados; no se pueden detectar todos los ceros ya perdidos en CSV. Convenciones punto/coma explícitas, sin separadores mientras estén sin definir. Solo Value (USD) y Payout broker se tipan; otros campos, especialmente porcentajes Revenue, se preservan hasta acordar bases/unidades.
- AUM duplicado en cualquiera de sus referencias es conflicto; Revenue repetido conservado; FA detecta contradicciones sin crear correspondencias ni vigencias. Caché de fórmula admitido con advertencia; ausente/error bloquea y pide recalcular/exportar. Suma de control exacta incluye importes interpretables aun con otros errores y se marca no publicable; faltantes null, negativos permitidos.
- Original registrado y cargado por JWT admin a bucket privado sin upsert. Metadatos y Storage no comparten transacción: si falla carga, queda uploaded sin original confirmado y se permite reintentar misma solicitud; no se borra ni limpia historia. Hash de bytes indexado como advertencia, nunca restricción única ni deduplicación Revenue. Protección definitiva de alcance/publicación sigue pendiente del flujo de etapa 5.
- Bandera `preparation_only` y trigger en base: nuevos lotes no admiten ready, revisión, publicación ni desactivar bandera por UPDATE. Final sin errores = needs_resolution, no ready; con errores = failed. Ninguna fila se proyecta al dashboard, ningún hecho financiero ni entidad comercial se crea. Etapa 5 deberá implementar promoción revisada sin abrir un bypass genérico.
- Pruebas locales/sintéticas registradas en validation.md. Sin recursos remotos modificados, conciliación real, despliegue, retención automatizada ni definiciones comerciales resueltas por inferencia.

## Etapa 5 — resolución y publicación (2026-11-13)

- Unidad financiera de publicación/corrección: **una fuente + un mes completo + un custodio**. La selección al cargar fija contexto; la confirmación al revisar acredita que el archivo cubre esa unidad. Revenue multi-custodio/multi-período se rechaza íntegro: no se filtran filas ni se reemplazan otros custodios. La cobertura real de las entregas sigue sin confirmarse.
- **Cero filas:** bloqueado incluso si se intenta declarar sin errores por RPC. No existe publicación de cero movimientos ni borrado implícito. Un mes con movimientos que suman exactamente cero sí puede publicarse conservando sus filas. Si se necesita certificar meses sin filas, requerirá un flujo específico de alcance/evidencia y nuevas pruebas; un check genérico no habilita vacíos.
- Correspondencias por fila, evidencia y custodio elegidos expresamente. Namespace = header contractual + fuente + custodio; comparación textual exacta, incluidos ceros/espacios. FA conserva el par de referencias y ayuda al administrador a elegir el mismo UUID en otras fuentes; no crea equivalencias entre namespaces por número/nombre. FA sin custodio queda pendiente hasta declaración explícita. Una referencia acreditada contra otra UUID bloquea; no se fusionan cuentas ni se redirige historia automáticamente.
- `Owner Name payout`, `Broker`, `Grupo`, `Client` y `OLD Owner Name payout` permanecen originales. Cada publicación FA exige confirmar `Owner Name payout` o `Broker` como columna comercial, mapear personas expresamente por UUID (o crear una persona sin fusión por nombre), y fechas [desde,hasta). Es posible conservar una fila sin comercial. La app no decide cuál columna es la correcta para datos reales.
- **Política temporal MVP:** atribución al último día calendario del mes. FA no se aplica antes de `desde` ni desde `hasta`; no se infiere fecha a partir del mes de carga ni de OLD Owner. Elegir una fecha pasada exige la confirmación explícita del intervalo en revisión. Sin cobertura se mantiene sin asignar y dentro del total global.
- FA tiene hechos de asignación por versión (`fa_rows`); solo se consulta la versión activa. Publicar comprueba solapamientos por cuenta contra FA activos de otros alcances y asignaciones manuales principales. Cambiar una entrega existente exige corregir su mismo alcance; para un nuevo intervalo se debe cerrar explícitamente el anterior mediante una nueva versión. No se recortan fechas por inferencia. Los originales de grupo/cliente no crean identidades o membresías automáticamente.
- Revisión atómica materializa hechos, compara filas/valores/total decimal con la preparación y congela resolución/vigencia. Guarda token, actor, instante, comparación y versión activa esperada. Ready → published cambia estado/puntero/auditoría en una transacción. Conflicto de versión exige recargar y revisar otra vez; un reintento del lote activo devuelve éxito sin repetir evento. Una versión reemplazada no se puede reactivar por retry: reimportar su original como una nueva versión revisada.
- Un lock transaccional compartido serializa el circuito MVP (también resolución/inspección y asignaciones manuales); después se bloquean alcance y lote. La unicidad del alcance y del puntero impide versiones activas solapadas. Es conservador con el volumen acotado; optimizar a locks por cuenta/alcance solo si se mide necesidad.
- Escrituras directas de importaciones/hechos/identificadores revocadas incluso a admin API. `begin_import` y `prepare_import_chunk` pasan a implementaciones privadas definer propiedad de `app_papa_executor` NOLOGIN/NOBYPASSRLS, con wrappers públicos invoker y verificación vigente de admin. La promoción `preparation_only` queda restringida al circuito interno; no se otorga UPDATE al usuario. RLS forzado y originales privados se conservan.
- Concurrencia, fallos y conciliación validados solo con datos sintéticos en PostgreSQL nativo y HTTP local. Sin migración remota ni nueva dependencia. Dashboard/indicadores no se implementan en esta etapa.


## Registro de la etapa 6

- Confirmada por la solicitud vigente: variación frente al mes calendario anterior comparable, N/D porcentual con base cero/ausente; cuentas y clientes con AUM por presencia/asignación, cuentas con Revenue por separado. Sin estimaciones advisory ni ratio Revenue/AUM.
- Única RPC de negocio para resumen/series/filas/CSV, usuario SSR y ejecutor existente sujeto a RLS. Cliente/servicio siguen siendo clasificación de cuenta sin historia modelada; no se atribuyen al pasado por inferencia.
- Cobertura provisional explícita: universo de cuentas observadas en rango y mes previo, no “cuentas activas”. Faltantes y valores nulos visibles, publicación por fuente/mes/custodio, expectativa contractual sin confirmar. La comparación exige igual población con registros e importes presentes; no usa el último mes disponible.
- Páginas 1–250 filas y hasta 120 meses; revisión de salida detecta cambios entre páginas. CSV exporta la página solicitada con el mismo total global/filtros/series; descarga completa/UI queda para una solicitud posterior. Sin nuevo motor de exportación, dependencias ni índices sin evidencia. Índices existentes y candidatos condicionados a planes en aggregate-queries.md.


## Registro de la etapa 7 — Resumen y Análisis comercial

- Se reutilizan Radix Themes, Recharts, CSS/tokens y la única RPC verificada. Sin dependencias nuevas, fuentes financieras alternativas ni fallback de demo. Extensión SQL versionada y probada: orden de rankings por AUM antes de paginar, participaciones numeric sobre total filtrado, opciones observadas acotadas y fecha de publicación. Cuentas mantiene el orden por UUID. Detalle contractual en `aggregate-queries.md`.
- Participación se oculta por fuente si hay negativos subyacentes, importe ausente o total no positivo. Incluso un ajuste que deje neto positivo inhibe la participación de Revenue. Sobre importes conocidos, no certificación de cobertura; no sumar porcentajes redondeados. Se usan barras con línea cero y tablas con signo, sin tortas.
- Sin redefinir métricas: variaciones contra el mes calendario anterior bajo la población comparable verificada. Revenue del rango no se compara con un mes; su tarjeta indica comparación del acumulado N/D y la tarjeta mensual muestra el cambio aprobado. Conteos de cuentas/clientes mantienen presencia de registros; comparación N/D sin regla nueva de actividad.
- Filtros en URL, entidades por UUID (sin nombres/números de cuenta); servicio usa su clasificación textual contractual. Inicio sin filtros selecciona el mes calendario actual de Buenos Aires, sin buscar/arrastrar datos de meses anteriores; limpiar vuelve a esa selección. Rango explícito inclusivo. Cambiar filtro/desglose reinicia paginación/revisión.
- Opciones limitadas a 100 por dimensión bajo los filtros, con límite visible; no catálogo completo. Cuenta se identifica por UUID en esta etapa. La navegación desde tarjetas/rankings alcanza el detalle agregado y la cobertura por cuenta; identificadores externos, originales, historia y administración completa de cuentas permanecen para etapa 8.
- Última publicación del alcance y consulta son fechas distintas. Cobertura esperada/FA contractual siguen N/D, con publicaciones por fuente/mes/custodio y sin asignación por mes. No se deduce completitud de FA ni de un archivo publicado.
- Pruebas visuales usan un arnés explícito local que consulta el SQL real sobre el fixture común bajo lector; Auth/HTTP simulado fuera de la aplicación. No se añadieron bypass de autenticación ni rutas demo al producto. Sin cambios remotos ni planes pagos.


## Registro de la etapa 8 — Cuentas y administración mínima

- La solicitud confirma listado/detalle y mantenimiento de clientes/custodios/equipos/comerciales/membresías/asignaciones. Lector consulta Configuración, admin modifica. La proyección del lector excluye cuentas/aliases exclusivos de preparación; las equivalencias con procedencia publicada (incluida versión reemplazada) o manual explícita se conservan. Originales de Revenue continúan reservados a admin, de acuerdo con el acceso definido por el proyecto; lector ve cifras/procedencia publicadas sin payloads.
- Identificador principal de presentación determinista: fuente Revenue, AUM, FA, manual; luego namespace, valor textual e ID. Sin referencia resuelta se muestra UUID. Es una elección de interfaz, no una nueva equivalencia o identificador canónico del negocio. Búsqueda literal insensible a mayúsculas, sin quitar ceros ni interpretar comodines.
- Rango mantiene atribución al cierre mensual. Listado muestra equipo/comercial de referencia al cierre y avisa cambios; detalle muestra cada mes y distingue contexto fuera del filtro. Cliente/servicio mantienen clasificación de cuenta sin historial propio, con efecto retrospectivo explícito en la revisión de cambios.
- Bajas lógicas de entidades/cuentas conservan hechos y vigencias; no excluyen importes ni reasignan historia. No hay borrado por API y la base impide borrar entidades. Relaciones nuevas no aceptan referencias inactivas; las existentes se conservan. Cuentas nuevas continúan por importación, sin alta financiera manual.
- Todo mantenimiento por API requiere preview y confirmación sobre el cambio concreto. Token privado de revisión, del autor, con vencimiento de 30 minutos y revisión del modelo basada en auditoría; un cambio concurrente exige revisar de nuevo. Se conserva lock transaccional compartido con publicación y guardado idempotente. Sin escrituras directas de catálogos/vigencias para authenticated, incluso admin. Triggers y constraints existentes comprueban referencias y solapamientos, incluido FA activo.
- Vista previa calcula el cambio real en una subtransacción que se revierte; la comparación usa todos los meses con hechos publicados activos, por cuenta, AUM/Revenue exactos y atribución anterior/propuesta. Límite explícito de 5000 cuenta-meses afectados; se rechaza superar el límite. Sin borrado automático de revisiones ni auditoría; retención sigue pendiente.
- Auditoría incorpora motivo a quién/cuándo/qué cambió. Las operaciones de importación y las anteriores conservan su trazabilidad propia aunque el nuevo campo motivo sea null. FA activo no se edita como una asignación manual: se corrige su importación versionada.
- Sin cambios de definiciones pendientes de negocio, roles autoasignables, edición de Revenue, exportación nueva, paquetes o despliegue.

## Registro de la etapa 9 — Exportación y validación integral

- CSV como formato MVP para resumen filtrado y tabla comercial, por solicitud expresa. Enlaces descargan todas las filas del desglose de la misma consulta/revisión, no solo la página visible. `formato=csv-completo` convive con `csv` paginado y JSON; no cambia definiciones de indicadores ni permisos. Una revisión financiera idéntica entre versiones sigue siendo válida según el contrato existente.
- Descarga en memoria hasta 10.000 filas, consultadas de a 250 bajo la sesión vigente. Al exceder el límite se pide acotar filtros (422), al cambiar datos 409; cualquier fallo/pérdida de acceso aborta antes de responder el archivo. Sin jobs, dependencias ni streaming parcial.
- CSV UTF-8 con BOM/coma/CRLF, decimales con punto sin conversión a Number, N/D separado de cero. Todas las celdas de texto se escapan y las peligrosas reciben apóstrofo; se conserva el número negativo legítimo como número. El CSV contiene los decimales originales de la consulta; para evitar redondeo de Excel al abrir/importar números extensos deben importarse como texto. Sin promesa de seguridad al volver a guardar/reabrir con cualquier hoja de cálculo.
- Incluye períodos, filtros por UUID/texto y etiquetas disponibles, revisión, fecha de publicación, filas totales/exportadas, USD y definiciones de AUM/Payout broker, variaciones, participaciones, atribución y cobertura observada. Originales, archivos y preparaciones no se incluyen en exportaciones de lectura, tampoco para admin.
- Corrección mínima de idempotencia de carga mediante octava migración: la comparación de retry excluye la clave `configuration` añadida por el parser y conserva la comparación del hash, nombre, tamaño y convenciones originales. Mantiene el ejecutor sin BYPASSRLS y los grants existentes. Regresiones reales SQL/HTTP antes y después de preparar/publicar.
- Verificación integral exclusivamente sintética local: PostgreSQL real para transacciones/restricciones/RLS, simulación explícita solo de Auth/red/bytes Storage. No se da por validada una importación con archivos reales ni servicios remotos. Muestras, definiciones comerciales, cobertura esperada y destino/operación siguen pendientes; no se ejecutó etapa 10.

## Registro de la etapa 10 — preparación operativa

- El dueño eligió la cuenta Vercel `franlang2209-8232` y autorizó crear `app-papa`.
  Creado/enlazado en ese equipo, Next.js/Node24.x, npm ci/npm run build verificados;
  sin despliegue ni datos. La CLI global apuntaba a Watchparty: se preservó y se usó
  un directorio de sesión separado con autorización del dueño. No se reutilizaron
  conectores de otras aplicaciones. IDs/dashboard en `progress.md`.
- Plan operativo/región/residencia/presupuesto/volumen sin confirmar. No upgrade ni
  costos nuevos autorizados; la cuenta Vercel sigue Hobby sin operar el negocio.
  Su restricción de uso comercial se documentó. Supabase dedicado pendiente.
- Prebuild bloquea Vercel sin destinos completos revisados y bases separadas por
  ambiente. La validación es de configuración, no acreditación de propiedad/Auth
  efectiva. Variables públicas/privilegiadas Supabase se rechazan; runtime solo URL
  y clave publicable con JWT de usuario. Origen registrado debe coincidir con Auth
  alojado, cuya configuración aún no se realizó.
- Se conservan límites2MiB/5.000 filas y chunks persistidos/reanudables250 filas;
  seis benchmarks sintéticos no equivalen a volumen representativo confirmado.
  Si se exceden límites, ampliar a subida directa privada autorizada/procesamiento
  persistido antes de admitir esos archivos, sin publicar trozos del mismo alcance.
- Operación/recuperación en `operations.md`. Sin plan elegido no se promete un backup
  remoto existente. SQL no respalda bytes Storage; mantener copia privada separada
  con manifiesto/hashes y ensayar restauración. Retención/RPO/RTO pendientes, sin
  automatizar borrados ni eliminar historia. Ningún mapeo comercial, vigencia o
  conciliación real se decidió por inferencia.

### Continuación: repositorio autorizado

El dueño eligió el repo público `FranciscoLang2209/gma-software` y pidió subir el
código y conectarlo al proyecto Vercel existente antes de crear la base. Se respeta
su visibilidad; no se publicó información financiera ni secretos, solo fixtures
identificados como sintéticos. Git inicializado y primer commit subido, sin forzar
historia ajena. El proyecto Vercel fue renombrado por el dueño a gma-software y conserva
su ID/cuenta: no crear un duplicado por el cambio de nombre. Conexión Git y próximos
pasos registrados en progress.md; la base todavía no existe.

Conexión final GitHub→Vercel verificada tras autorización de la GitHub App por el dueño.
Se mantienen builds protegidos por la configuración revisada y no se omite la base
para publicar una demo. Próximo paso autorizado en secuencia: crear/configurar Supabase
en una cuenta dedicada identificada por el dueño, con región/plan acordados.

El dueño confirmó Free ($0) y São Paulo para una base **de prueba** con sintéticos.
Esto resuelve plan/región de prueba; no define producción, capacidad representativa,
retención ni recuperación. Recurso nuevo vía Marketplace del equipo Vercel autorizado,
separado de las bases ajenas; no conectar credenciales privilegiadas automáticamente
al runtime de la aplicación.

### Entorno de prueba cerrado y correo diferido

Preview rama prueba usa exclusivamente Supabase Free sa-east-1 y Functions gru1.
Producción no recibe base ni variables de prueba. El dueño indicó el destinatario
administrador y decidió dejar SMTP pendiente; su correo no se publica en el repo.
Sin invitación/bootstrap hasta contar con las plantillas compatibles. La consola
Free actual exige SMTP propio para editarlas; no se cambió de plan ni implementó
un login alternativo para evitar ese requisito. Cuenta lectora sintética real usada
solo para verificar permisos, deshabilitada al terminar y sesión cerrada; no es un
administrador de negocio. Sin datos financieros reales ni publicados.


## Base compartida y despliegue Production — 2026-11-16

El dueño autorizó expresamente usar el recurso existente `gma-software-prueba`
(`zwdqnrbqqszjrtkhyqnz`, Free, São Paulo) tanto en Production como en Preview,
y publicar en producción. Esta decisión reemplaza el requisito anterior de bases
separadas para esos dos entornos; no crea recursos ni cambia planes. Ambos destinos
se registran con autorización explícita de base compartida. Se mantienen los controles
de proyecto/equipo, URL, clave publicable y rechazo de credenciales privilegiadas.
Las escrituras de Preview y Production afectan los mismos datos, usuarios y archivos.
SMTP, invitación y bootstrap de administrador siguen pendientes; desplegar no los valida.


## Acceso actualizado — 2026-11-16

Nombre visible: **gma-software**. El dueño eligió acceso con email y contraseña,
con cuentas creadas únicamente por administrador/operador, confirmadas durante
el alta, sin confirmación por mail. Se mantiene el registro público desactivado,
perfil habilitado y autorización en servidor/SQL/Storage. No se añadió panel de
usuarios ni credencial privilegiada al runtime. El operador crea la cuenta con
Auto Confirm User y asigna el perfil según [auth.md](auth.md); el bootstrap inicial
conserva bloqueo y rechazo de otro admin. SMTP ya no bloquea el login; recuperación
asistida por operador hasta configurar correo. Site URL remota y primer usuario
operativo aún requieren configuración y verificación efectivas.

## UI/UX — etapas 1 y 2, 2026-11-16

Por solicitud expresa: rediseñar sistema visual/navegación y Resumen, sin avanzar
con los flujos de las demás secciones. Navy, Inter local y Lucide; conservar Radix
Themes y Recharts. Versiones nuevas exactas: Inter Variable 5.3.0 y Lucide 1.73.0;
peers React compatibles comprobados en npm e instalación/build locales.
No cambian modelo, RPC, autorización, RLS, reglas, filtros ni exportación.
Distribución por custodio mediante el análisis existente; nunca sumar cuentas
paginadas en el cliente. Sin push ni despliegue autorizado en esta solicitud.
Próxima etapa de UI requiere revisión del resultado. Ver `ui-ux.md`.

## Continuación UI/UX — 2026-11-16

El dueño aprobó el rediseño inicial, solicitó push a main y continuar las etapas
siguientes. Push del commit `2475ab1` confirmado; GitHub reporta Vercel success.
Se autoriza implementar las cinco secciones del plan UI, denominadas etapas 3–7:
Análisis comercial, Cuentas, Importaciones, Correspondencias y Configuración.
Trabajadas en `codex/ui-ux-sections`, separadas de lo ya aprobado/publicado.
Mismos contratos, RPC, permisos y reglas; sin nuevas dependencias.
Los gráficos comerciales limitan la presentación a ocho grupos de la página y
explicitan su alcance; no calculan totales ni porcentajes desde filas paginadas.
La publicación de la continuación queda para revisión posterior.


## Cierre UI/UX — 2026-11-16

La lectura de main en GitHub confirma `0f87e48` con etapas UI/UX 1–7; reemplaza
el pendiente histórico de publicación de 3–7. El estado Vercel del commit es
`success`; no equivale a conciliación ni prueba financiera remota.
La solicitud de continuar se aplica al cierre de validación/accesibilidad del
rediseño existente. Se mantiene Radix/Recharts, sin dependencias nuevas ni cambios
de negocio, servidor o permisos. Ajustes locales de contraste y navegación por
teclado en `codex/ui-ux-final-validation`; publicación de este cierre pendiente.


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


## Presentación del login — 2026-11-16

Se extiende la identidad visual existente al login: Inter, navy, Radix y Lucide,
con ilustración SVG local abstracta sin cifras de negocio. El SVG se importa
estáticamente para emitirse bajo `_next/static` y estar disponible sin sesión,
sin ampliar excepciones del proxy. Estado local solo para visibilidad de contraseña;
useFormStatus para el envío. Credenciales y autorización siguen en la acción de
servidor existente. Sin proveedores visuales externos ni dependencias nuevas.


## Alta administrativa puntual — 2026-11-16

El dueño autorizó explícitamente habilitar como admin una cuenta Auth existente
indicada en el chat. Se verificó identidad/UUID, confirmación y contraseña, y se
creó el perfil habilitado en el Supabase dedicado, con auditoría existente.
No se registra correo/UUID personal en Git. Se mantiene la regla de `auth.md`:
altas o cambios de rol solo por operación explícita del dueño/operador, sin
autoasignación ni escritura de perfiles desde la aplicación.

## Plan de historia AUM y comisiones — 2026-11-17

Solicitud vigente: **solo planificación**, sin código funcional, migraciones ni
cambios remotos. Documento: [historical-imports-and-commissions-plan.md](historical-imports-and-commissions-plan.md).
La exclusión anterior de advisory/cobros se amplía únicamente para diseñar
expectativas y comparación con Revenue; no autoriza liquidación, pagos o bancos.

Confirmado en el pedido: conservar meses/años históricos de AUM; el saldo para
comisiones procede del Excel de comisiones, nunca del AUM de la app;
`Owner Name payout` identifica al beneficiario. Antecedente superado por la actualización Advisory posterior: Balance × tasa anual
y división por cuatro eran **regla preliminar**, pendiente de validar base bruta/neta,
unidad de tasa, elegibilidad, fechas, componentes y redondeo. No se sabe si existen
archivos de tasas anteriores; no aplicar condiciones actuales a períodos pasados.

Propuestas técnicas, todavía no implementadas: extender el importador existente
con operación padre y lotes por fuente/período/custodio, publicación conjunta
atómica y bloqueo de publicación individual de hijos; mantener scopes mensuales
AUM. Comisiones como snapshots completos por trimestre/custodio, beneficiario
independiente de comercial y conciliaciones reproducibles con versiones de origen.
No hay decisión financiera de que `Payout broker`, `NET Payout REP`, `PAGO OK`
u otro campo represente el cobro comparable de esa comisión. Métrica Revenue
global vigente sigue siendo `SUM(Payout broker)`.

Pendientes de negocio y condiciones para cada incremento en secciones 7–9 del
plan. La documentación no autoriza ejecutar las etapas propuestas.

## Implementación local autorizada: AUM histórico — 2026-11-17

El pedido posterior al plan autoriza implementar AUM histórico; comisiones conserva
su estado de planificación. Se implementa la etapa 1 y una estrategia acotada de
segmentación de archivos, sin ampliar los topes generales ni declarar capacidad
real validada. Una hoja/un custodio explícito por archivo conforme al contrato AUM
sin custodio. Múltiples custodios se cargan en archivos separados; no se agregan
columnas ni se infiere identidad. Hasta 120 períodos/5.000 filas y 2 MiB; preparación
reanudable de 250 filas/~1 MiB y publicación padre transaccional conjunta.

`import_uploads` es necesaria para vincular original, particiones/versiones,
coordenadas no enrutables, revisión completa y recuperación. Los hijos reutilizan
alcances, filas, correspondencias, comparación y publicador anteriores. Errores
cualquier partición/globales bloquean todo; ninguna entrada publica hijos por
separado. No se admite reemplazo mensual parcial: se muestran retiros y exige
confirmación de foto completa por mes y de reemplazos, sin interpretar omisiones
como cero ni intentar certificar la completitud real sin evidencia del operador.
No se crean períodos ausentes. Totales exactos; dashboards conservan cierre del
último mes, sin sumar fotos. Corrección versionada, sin borrar historia.

La migración y comprobaciones se realizan exclusivamente en entornos temporales
locales sintéticos. No se modifican Supabase/Vercel remotos, dependencias ni
lockfile. Muestras reales, capacidad histórica efectiva y despliegue siguen
pendientes de validación/autorización específica.


## Advisory por días reales — 2026-11-17

Pedido vigente reemplaza la fórmula simplificada anterior. Confirmado: tasas
Addepar siempre anuales; bruto = Assets Billed On × tasa anual × días reales/365,
incluso en bisiesto. Final = bruto + ajustes; un único redondeo al final por cuenta.
`Owner Name payout` es beneficiario; Balance del Excel solo es Assets Billed On
tras acreditar equivalencia semántica y fecha de corte. Nunca sustituir por AUM
ni usar tasas actuales para períodos históricos. Conservar 14 columnas originales.

Fórmula de ajuste informada: importe del flujo × applicable_rate × días restantes /
días del período. **applicable_rate no está definida**; no equipararla con annual_rate.
Pendientes: conversión/unidad de esa tasa, extremos del conteo de días, fees/signos,
base bruta/neta, cobertura de movimientos, escala/modo del redondeo y comparación
con Revenue por misma cuenta/período/tipo/beneficiario. Ausencia no certifica cero.
Revenue continúa como fuente de reales, con métrica global SUM(Payout broker);
no todo registro está acreditado como cobro comparable de Advisory. Diferencia
USD/% no es deuda automática.

Implementado únicamente helper bruto aislado con fracciones BigInt, inputs y
salidas monetarias textuales y tasa proporcional explícita. Redondeo configurable
de presentación half-away-from-zero, nunca insumo del final ni regla productiva
por defecto. Sin final automático, integración, nuevas tablas o migraciones SQL.
Plan M2/M2b/M3 y matriz de pruebas actualizados; no es autorización para sus etapas.
Ver detalles, estados y pendientes en `historical-imports-and-commissions-plan.md`.

## Motor trimestral y conciliación — solicitud vigente 2026-11-17

Confirmado por el pedido: Balance del Excel, Adv Fee / Retro anual, Owner Name
payout beneficiario, reales de Revenue; fórmula preliminar anual/4 y diferencias.
Versión `balance_annual_div4_v1` reemplaza ACT/365 únicamente en este motor.
Corte y trimestre explícitos con evidencia, sin trasladar fotos/tasas al pasado.
Fee type, elegibilidad y base bruta/neta/payout requieren revisión individual;
no hay regla universal validada por nombre. Toda incertidumbre queda Pending.

Decisiones técnicas implementadas: eventos inmutables/idempotentes, correcciones
con versión previa, clasificación explícita de movimientos vigentes y reserva
exclusiva por movimiento completo, lock transaccional del módulo, invalidación
por correcciones de cualquiera de las bases. Bandeja/API sólo admin al contener
análisis en revisión; lectores requieren publicación futura específica. Totales
únicamente comparables por base con cobertura; Missing actual no representa deuda.
Contrato, uso y supuestos abiertos detallados en [commissions.md](commissions.md).
No se implementó importador gráfico/XLSX ni liquidación; no se tocaron remotos.

## Módulo visual de comisiones y QA — 2026-11-17

- Solicitud vigente: cuatro vistas administrativas, exportación y validación
  integral local; sin despliegue ni datos reales. Se preserva todo el trabajo
  previo sin commit de historia AUM y motor de comisiones.
- Se mantiene la fórmula/base/evidencia del motor documentado en `commissions.md`.
  El módulo no cambia definiciones financieras ni considera Revenue completo como
  cobro comparable por defecto. Esperado verificado y esperado comparable son
  poblaciones explícitamente distintas; diferencia % usa este último.
- Consulta consistente en una sola foto PostgreSQL, agrupada por base económica;
  máximo explícito de 10.000 filas. Sin totales de balances de distintas fotos ni
  multiplicación por componentes. Decimales exactos hasta CSV; Number sólo gráfico.
- El permiso sigue siendo administrador porque las fuentes son análisis revisado
  con originales; no se habilita lectura global de preparaciones. Nuevo formulario
  de revisión llama al comando auditado existente. Sin roles desde user_metadata.
- CSV completo filtrado con revisión, protección de fórmulas y procedencia;
  resúmenes incluyen detalle para reconstruir las cifras.
- QA de comisiones vía API/RPC no certifica carga Excel/publicación de snapshot:
  adaptador/Storage y revisión del archivo completo siguen pendientes. QA real y
  habilitación remota permanecen como etapa separada expresamente no ejecutada.

## Autorización de esquema remoto GMA — 2026-11-17

El dueño confirmó aplicar al Supabase de GMA las tres migraciones locales de historia
AUM y comisiones. Alcance: sólo `gma-software-prueba` (`zwdqnrbqqszjrtkhyqnz`), sin
carga de datos financieros ni despliegue de aplicación. Aplicadas y verificadas,
11 versiones remotas coincidentes con el repositorio. Se alinearon los timestamps
nuevos del conector con los IDs canónicos de esos tres archivos mediante reparación
acotada del registro; no se modificó su SQL ni las ocho versiones previas.
Los avisos de Auth/rendimiento quedan registrados en `validation.md`; esta solicitud
no incluye cambiar planes, contraseñas/usuarios o rediseñar índices/políticas.


## Identidad SQL del ejecutor — diagnóstico 2026-11-17

No confundir SQLSTATE 42501 con rol de usuario incorrecto: también cubre permisos
internos ausentes. En Supabase GMA, postgres no puede conceder USAGE de auth al
rol ejecutor. Propuesta técnica probada localmente: helper SQL estándar invoker
preenlazado a auth.uid, sin SECURITY DEFINER adicional ni lectura de auth.users o
auth.sessions. Funciones compartidas conservan autorización existente. Aplicación
remota pendiente de autorización por rechazo de revisión automática; ver progress.md.


Actualización posterior, 2026-11-17: dueño autorizó aplicar la corrección compartida.
Migración prebind_session_identity aplicada en GMA (20261117201233), con permisos
y controles conservados y helper invoker comprobado bajo ejecutor sin sesión.
La pendiente anterior de autorización queda resuelta; falta verificar alta por UI.


## Carga de varios custodios implementada — 2026-11-17

Pedido posterior del dueño: eliminar el bloqueo que exige un custodio para un Excel
que contiene todos; continuó expresamente la implementación. AUM admite REF como
original acompañante por operación, sin un catálogo nuevo de referencias ni fechas
comerciales. Debe corroborar ambos identificadores, usar Broker y exigir custodio
único registrado. Revenue histórico usa CUSTODIO por fila, sin necesitar REF/AUM.
Se preserva el modo AUM de custodio único y los manifiestos anteriores.

REF queda congelado por hash/bytes y pares en la carga, privado y descargable para
admin. Las fórmulas/errores de Grupo de REF no intervienen en identidad; los tres
campos de identidad/custodio sí deben ser literales utilizables. No se aplican
Owner/Grupo/clientes a historia. Reutilizar referencias entre cargas futuras como
catálogo independiente queda fuera de esta ampliación.

Encabezados detectados/revisables, preámbulo conservado y exclusión explícita con
motivo sólo de anotaciones sin campos financieros. Identificadores numéricos,
importes faltantes y errores Excel de la fuente financiera continúan bloqueantes:
no se infieren ceros ni se relajan reglas para publicar las muestras reales.
Límites/uso en imports.md; pruebas e implementación efectiva en validation.md.


## Resumen histórico y timeout — 2026-11-17

La vista padre no recalcula la conciliación completa de todos los hijos al registrar/
inspeccionar un archivo. Muestra snapshot revisado de cada hijo y versión activa
actual; si falta revisión o quedó obsoleta, marca pendiente y exige revisarla.
Los cálculos/validaciones definitivos siguen en la revisión individual y publicación
conjunta. Timeouts/esperas conocidos devuelven 503 reintentable, preservando UUID;
no se atribuyen a límites del Excel ni se responde 409 genérico por cancelación SQL.
