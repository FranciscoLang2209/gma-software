# Rentabilidad / ROA trimestral — plan de implementación

Fecha: 2026-11-19 (Buenos Aires). Estado: **planificación; ninguna funcionalidad autorizada en esta etapa**.

> Continuación autorizada posterior: el backend/motor local se implementó por un
> nuevo pedido, sin interfaz ni cambios remotos. Contrato y límites vigentes en
> [quarterly-roa.md](quarterly-roa.md); resultados en progress.md y validation.md.
> Las decisiones económicas pendientes no se consideran confirmadas por autorizar
> el desarrollo técnico. El cuerpo siguiente conserva el plan original.

El pedido define una métrica de Revenue sobre activos, anualizada por cuatro. No equivale a rendimiento de cartera, utilidad neta, liquidación ni promesa de ingresos. El nombre visible será «Rentabilidad / ROA» acompañado por esa definición.

## 1. Diagnóstico del estado actual

Se inspeccionó el árbol local de `FranciscoLang2209/gma-software`, rama `main`, HEAD `ed09eff`, incluyendo modificaciones y migraciones todavía sin commit. `origin` coincide con el repositorio solicitado. No se hizo fetch/pull ni se consultó la base remota: este diagnóstico describe código y esquema declarados localmente, no certifica el estado de producción. El trabajo previo se preserva.

Se revisaron AGENTS.md, product.md, decisions.md, progress.md, aggregate-queries.md, commissions.md, data-dictionary.md y registros de validation.md. Las secciones antiguas de estos documentos son registros de etapas, no siempre el estado vigente: por ejemplo, hay publicaciones reales documentadas posteriormente a las advertencias iniciales de «sin base remota», y comisiones sí tiene tablas/RPC pese al diseño anterior del diccionario.

| Área | Evidencia del código actual | Consecuencia para ROA |
| --- | --- | --- |
| Stack | package.json: Next App Router 16.4.6, React 19.3.1, TypeScript, Supabase SSR, Radix Themes 3.3.0, Recharts 3.10.1; lockfile existente | Reutilizar dependencias. Son versiones declaradas, no compatibilidad nuevamente probada. |
| Hechos | Migración `20261111174240_financial_schema.sql`: `aum_monthly`, `revenue_entries`, vistas privadas invoker `aum_current`/`revenue_current`, punteros `import_scopes.active_batch_id` | Consultar solo versiones publicadas activas. AUM único por cuenta/mes; Revenue admite cada fila legítima. |
| Decimales | Dominio `exact_decimal` basado en numeric; JSON agregado con `::text` | Calcular en SQL; transmitir strings/null, sin Number para finanzas. |
| Consultas | `src/app/api/consultas/route.ts` → `queryReport` → `public.aggregate_report` | Valida filtros, perfil/sesión, revisión y páginas; errores explícitos 400/401/403/409/503/504 y no-store. Sirve como patrón, no como cálculo trimestral listo. |
| Aggregate vigente | Último reemplazo local: `20261119011514_report_revision_stream_hash.sql`, posterior a atribución por conjuntos y snapshot REF | Agrega fuentes independientemente por cuenta/mes, FULL JOIN, matriz de meses y atribución mensual. Total AUM = cierre final; no es promedio trimestral. Revisión usa hashes ordenados. |
| Atribución | `aggregate_report` selecciona FA publicado con prioridad sobre asignación manual principal; equipo por membresía principal `[desde,hasta)` al cierre mensual | Conservar la política mes a mes, incluidos nulos; no usar el equipo al cierre del trimestre para todo el flujo. |
| Helpers | `account_months` en `20261115174622_accounts_administration.sql` agrega fuentes y llama `advisor_at` por cuenta/mes | Es reutilizable semánticamente, pero recorre cuentas y no contiene el enfoque por conjuntos del aggregate optimizado. No adoptarlo sin medir ni refactorizar reportes existentes por anticipado. |
| Comercial | `/analisis-comercial`, `commercial-overview.tsx`, `report-screen.tsx` y `report-view.tsx` usan cierre AUM y Revenue del rango | Mantener sus cifras, filtros, comparaciones y CSV. ROA debe tener contrato propio. |
| Dimensiones | `accounts.client_id` y `accounts.service` son actuales, sin vigencia propia. Servicio es texto libre, default `sin_clasificar` | No existe garantía de catálogo Advisory/Brokerage ni de clasificación histórica o segregación por operación. |
| REF | `20261118211139_reference_snapshot_classification.sql` y reporte vigente: etiquetas Client/Owner/Grupo en snapshot sin vigencia | No acredita identidades ni asignaciones pasadas. No usar REF para rellenar filtros históricos. |
| Comisiones | `20261117175338_commission_reconciliation.sql`, `20261117181230_commission_dashboard.sql`, `/api/comisiones`, `/comisiones` | Existe motor trimestral y bandeja administrativa; no hay importador Excel completo ni publicación de tasas para lectores. |
| Tasas | `commission_events` inmutables; `commission_current` selecciona última revisión por operación/target. `expected` contiene annual_rate, quarter, cutoff, basis, fee_type, component_key y evidencia | Hay candidatos de tasas por obligación, no una tasa única acreditada por cuenta ni intervalos diarios generalizados. `verified` no prueba por sí solo comparabilidad económica con ROA. |
| Seguridad | `getAccess` valida usuario y `current_access`; wrapper invoker y ejecutor privado NOLOGIN/NOBYPASSRLS, search_path vacío; comisiones comprueba admin también en SQL/RLS | Lectores no pueden consumir `commission_dashboard` ni sus originales. No ampliar esas políticas para resolver el nuevo reporte. |

