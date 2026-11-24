# Calidad de datos — auditoría de Fase 1

Fecha: 2026-11-24 (Buenos Aires). Base de código: `40e95f7`; Git inicialmente limpio.
Destino verificado: conexión Supabase **app papa**, proyecto `gma-software-prueba`,
ref `zwdqnrbqqszjrtkhyqnz`, PostgreSQL 17.11, ACTIVE_HEALTHY. Es la base GMA
compartida con la aplicación; su nombre «prueba» no autoriza modificarla.

Continuidad Fase 4: nueva lectura agregada conserva los mismos 658 controles sin
discrepancias y los dos pares pendientes. Herramientas locales de dry-run y límites
de reparación real en [data-repair.md](data-repair.md); no se modificaron los datos.

Continuidad Fase 5: filtros REF separados y opciones financieras completas
implementados y verificados localmente; ver [data-quality-filters.md](data-quality-filters.md).
Los hallazgos sobre el runtime remoto no se marcan resueltos hasta aplicar la
migración y desplegar con autorización. Las identidades ambiguas siguen pendientes.

Continuidad Fase 6: [validación financiera](data-financial-metrics-validation.md)
con oráculo sintético independiente y nueva lectura agregada de 64 cohortes
trimestrales 2023–2026. Todas conservan sumas por fuente; 30 incompletas y 34 sin
hechos, ninguna calculable como grupo completo. Advisory T1/T2 2026 tiene 47/46
cuentas comparables matemáticamente con Fee; no acredita comparabilidad económica
ni completitud del grupo. La ponderación real grupal no es evaluable. No se cambian
datos ni reglas para producir un número; la migración REF sigue pendiente.

Continuidad Fase 8: [panel administrativo](data-quality-panel.md) local con relación
técnica por fuente/grano, pendientes, originales privados, importaciones y cambios
auditados. Equivalencias por lote limitadas a Revenue en preparación y a un alias
literal ya acreditado; sin modificaciones publicadas ni fusiones. Migración nueva
pendiente, sin consultas GMA o despliegue en esta fase. No se recalifican las cifras
reales de esta auditoría a partir de fixtures sintéticos.

## Alcance y método

Continuidad Fase 7: prevención implementada y verificada localmente en
[data-import-quality.md](data-import-quality.md). Se cierran diferencias de
validación REF/Master frente a entradas financieras y se hacen visibles los
identificadores sospechosos sin transformarlos. Staging, publicación y trazabilidad
reutilizados; sin reimportaciones o consultas remotas nuevas. Los dos pares y
pendientes económicos siguen sin resolver; no se modifica el diagnóstico histórico.

Auditoría de solo lectura de arquitectura, esquema remoto, importadores, relaciones,
consultas, filtros y causas de vacíos. No se aplicaron reparaciones, migraciones,
normalizaciones, publicaciones ni despliegues durante Fase 1. La continuación de
Fases 2 y 3 es local; ver [normalización](data-normalization.md) y
[motor de propuestas](data-reconciliation-engine.md). El plan está
en [data-reconciliation-plan.md](data-reconciliation-plan.md) y la evidencia de
checks en [data-quality-validation.md](data-quality-validation.md).

Se consultaron catálogos PostgreSQL y diagnósticos agregados mediante MCP. No se
exportaron originales, nombres, números de cuenta, UUID de personas/cuentas,
credenciales ni importes reales a archivos, fixtures o logs. Las comparaciones de
montos se ejecutaron dentro de PostgreSQL con `numeric` y devolvieron booleanos.
Son observaciones en varias consultas, no un snapshot transaccional único.

Los seis bloques de [audit-data-quality.sql](../scripts/audit-data-quality.sql)
quedan reproducibles; todos se ejecutaron contra GMA. Consultas complementarias
inspeccionaron catálogos, períodos originales, cobertura trimestral y límites.
Las lecturas privilegiadas no equivalen a una prueba de la sesión de un lector.

## Resultado cuantitativo por fuente