`docs/progress.md` registra historia financiera y REF cargados, faltantes y ausencia de historia comercial acreditada; también un problema reciente de timeout y su optimización. Son antecedentes documentados, no comprobaciones remotas repetidas aquí. La cobertura real de servicios y tasas para cada trimestre sigue sin acreditarse con esta inspección.

### ¿Payout broker sirve para ambos servicios?

**Resultado de la inspección: no alcanza la evidencia para confirmarlo.** Es la métrica general vigente y el único importe Revenue normalizado (`payout_broker_usd`). Los 29 originales no incluyen un servicio por movimiento, Fee type ni fecha de devengo/cobro confirmada. GROSS/TOTAL/NET Payout REP permanecen texto original.

Comisiones permite clasificar movimientos con distintas métricas y bases, con evidencia, y un trimestre devengado que puede diferir de MES/AÑO. Esto demuestra que no se puede equiparar automáticamente su «cobro comparable» con el Revenue del trimestre del nuevo módulo. Tampoco confirma que Payout broker mida el mismo ingreso económico en Advisory y Brokerage.

Antes de habilitar ROA real por servicio: conciliar privadamente muestras de ambos servicios/custodios con totales conocidos; documentar qué representa Payout broker, qué conceptos incluye y el criterio temporal. Si no sirve para Advisory, acordar una métrica normalizada y su importación/versionado específicos. No convertir otros campos ni usar comisión esperada como Revenue real. El dashboard general conserva SUM(Payout broker).

## 2. Arquitectura propuesta

Flujo: `/rentabilidad` (Server Component con acceso validado) → adaptador servidor compartido con `GET /api/rentabilidad` → `public.quarterly_roa_report` → implementación privada con ejecutor existente sujeto a RLS → hechos activos agregados y, cuando exista, proyección publicada de tasas.

La nueva RPC es una consulta estable de solo lectura. Total, serie de los tres meses, cobertura y filas paginadas salen del mismo snapshot SQL. No llamar tres veces al reporte mensual ni calcular sobre páginas, JSON del dashboard o detalle de comisiones en el navegador. No cambiar firma/cuerpo/semántica de `aggregate_report` para incorporar otra interpretación de AUM.

Reutilizar el patrón por conjuntos del reporte vigente: limitar por trimestre/custodio/cuenta, agregar cada fuente por cuenta/mes antes de unirlas, resolver atribución y filtrar, y luego agregar. Una CTE acotada para el nuevo reporte evita inicialmente modificar consumidores existentes. Extraer un helper común solo si la implementación demuestra necesidad y conserva resultados/permisos con regresiones.

Propuesta de acceso: admin y reader ven la misma proyección financiera publicada; tasas y comparaciones solo después de una publicación explícita apta para lectores. Preparación, evidencia cruda, archivos y comisiones siguen exclusivos de admin. Si el dueño prefiere otro alcance de lectura de tasas, resolverlo antes de esa etapa.

## 3. Fórmulas y reglas de negocio

### Período, conjunto y grano

- Trimestres calendario: Q1 enero–marzo, Q2 abril–junio, Q3 julio–septiembre, Q4 octubre–diciembre. Mes financiero según `period`, sin reinterpretarlo como fecha diaria de cobro.
- Año y trimestre identifican exactamente tres meses; no hay rango arbitrario. Propuesta inicial: trimestre calendario actual de Buenos Aires, avisando si está abierto; no buscar otro con datos silenciosamente.
- Los filtros opcionales de equipo, custodio, cliente, comercial, cuenta y servicio se combinan con AND; sin filtro incluye nulos/sin asignar. Año/trimestre siempre se resuelven y validan en servidor y SQL.
- `I(a,m)` indica pertenencia al conjunto filtrado en el mes m. Para comercial/equipo depende de vigencias al último día del mes, igual para AUM y Revenue. Un mes excluido por filtro no es un dato financiero ausente: no aporta al grupo. Un mes incluido sin snapshot sí es faltante.
- Conservar cuentas solo-AUM, solo-Revenue y sin clasificación en totales sin filtro. No exigir intersección de fuentes para mejorar artificialmente el ROA. Con servicio específico, mostrar además cobertura de clasificación del universo previo a ese filtro para hacer visible lo excluido por desconocido.

### AUM y Revenue

Para cada mes, `A_m = SUM(AUM[a,m])` del conjunto filtrado. Para el trimestre:

```text
S = A_1 + A_2 + A_3
AUM_promedio_trimestral = S / 3
Revenue_trimestral = SUM(Revenue[a,m]) para los tres meses y cuentas incluidas
ROA_anualizado_porcentaje = Revenue_trimestral × 4 × 100 / AUM_promedio_trimestral
                          = Revenue_trimestral × 1200 / S
```

El divisor de AUM siempre es tres, nunca cantidad de filas, meses disponibles o meses de permanencia en un equipo. No usar AVG sobre snapshots existentes: omitiría faltantes y ponderaría meses según cantidad de cuentas. Se promedian los tres totales mensuales completos. Para una cuenta individual con tres fotos presentes coincide con el promedio de sus tres snapshots.

Revenue conserva todas las filas físicas, incluso idénticas y ajustes negativos; no deduplicar por ticket, contenido o cuenta/mes. Propuesta temporal inicial: sumar MES/AÑO publicado, sin desplazar por conciliaciones de comisiones. Pendiente confirmar el devengo requerido.

**Nunca promediar ROA individuales.** Cada total/desglose calcula su ratio con sus propios sumandos agregados antes de paginar. Los AUM promedio y Revenue son aditivos entre grupos disjuntos; los ratios y conteos distintos no lo son. Grupos con faltantes pueden no tener ratio aunque el global sí tenga datos financieros suficientes y la clasificación sea desconocida.

### Precisiones y semáforo

Sumas/productos en numeric sin escala monetaria impuesta. Conservar `S`, divisor 3, Revenue y numerador/denominador ROA en la salida trazable: divisiones periódicas tienen precisión decimal finita de PostgreSQL, no una fracción infinita exacta. Calcular ROA directamente como `1200 × Revenue / S`, evitando dividir por un promedio previamente redondeado. Transporte string/null. Redondear solo presentación con helpers decimales existentes; propuesta: importes a centavos y tasas/ROA a dos decimales, con valor de mayor precisión accesible.

| Condición sobre ROA porcentual válido | Etiqueta | Color |
| --- | --- | --- |
| menor a 0,40 | Bajo | Rojo |
| desde 0,40 hasta 0,60, inclusive | OK | Verde |
| mayor a 0,60 | Muy bien | Azul |

Decidir la categoría antes del redondeo visual. Con S positivo, comparar `1200 × Revenue` contra `0.40 × S` y `0.60 × S` para no depender de una división redondeada. Mostrar texto además de color. N/D o cobertura insuficiente no llevan categoría. Brokerage muestra ROA; Advisory agrega tasa y diferencia cuando sean comparables.

### Ausencias y denominadores: propuesta a confirmar

Mostrar siempre subtotales conocidos y conteos de filas/importes/faltantes. Separar estado de cálculo (`calculable`, `incomplete`, `zero_aum`, `negative_aum`, `no_data`) de cobertura contractual (`unconfirmed` o acreditada). No declarar completitud porque hay tres publicaciones.

- Falta un mes completo, un snapshot esperado, un importe AUM/Revenue, o confirmación de ausencia de movimientos: ROA oficial y semáforo N/D. Conservar el detalle; no fabricar un ratio mezclando poblaciones completas e incompletas. Se puede avanzar con validación sintética aunque falte evidencia real.
- Una fila publicada con importe cero es información presente. Ninguna fila Revenue no acredita Revenue cero. Si se necesita representar «sin movimientos», requerirá confirmación administrativa versionada por alcance y universo definidos; no inferirlo de archivo vacío ni sobrecargar el actual importador, que rechaza publicaciones vacías.
- AUM promedio cero: ROA N/D, aun Revenue cero; Revenue se muestra. Promedio negativo: conservar montos, propuesta ROA N/D hasta acordar interpretación. Revenue negativo con base positiva: ratio negativo válido y Bajo. Snapshots negativos subyacentes se señalan aunque S sea positivo; no descartarlos.
- Trimestre abierto: sin extrapolación de meses faltantes, sin anualizar un acumulado parcial como si fuera un trimestre completo. Recomendación: ROA N/D hasta cierre y cobertura revisada.
- Cuentas nuevas/cerradas: sin historia de actividad no presumir cero en meses ausentes. Solicitar evidencia de meses fuera de actividad; no copiar primer/último saldo.