| Fuente / población | Registros | Relación confirmada en el modelo | Pendiente / observación |
| --- | ---: | --- | --- |
| AUM activo | 18.800; 745 cuentas | 18.800/18.800 con cuenta, custodio y fila fuente (100%) | 0 importes ausentes; 697 negativos conservados |
| Revenue activo | 17.893; 749 cuentas | 17.893/17.893 con cuenta, custodio y fila fuente (100%) | 12 Payout broker ausentes; 1.312 negativos conservados |
| REF actual | 807 filas | 773 filas con cuenta (95,79%); sin cuenta repetida no nula | 34 filas sin cuenta; 2 sin etiqueta comercial, 1 sin equipo y con error de grupo |
| Master publicado | 412 filas; 1 publicación | 392 filas con cuenta (95,15%) según resultado publicado | 20 sin cuenta, incluidas 8 Advisory; 12 Advisory con cuenta y sin tasa numérica |
| Tasas ROA | 2.624 referencias; 164 cuentas × 16 trimestres | Todas con cuenta y referencia Master/fila | 164/176 cuentas Advisory con tasa (93,18%); no acredita AUM/Revenue completos |
| Eventos Comisiones | 0 | No corresponde calcular porcentaje sobre cero filas | Tasas ROA publicadas no son eventos de expectativa/cobro/conciliación |
| FA fechado publicado | 0 | No hay asignaciones provenientes de FA | REF no sustituye FA fechado |

«Relación confirmada» aquí significa FK y resolución persistidas, no certificación
externa de que cada identidad económica es correcta. Los dos candidatos de identidad
descritos abajo conservan FKs válidas. Categorías pendientes pueden solaparse.

AUM y Revenue abarcan enero de 2023 a agosto de 2026. Hay **839 cuentas distintas**:
655 compartidas, 90 solo AUM y 94 solo Revenue. Ninguna se pierde por exigir ambas
fuentes. Todas tienen custodio existente y todas carecen de cliente canónico.
Hay 12 custodios, 0 clientes, 0 comerciales, 0 equipos, 0 asignaciones manuales y
0 membresías. Los equipos sin comerciales son 0 porque no existen equipos;
esto no representa cobertura comercial completa. Servicios: 176 Advisory,
663 `sin_clasificar` y 0 Brokerage.

REF cubre las 745 cuentas AUM y 683 de las 749 Revenue. Las 66 cuentas Revenue
sin REF contienen 139 movimientos: permanecen en los totales sin etiqueta.
De los 807 registros REF, 34 no tienen cuenta; los otros 773 corresponden a
773 cuentas distintas. No se detectó multiplicación por REF al relacionar cuenta.

## Hallazgos y causas raíz

### DQ-01 — Clasificación REF y relaciones canónicas distintas (prioridad alta)

`accounts.client_id` es NULL en 839/839 cuentas. No existen comerciales/equipos
canónicos ni vigencias. `aggregate_report`, `account_directory` y
`quarterly_roa_report` filtran por UUID de cliente/comercial/equipo; REF aporta
etiquetas literales para una clasificación separada. Buscar una etiqueta REF
no crea el UUID ni acredita una asignación histórica. Los filtros combinan AND.

Evidencia: catálogos remotos vacíos y todas las filas financieras sin cliente;
predicados de las tres RPC y explicación explícita en `ReferenceClassification`.
No es una FK rota ni un INNER JOIN accidental. Crear personas/asignaciones por
similitud de nombres cambiaría el contrato y podría atribuir historia falsa.
Propuesta: ofrecer filtros de referencia explícitos separados o completar el modelo
canónico con evidencia y vigencias; ver plan. Los importes sin asignar ya se conservan.

### DQ-02 — Servicio pendiente explica Brokerage vacío (prioridad alta)

Solo la publicación revisada de Master clasificó 176 cuentas como Advisory.
Quedan 663 sin clasificar, con 13.532 fotos AUM y 8.281 cuenta-meses Revenue.
No hay cuentas `Brokerage`; ese filtro devuelve vacío por falta de clasificación.
No se debe convertir automáticamente todo lo restante a Brokerage.
Cliente/servicio usan el estado actual, no una historia de dimensiones fechadas.

### DQ-03 — Dos candidatos de identidad por espacios (prioridad alta; revisión)

Hay 1.490 identificadores AUM y 839 Revenue, todos `resolved`. Dos identificadores
Revenue tienen espacios en los extremos. Al comparar **solo diagnósticamente**
`source + namespace + custodio + lower(btrim(original))`, aparecen 2 grupos con
2 cuentas cada uno: **4 UUID, 55 fotos AUM y 64 movimientos Revenue** afectados.
En cada par no se observaron meses compartidos dentro de una misma fuente;
eso no prueba identidad económica ni autoriza fusión.

La normalización actual conserva literalmente los identificadores. Un índice único
impide repetir la clave exacta resuelta por fuente/namespace/custodio, pero no una
variante con espacios. Estos grupos son `needs review`, no `auto-resolved`.
No se modificaron equivalencias, cuentas, fotos ni movimientos.