La política estricta anterior es una recomendación, no una regla histórica ya aprobada. La publicación actual no contiene un contrato completo de cuentas esperadas ni certificación de meses sin movimiento: hay que definirlo en etapa 1. Sin ello puede haber subtotales calculables técnicamente, pero no un ROA presentado como completo/verificado.

## 4. Fuentes de datos a reutilizar

| Fuente | Uso permitido | Límite |
| --- | --- | --- |
| `aum_current` | Snapshots mensuales USD activos | No Balance de comisiones ni arrastre. |
| `revenue_current` | Movimientos publicados y payout normalizado | Métrica por servicio y fecha económica pendientes de confirmación. |
| `import_scopes`, `import_batches` | Punteros/versiones, publicación y cobertura fuente/mes/custodio | Publicado no prueba universo completo. No devolver originales al reader. |
| `accounts`, `custodians`, `clients` | UUID, custodio, cliente y servicio | Cliente/servicio actuales; no historia inferida. |
| `fa_rows` activos, `account_assignments`, `advisor_group_memberships` | Atribución principal al cierre mensual | Evidencia fechada; FA sin cobertura puede dejar nulos. |
| `commission_current` y `commission_events` | Candidatos revisados de tasa y referencias de versiones para preparación admin | No consulta directa desde reader ni unión libre de obligaciones a hechos. |
| `reference_current` | Contexto separado si se muestra | No filtro histórico ni sustituto de cliente/comercial/equipo formal. |

Identificadores externos se mantienen textuales y por namespace/custodio; joins financieros por UUID. Un alias o etiqueta no crea otra exposición ni otra fila de ingreso.

## 5. Decisiones pendientes y supuestos

| Prioridad | Confirmación necesaria | Recomendación / impacto |
| --- | --- | --- |
| Bloquea Revenue por servicio | ¿Payout broker mide el ingreso de la empresa para ambos servicios? ¿Qué período corresponde a ese ingreso? | Confirmar con muestra y conciliación por servicio/custodio; mantener MES/AÑO salvo evidencia y nueva regla explícita. |
| Bloquea clasificación fiable | ¿Cada cuenta tiene un único servicio para todo el trimestre/historia? ¿Existen cuentas mixtas y cambios? ¿Qué valores literales son Advisory/Brokerage? | Usar `accounts.service` solo si se acepta su alcance actual. Para mixtas hace falta asignación explícita tanto de activos como ingresos; no repartir por importe ni duplicar AUM. |
| Bloquea interpretación histórica | ¿Se acepta cliente/servicio actuales etiquetados como tales, o se requiere vigencia? | No prometer historia que el modelo no tiene. Si se exige, agregar historial explícito solo al módulo nuevo antes de activarlo, sin cambiar el dashboard. |
| Bloquea ROA validado | Universo esperado por mes/custodio, altas/bajas, certificación de cero Revenue, política de trimestre abierto/faltantes/negativos | Recomendada política estricta de sección 3, con subtotales y N/D. No ocultar cuentas incompletas para publicar un ratio. |
| Bloquea comparador Advisory | ¿Adv Fee / Retro es fee del cliente, retro, neto de empresa o payout? ¿Qué Fee type/base es comparable con Revenue? ¿Hay tasas escalonadas/componentes? | Revisar evidencia por cuenta/trimestre; ninguna tasa universal o heredada por defecto. |
| Bloquea tasa agregada | ¿Se aprueba ponderar por AUM mensual y usar solo vigencias acreditadas? | Fórmula de sección 7; cobertura completa para diferencia global. Tasas parciales solo en panel identificado con misma población. |
| Bloquea diferencia visible | Signo y unidad de diferencia | Propuesta `ROA real − Fee anual`, en puntos porcentuales: negativo indica ROA por debajo de referencia. No diferencia monetaria ni porcentaje relativo. |
| Bloquea lectura de tasas | ¿La tasa publicada y su diferencia pueden ser vistas por lectores? | Mantener acceso global publicado; evidencia/originales y administración siguen privados. Sin aprobación, no exponer tasas a reader. |

Supuestos técnicos resolubles sin nueva decisión: endpoint/RPC independientes, numeric/text, calendario trimestral, filtros AND, páginas de 25 en UI y máximo 250 en RPC siguiendo límites existentes, y sin dependencias nuevas. Sin filtro de servicio: presentar Advisory y Brokerage separados y una cobertura de sin clasificar; un eventual total combinado es ratio de totales, sin Fee agregado entre servicios.

## 6. Cambios necesarios en SQL, backend y frontend

### SQL (futuros, no creados aquí)