En los identificadores examinados: 0 caracteres de la lista invisible buscada
(NBSP, zero-width space/non-joiner/joiner, BOM), 0 notación científica y 0 secuencias
puramente numéricas de 16 o más dígitos. Hay 12 identificadores con cero inicial
en cada fuente (son aliases, no 24 cuentas independientes). No hubo colisiones
literales entre custodios para una misma fuente/namespace. Esa ausencia no permite
tratar los números como globalmente únicos.

El staging conserva 1.645 advertencias AUM y 584 Revenue de identificador numérico
aceptado expresamente. Son ocurrencias de celdas, no cuentas distintas. Sin cotejar
con el origen externo no puede descartarse una pérdida anterior de ceros/dígitos;
no se reconstruyeron. La búsqueda de invisibles es una lista explícita, no una
certificación de todas las categorías Unicode posibles.

### DQ-04 — Cobertura temporal y política de ROA (prioridad alta)

El rango por defecto de Resumen/Cuentas usa el mes actual en Buenos Aires:
noviembre de 2026 tiene **0 AUM y 0 Revenue**. Agosto de 2026 sí tiene 546 fotos
AUM y 352 movimientos Revenue. No debe arrastrarse agosto para llenar noviembre.
T3 2026 carece de septiembre; T4 carece de datos financieros y sigue abierto
al día de la auditoría. Una tasa publicada para T4 no provee esos hechos.

ROA usa `1200 × Revenue / suma de tres totales mensuales AUM` para expresar
porcentaje anualizado. Cada fuente se agrega antes de relacionarla; cada total/grupo
recalcula el ratio. Los umbrales son <0,40 / 0,40–0,60 inclusive / >0,60 mediante
productos cruzados. No se encontró promedio simple de ROA ni división binaria.

Además de exigir tres fotos AUM, la regla vigente invalida ROA si falta Revenue
en cualquier cuenta-mes incluido. Esto puede dejar el total N/D aunque varias
cuentas tengan ratio calculable. No se convirtió «sin movimiento» en cero ni se
cambió esa regla. Hace falta distinguir ausencia de archivo de ausencia legítima
de actividad mediante cobertura esperada acreditada antes de flexibilizarla.

Diagnóstico independiente con el mismo universo de trimestre + mes previo,
sin filtros de entidades y con clasificaciones actuales:

| Trimestre | Servicio | Cuentas observadas | Tres AUM completos | Tres Revenue completos | Ambas bases completas y AUM total positivo |
| --- | --- | ---: | ---: | ---: | ---: |
| T1 2026 | Advisory | 161 | 150 | 48 | 48 |
| T1 2026 | Sin clasificar | 433 | 391 | 118 | 117 |
| T2 2026 | Advisory | 161 | 151 | 47 | 46 |
| T2 2026 | Sin clasificar | 451 | 379 | 113 | 113 |
| T3 2026 | Advisory | 162 | 0 | 0 | 0 |
| T3 2026 | Sin clasificar | 411 | 0 | 0 | 0 |

T4 no tiene universo financiero observado, por lo que no produjo filas en este
diagnóstico. La tabla no son resultados de una RPC autenticada ni certifica ROA
económico. Fee ponderado requiere su propia población/base; la referencia simple
de una sola cuenta puede existir sin AUM completo. La metodología vigente está
en [quarterly-roa.md](quarterly-roa.md).

### DQ-05 — Comisiones vacío no significa ausencia de Revenue (prioridad media)

`commission_dashboard` usa `commission_report` y eventos de expectativas,
clasificación de cobros y conciliaciones. Hay cero eventos. La publicación Master
vigente tiene modo `rates_only`: produjo tasas ROA y clasificación Advisory, sin
fabricar cobros ni balances históricos. El vacío de Comisiones es consistente con
ese estado. No corresponde conectarlo automáticamente a todo Payout broker sin
resolver base, beneficiario y período comparables.

### DQ-06 — Selectores y correspondencias incompletos por límites (prioridad media)

`aggregate_report` devuelve hasta 100 opciones por selector desde la población ya
filtrada. Enero–agosto 2026, incluyendo diciembre previo para el universo, contiene
629 cuentas observadas. El selector no permite descubrir todas; el total financiero
sí abarca el conjunto completo. Las opciones dependientes pueden quedar vacías al
combinar filtros; el valor seleccionado se conserva como respaldo.