1. Nueva migración incremental generada por CLI para `quarterly_roa_report`; fechas trimestrales tipadas, UUID opcionales, servicio validado y dimensión permitida, paginación/revisión. Validar año entre 1900–9998 y trimestre 1–4 en ambas fronteras; rechazar parámetros desconocidos/repetidos en HTTP.
2. CTEs: tres meses → agregados independientes AUM/Revenue → universo observado (trimestre más mes previo como señal de ausencias, no parte de la fórmula) → matriz cuenta/mes → asignación/membresía al cierre → filtros → métricas mensuales/trimestrales y cobertura → categorías → filas/página. Contrato de población esperada acreditada complementa ese universo; nunca declarar completa una cuenta solo porque nunca apareció.
3. Usar prioridad FA/manual del aggregate vigente y restricciones contra solapamientos. Asegurar una atribución por cuenta/mes y una tasa efectiva por cuenta/mes antes de unir; no sumar obligaciones/tasas repetidas como hechos financieros.
4. Respuesta propuesta: período/meses/filtros, `formula_version`, `attribution=month_end`, base temporal de cliente/servicio, `total`, filas por cuenta/servicio, serie de 3 meses, cobertura de publicaciones/importes/clasificación, motivos N/D, tasa/diferencia/cobertura de tasa, revisión y última publicación. Campos financieros como strings/null. Total independiente de página; revisión cubre hechos, etiquetas, filtros, vigencias, tasas publicadas y confirmaciones de cobertura.
5. Wrapper público invoker, implementación privada con ejecutor existente, sesión/perfil comprobados y search_path vacío; revocar EXECUTE PUBLIC/anon/service_role y otorgar solo authenticated con comprobación efectiva en SQL. RLS forzado y políticas mínimas para proyección publicada. Nuevas vistas invoker. Mantener helper de identidad de sesión vigente, sin nuevos permisos sobre Auth.
6. Si se aprueba comparador para lectores, agregar publicación versionada de tasas descrita abajo; no dar al reader SELECT sobre `commission_events` ni relajar su RLS admin. Si se aprueban certificaciones de cobertura o historia de servicio, añadir su persistencia auditada y permisos acotados antes de depender de ellas.
7. Medir consulta interna con EXPLAIN (ANALYZE, BUFFERS) local con rol/sesión y volumen representativo. No aumentar timeouts ni crear índices sin evidencia; revisar índices existentes por período/custodio/cuenta y vigencias. El mes previo solo aumenta señales de cobertura, no los sumandos.

### Backend (rutas/nombres propuestos)

- `src/lib/roa/contracts.ts`: parser/DTO específico; reutilizar validadores y formatos existentes cuando sean adecuados sin cambiar su contrato general.
- `src/lib/roa/server.ts`: llamada SSR a nueva RPC con JWT del usuario, sin service_role ni fallback demo.
- `src/app/api/rentabilidad/route.ts`: GET privado/no-store, mismo contrato que página; errores 400, 401, 403, 409, 503 y timeout 504, sin detalles internos ni resultado parcial. No pasar por `/api/comisiones`.
- Cargar total/serie/cobertura en una llamada; páginas siguientes requieren revisión. Cambiar un filtro reinicia offset/revisión. Opciones por UUID observadas y acotadas como hoy, con aviso si no son catálogo completo y posibilidad de conservar un UUID seleccionado.
- Publicación administrativa de tasas, si se aprueba: comandos revisados con motivo/actor, revisión e idempotencia; ninguna escritura por GET. Cambios de preparación no afectan lectura publicada.

### Frontend

> Continuación implementada por pedido explícito el 2026-11-20: ver
> [quarterly-roa.md](quarterly-roa.md#frontend-local--2026-11-20). Se conserva este
> plan como referencia; el backend vigente determina los campos disponibles.
> Las tres fotos por cuenta se consultan al seleccionarla, sin modificar el contrato.
> CSV sigue sin soporte; no se habilitó producción ni se resolvieron pendientes económicos.

- Página `src/app/(workspace)/rentabilidad/page.tsx` y enlace «Rentabilidad / ROA» en `navigation.tsx`; `requireAccess()` y Layout existentes. La tasa respeta permisos aún si se visita directamente por URL/API.
- Filtros combinables en URL: año, trimestre, equipo, custodio, cliente, comercial, cuenta, servicio. Servicio permite Advisory/Brokerage y contexto de sin clasificar; no renombrar textos históricos en lote. No convertir un rango arbitrario de navegación en trimestre sin regla explícita; conservar filtros de entidad compatibles y mostrar el trimestre seleccionado.
- KPI de AUM promedio, Revenue trimestral, ROA anualizado y cobertura. En Advisory, Fee anual acreditado/ponderado y diferencia en pp. Tabla por cuenta con tres snapshots, Revenue, ratio, estado y motivos de faltantes; total sobre todo el conjunto. Vista por servicio para comparación inicial, sin agregar nuevos rankings no pedidos.
- Reutilizar PageHeader, MetricCard, Select, Table de Radix Themes, formatos exactos y estados de carga/error/vacío. Recharts solo para representar cifras ya calculadas: snapshots/Revenue en paneles separados y ROA frente a Fee en escala porcentual. Number únicamente para coordenadas finitas; tooltip y tabla textual exactos; null sin punto ni línea atravesando faltantes.
- Texto de categoría además del color, contraste, etiquetas de filtros, teclado/foco y tabla alternativa. Trimestre abierto y cobertura parcial visibles. La comparación de Fee es referencia económica, no conciliación automática con el Balance de comisiones.
- CSV propio no está pedido: diferirlo; no reutilizar el CSV actual con encabezados AUM al cierre para esta métrica.

## 7. Estrategia para Advisory Fee

### Elegibilidad y fuente

Usar los eventos `expected` vigentes solo como candidatos administrativos: misma cuenta/custodio/trimestre, tasa anual normalizada, evidencia `confirmed_for_quarter`, regla/eligibilidad revisadas y base económica acreditada como comparable con el Revenue ROA. `verified=true` es condición útil, pero no demuestra que un retro o payout representante sea fee bruto del cliente.

No usar `cutoff` del Balance como comienzo de vigencia de tasa. Una evidencia válida para Q1 no autoriza Q2 ni años anteriores. Ante múltiples owner/basis/fee_type/component_key, el operador debe seleccionar/acreditar la referencia efectiva; no elegir la primera/última obligación ni sumar tasas porque hay varios beneficiarios. Si son componentes aditivos o escalas se necesita regla explícita y exposición asignada sin doble conteo; hasta entonces tasa N/D.

### Publicación apta para lectores

Propuesta mínima tras confirmar el alcance: snapshot versionado por trimestre/custodio, filas únicas por cuenta/mes con tasa proporcional acreditada, referencia a evento/versión fuente, período de validez acreditado y actor/motivo. Cabecera con estado de preparación/revisión/publicación y puntero activo del alcance. La proyección pública solo devuelve tasa, período, cobertura e identificador opaco de versión; evidencia, nombres de archivo y originales quedan privados.

No hace falta un nuevo parser Excel para probarlo sintéticamente: preparación administrativa desde eventos ya revisados, selección explícita y publicación atómica/idempotente del conjunto revisado. Cambios/correcciones crean versiones; sin borrar historia ni afectar otros custodios. Una nueva revisión del evento fuente marca la referencia publicada como obsoleta para comparación hasta revisarla; nunca sustituir la tasa silenciosamente. La huella del reporte y cobertura deben reflejar esa invalidación. Si no hay fuente admisible, mostrar N/D; no copiar una tasa actual.

Este circuito no existe hoy: su implementación es una etapa separada. Si se pretende cargar archivos reales nuevos de tasas, debe añadirse primero el adaptador privado con bytes y conciliación, porque los metadatos de un evento no certifican un archivo subido.

### Ponderación y diferencia

Con `r[a,m]` como tasa anual proporcional acreditada, misma población/atribución que el ROA, y AUM conocido:

```text
Fee_anual_ponderado_porcentaje = 100 × SUM(AUM[a,m] × r[a,m]) / SUM(AUM[a,m])
Diferencia_pp = ROA_anualizado_porcentaje − Fee_anual_ponderado_porcentaje
```

Con tasas constantes por cuenta equivale a ponderar por AUM promedio trimestral. No es promedio simple de tasas ni ponderación por Balance de comisiones o Revenue. Las tasas no se multiplican por cuatro: ya son anuales. Advisory con una sola tasa acreditada presenta esa tasa; con distintas tasas presenta explícitamente «ponderada por AUM».

Propuesta: publicación de una tasa acreditada para trimestre completo, o por mes si existe evidencia específica; no inventar ponderación diaria ante cambios intrames. Un cambio intrames exige acordar qué tasa aplica al snapshot y al comparador económico antes de calcular. El numerador ponderado solo admite pesos no negativos y denominador positivo; si hay AUM negativos, conservarlos en la información financiera, pero dejar comparador N/D hasta acordar metodología.

Reportar cuentas y exposición AUM con/sin tasa, tasas conflictivas/obsoletas y base comparable. Si falta tasa en exposición positiva, no mostrar Fee ni diferencia como globales. Opcionalmente mostrar un subconjunto rotulado de cuentas con tasa con **su propio ROA, Revenue y AUM**; jamás restar un Fee de subconjunto al ROA de todo el conjunto. La primera versión puede limitarse a N/D y cobertura para mantener claridad.

Ejemplo sintético: AUM constante 100.000 con Fee 0,5% y 300.000 con Fee 1% → Fee ponderado 0,875%. Con Revenue trimestral total 875 → ROA 0,875% y diferencia 0 pp. Promediar las dos tasas daría 0,75%, que sería incorrecto.

## 8. Casos límite y cobertura histórica

| Caso | Tratamiento propuesto |
| --- | --- |
| Mismos identificadores en custodios distintos; varios aliases | UUID/custodio y hechos activos únicos; aliases solo para etiquetas/búsqueda. |
| Revenue idéntico repetido, ajustes negativos, varias líneas por mes | Conservar multiplicidad y signo; agregar antes de cualquier join. |
| Solo-AUM / solo-Revenue | Conservar importes y cobertura; ROA N/D cuando la otra base no está acreditada. |
| Alta/baja, un mes faltante o importe null | No dividir por 1/2 ni completar con cero. Evidencia de población fuera de actividad requerida. |
| Cambio de equipo/comercial en el trimestre | Atribuir cada mes por su cierre; AUM promedio del grupo divide por tres. La cuenta puede aparecer en más de un grupo; conteo no aditivo. |
| Sin asignación histórica, REF actual disponible | Mantener sin asignar; REF separado. Filtrar por un equipo no recupera automáticamente esos meses. |
| Cliente/servicio cambia o cuenta mixta | Limitación explícita de modelo actual; bloquear atribución histórica prometida sin regla/datos. No asignar Revenue por descripción libre. |
| Mes Revenue diferente de trimestre conciliado | No mezclar períodos; confirmar criterio ROA y documentar diferencia con Comisiones. |
| Varias obligaciones, tasas o bases para una cuenta | Resolver referencia/composición explícita antes de unir al grano cuenta/mes. No multiplicar exposición. |
| Publicación corregida o tasa obsoleta | Usar activo, invalidar revisión/página y comparador afectado; no mezclar versiones ni borrar previas. |
| Denominador diminuto, negativo, cero o resultado extremo | No truncar a un rango visual; aplicar estados acordados, preservar decimal y avisar limitación del gráfico. |
| Sin datos o filtro sin coincidencias | Vacío con período/filtros, sin totales cero inventados ni categoría. |

Cobertura histórica deberá inventariarse por fuente/custodio/mes y por tasa/servicio/asignación antes de anunciar años disponibles. La historia documentada no acredita tres fotos y tasas para cada cuenta de cada trimestre. No extender snapshots REF, tasas actuales o equipos actuales hacia períodos pasados.

## 9. Plan dividido en etapas

Todas las etapas siguientes requieren una solicitud posterior de implementación; este documento no las ejecuta ni autoriza cambios remotos.

| Etapa | Entrega | Pruebas y criterio de aceptación |
| --- | --- | --- |
| 0. Plan actual | Diagnóstico, propuesta, bloqueos y continuidad documental | Revisión de referencias contra árbol local y diff documental; cero cambios funcionales, migraciones nuevas o acciones remotas. |
| 1. Contrato económico y cobertura | Respuestas de sección 5, catálogo de servicios, criterio temporal, muestras privadas conciliadas y política de población/faltantes | Ejemplos manuales por ambos servicios, tasas y custodios; determinar si los campos actuales alcanzan. No dar por validado Payout broker Advisory sin evidencia. Registrar decisiones; si faltan muestras, avanzar solo con sintéticos y reglas marcadas pendientes. |
| 2. Núcleo SQL ROA | Nueva RPC solo sobre hechos publicados; cobertura y filtros, sin comparador de tasas todavía | Fixture SQL y pruebas por rol, exactitud, multiplicidad, cambios históricos, filtros combinados, faltantes y revisión. Total/serie/filas concilian antes de páginas. Mantener cierre del reporte anterior intacto. Datos reales bloqueados si faltan decisiones económicas. |
| 3. Referencia Advisory | Selección/revisión/publicación de tasas, o N/D explícito si no existe evidencia; ponderación y pp | Tasas distintas, vigencias, conflictos, coberturas parciales, bases incompatibles, correcciones, atomicidad/idempotencia y acceso reader sin originales. Ninguna comparación mezcla poblaciones. |
| 4. Backend y pantalla | GET/SSR y nueva sección, filtros en URL, KPIs/tabla/gráficos y estados accesibles | Unitarias de parámetros/formatos y HTTP con SQL local; página y API coinciden; navegación/filtros no cambian semántica actual. Verificar teclado, colores+texto y faltantes. |
| 5. Validación local integral y entrega | Regresión, capacidad medida y documentación operativa | Suites pertinentes SQL/HTTP/unitarias, lint/typecheck/build y revisión visual. Informar resultados locales separados de datos reales. Sin aplicar migraciones ni desplegar remotamente por esta autorización. Validación remota futura solo en destino expresamente autorizado. |

## 10. Matriz mínima de pruebas y aceptación

Los importes siguientes son exclusivamente sintéticos; son resultados esperados para pruebas futuras, no checks ejecutados en esta etapa.

| Caso / etapa | Entrada | Resultado esperado |
| --- | --- | --- |
| Fórmula / 2 | Fotos 100.000, 120.000, 140.000; Revenue 50+40+60 | AUM promedio 120.000; Revenue 150; ROA 0,50%, OK. Reporte anterior sigue con AUM cierre 140.000. |
| Umbrales / 2 | Promedio 100.000, Revenue 100 y 150 | 0,40% y 0,60%: ambos OK. Valores inmediatamente menores/mayores: Bajo/Muy bien sin redondeo previo. |
| Agregado / 2 | AUM 100.000/900.000 constantes; Revenue 250/225 | Global 0,19%, no promedio de ROA 1% y 0,1% (=0,55%). |
| Join/multiplicidad / 2 | Fotos 100.000 cada mes; dos ingresos idénticos 25 y otro 50 | Revenue 100, promedio 100.000, ROA 0,40%; aliases, obligaciones y tasas no alteran montos. |
| Asignación / 2 | Cuenta con fotos 100/120/140 y Revenue 1/2/3; equipo A enero, B febrero/marzo | Global promedio 120, Revenue 6; A exposición 100/3, Revenue 1; B exposición 260/3, Revenue 5. En meses fuera de pertenencia no inventar un faltante. Con otras condiciones cubiertas, ratios 12% y 300/13%, respectivamente. |
| Ausencias / 2 | Falta foto de febrero o tiene null; o hay ingreso con importe null | Subtotales y motivos visibles; promedio/ROA oficial N/D según política estricta. No AVG de dos meses ni SUM ignorando null presentado como completo. |
| Cero/negativo / 2 | Tres fotos cero; o Revenue cero presente con AUM positivo; o Revenue -25 con promedio 100.000 | Respectivamente ROA N/D; ROA 0% Bajo; ROA -0,10% Bajo. Ausencia de Revenue es un caso distinto de cero publicado/acreditado. |
| Decimal / 2 | Numeradores/denominadores con muchas cifras y S no divisible exactamente por 3 | Sin conversión binaria; fracciones base conservadas, ratio sin doble redondeo y categoría por productos cruzados. |
| Filtros / 2 y 4 | Todos los filtros juntos; contradicción entre cuenta/custodio; servicio desconocido | AND coherente con ambas fuentes; contradicción devuelve vacío; servicio inválido devuelve error validado. Sin clasificar permanece en cobertura/global sin filtro. |
| Fee / 3 | Exposiciones y tasas del ejemplo sección 7 | Fee 0,875%, ROA 0,875%, diferencia 0 pp; no sumar bases gross/net/representante. |
| Fee parcial / 3 | Una tasa falta, es de otro trimestre, cambia intrames sin regla o su fuente se corrige | Cobertura incompleta/conflicto/obsoleta; no arrastre ni diferencia global. Corrección no modifica otros custodios. |
| Versiones/páginas / 2–4 | Reemplazo de lote o tasa entre páginas; reintento de publicación | 409/revisión obsoleta, sin mezcla; publicación idempotente conserva una sola exposición efectiva. Totales iguales independientemente de página. |
| Seguridad / 2–4 | Anon, reader, admin, deshabilitado/sesión revocada y metadata editable | Solo roles autorizados consultan publicados; reader sin eventos/originales/preparación/Storage; metadata no eleva rol. Admin no publica por GET; errores sin payloads privados. |
| Regresión/capacidad / 5 | Suites existentes de consultas, cuentas, comisiones, importación y RLS; volumen local representativo | Misma salida financiera anterior; nueva RPC dentro del presupuesto vigente medido bajo rol real, sin truncar filas para obtener KPIs ni cambiar timeout por anticipado. |

### Verificación realizada en esta etapa y límites

Se realizó inspección estática del código/migraciones y revisión documental. Se consultaron referencias oficiales sobre [numeric en PostgreSQL 17](https://www.postgresql.org/docs/17/datatype-numeric.html), [funciones y permisos Supabase](https://supabase.com/docs/guides/database/functions) y [changelog](https://supabase.com/changelog.md); antes de implementar se deben revisar nuevamente los cambios relevantes y comandos CLI vigentes. No se propone actualizar versiones por este pedido.

No se ejecutaron suites funcionales, SQL, benchmarks ni conciliaciones de archivos reales; no hay cambios funcionales que validar en esta etapa. No se accedió a Supabase/Vercel de producción, no se aplicaron migraciones, no se instalaron paquetes y no se hizo commit/push. La revisión de diff documental al cierre se registra en progress.md.

Próximo prompt sugerido: «Revisemos las decisiones pendientes del plan ROA: métrica por servicio y período, clasificación/historia de servicios y clientes, cobertura/faltantes y tasas Advisory comparables. Con las reglas confirmadas, autorizo únicamente la etapa de implementación local que indiquemos, sin cambios remotos».