Correspondencias consulta solo los últimos 50 lotes y 200 cuentas/aliases;
existen 2.247 lotes, 839 cuentas y 2.329 aliases. Los últimos 50 lotes son AUM
publicado: el selector inicial no ofrece los 225 Revenue publicados. Un enlace
directo a un lote y el circuito histórico son caminos diferentes. Es una limitación
operativa real para revisar pendientes, no prueba de pérdida de hechos.
Propuesta: búsqueda/paginación en servidor y recuperación de selección por ID.

### DQ-07 — Suciedad de etiquetas y pendientes visibles solo en circuitos separados

REF tiene 12 filas con espacios en extremos y 6 con caracteres de la lista invisible.
No se encontraron grupos que difieran solo por `lower(btrim(label))` para la misma
dimensión; no se descartan variantes internas o semánticas. Los 12/6 pueden
solaparse. Custodios: 0 espacios extremos, 0 invisibles buscados y 0 nombres que
colisionen por trim/minúsculas. Clientes/comerciales/equipos no tienen filas que
comparar. No se propone fusionar personas por nombre.

Hay 689 lotes AUM y 900 Revenue `uploaded`, con cero filas preparadas declaradas.
Son preparaciones históricas conservadas, no 1.589 importaciones financieras
publicadas incompletas. Todas las 36.693 filas preparadas existentes están `valid`
y tienen resolución. REF y Master conservan pendientes fuera de ese staging.
El panel de calidad unificado solicitado todavía no existe.

### DQ-08 — Vacíos no distinguen completamente su causa (prioridad media)

Resumen muestra «Sin datos publicados para estos filtros» para cero filas de ambas
fuentes. Hay avisos de cobertura y errores técnicos separados, pero el resultado
vacío no distingue por sí solo «período inexistente», «filtros excluyentes» o
«clasificación pendiente». ROA sí distingue no_data, open_quarter, incomplete,
zero_aum, negative_aum y calculable; los errores de consulta tienen vía separada.
La fase posterior debe devolver evidencia de causa y conteos seguros, sin revelar
preparados/originales a lectores y sin tratar un error RLS/transporte como cero.

## Integridad financiera, modelo y esquema real

- **433 alcances AUM + 225 Revenue activos:** cero diferencias de suma decimal,
  recuento de hechos y cobertura de importes frente a la métrica revisada del lote.
- **44 meses:** al agregar independientemente por cuenta/mes y relacionar con
  cuentas y REF, las sumas mensuales de ambas fuentes siguen exactamente iguales
  a sus sumas directas. Esto no representa una reparación «antes/después».
- **0 claves AUM duplicadas** cuenta/mes en publicados. Revenue tiene 2.398
  cuenta-meses con varias filas, y 89 avisos de contenido repetido; se conservan
  íntegros y no se clasifican automáticamente como errores.
- **0 huérfanos** de cuenta/fila fuente en AUM/Revenue y 0 discrepancias de custodio;
  0 cuentas con custodio inexistente y 0 referencias de tasa con cuenta inexistente.
- **36.693 períodos originales:** mapping de headers presente, mes/año válidos y
  coincidentes con el período del lote. También coinciden los metadatos de staging.
  El dominio mensual impide fechas que no sean primer día de mes.
- **30 versiones de migración** remotas iguales a las 30 locales. Se inspeccionaron
  26 tablas privadas (RLS habilitado y forzado en todas), 176 constraints validadas,
  69 índices, 66 funciones públicas/privadas y 81 políticas entre app_private/Storage.
  Las cuatro vistas privadas financieras/de referencias son `security_invoker=true`.
- Cuerpos remotos de aggregate_report, quarterly_roa_report, account_directory,
  account_months, commission_dashboard y current_access coinciden con sus últimas
  definiciones locales directas. No se certificó un diff integral de todo el DDL:
  otras funciones son renombradas o reescritas por migraciones dinámicas. Una
  comparación ingenua de los últimos CREATE mostró diferencias explicables por
  esas transformaciones; no se reportan como drift confirmado.

Modelo: UUID de cuenta + custodio; aliases únicos resueltos por
fuente/namespace/custodio/literal. AUM tiene unicidad lote/cuenta/mes y ambos hechos
tienen FKs compuestas a cuenta/custodio, lote/alcance y fila original. Asignaciones
y membresías principales usan rangos sin superposición. Los INNER JOIN a lote y
alcance activo son el límite deliberado de publicación; los de cuentas/custodios
se apoyan en FKs NOT NULL verificadas. Cliente/comercial/equipo son LEFT JOIN y
solo excluyen al solicitar su filtro explícito. No se encontró exclusión silenciosa
por dimensión ausente en las consultas financieras revisadas.

## Arquitectura y prevención ya existentes

Next.js App Router 16.4.6, React 19.3.1, TypeScript; Supabase SSR con clave pública
y sesión del usuario; dependencias directas exactas y lockfile existente.
No se actualizaron versiones. Resumen/Análisis/CSV comparten `aggregate_report`;
Cuentas usa directorio/detalle y `account_months`; ROA tiene RPC independiente;
Comisiones usa su motor de eventos. No existen pantallas independientes AUM,
Revenue, Clientes, Custodios, Comerciales o Equipos: se cubren mediante vistas
financieras, Cuentas y Configuración.

`read.ts` conserva texto/metadatos de XLSX/CSV y limita archivos/expansión.
`validate.ts`, `historical.ts` y `master.ts` validan headers, cuentas, períodos,
importes y tasas sin ejecutar fórmulas/macros. Se conserva original privado, SHA,
hoja/fila, importación y actor. La normalización de headers/códigos de custodio
(trim/espacios/minúsculas) está duplicada en helpers de importación; los números
de cuenta siguen literales. Centralizar debe preservar esa diferencia de dominios.

Staging, preview, advertencias/bloqueos, revisión, publicación atómica, claves
idempotentes y restauración versionada ya existen. Las excepciones numéricas y
los 12 Revenue ausentes fueron revisados explícitamente en etapas anteriores;
la presente auditoría cuenta esas excepciones, no revalida económicamente los Excel.
Una fila Revenue conserva un aviso `excel_error` en metadatos no críticos.
No se requiere reemplazar el pipeline ni crear otro motor de publicación.

## RLS, errores, caché y rendimiento

`current_access` exige perfil habilitado y sesión existente/no vencida en
`auth.sessions`, sin autorizar mediante user_metadata. Las RPC comprueban acceso;
Comisiones/importaciones/administración son admin. Los wrappers son invoker y
los ejecutores privados usan search_path vacío. `anon` no ejecuta aggregate_report;
el ejecutor no tiene CREATE. Existe un único bucket privado y ningún público.
Authenticated tiene algunos GRANT SELECT privados, pero las políticas admin
restringen la lectura directa; un GRANT aislado no prueba que un lector vea filas.
No se probó una sesión remota admin/lector en esta etapa.

El cliente SSR fuerza `cache: no-store`; API y proxy usan respuestas privadas sin
caché. Paginación y CSV usan huella de revisión y no suman páginas para obtener
totales. No se identificó un fallback mock ni un límite PostgREST de 1.000 filas
recortando las agregaciones SQL; los límites de opciones son explícitos en DQ-06.

Advisors remoto: health sin avisos; security conserva 1 WARN de
[protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Performance señala 49 FKs sin índice cubriente (INFO), 14 casos auth_rls_initplan
(WARN), 5 índices sin uso (INFO) y 16 casos de políticas permisivas múltiples (WARN).
No son demostración de causa de vacíos ni autorización para eliminar índices o
relajar políticas. Medir planes/latencia con la sesión afectada antes de optimizar.
Referencias: [linter](https://supabase.com/docs/guides/database/database-linter),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Se consultaron logs de las últimas 24 horas del servicio: 18 entradas PostgREST,
14 PostgreSQL y 74 PgBouncer en la primera lectura; una entrada PostgreSQL de
severidad ERROR en otra lectura. No se extrajeron mensajes ni se atribuyó ese
error a la aplicación: la propia auditoría tuvo una consulta SQL diagnóstica fallida
y corregida. La ventana no demuestra el comportamiento de sesiones anteriores.

## Límites y conclusión de la fase

La causa principal comprobada es una diferencia entre clasificaciones disponibles
y dimensiones canónicas/fechadas, sumada a cobertura temporal y reglas de cálculo
explícitas. Hay suciedad puntual e identidades candidatas que merecen revisión,
pero no hay evidencia de huérfanos publicados ni de importes multiplicados en
los controles ejecutados. No certifica ausencia de cualquier defecto posible.

Falta QA remota autenticada/navegador, conciliación externa con originales,
resolución individual de los 2 pares/34 REF/20 Master y decisiones sobre vigencias,
servicio y cobertura esperada. Los resultados de build/typegen y el límite local
de PostgreSQL están detallados por separado en el registro de validación.
