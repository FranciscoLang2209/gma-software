# ROA trimestral — backend local

Implementado el 2026-11-19, por solicitud posterior al [plan](quarterly-roa-implementation-plan.md).
Al cierre de esa etapa solo había backend/motor financiero. La interfaz posterior
se documenta a continuación; CSV sigue fuera del contrato actual.
Migración `20261120155740_quarterly_roa_backend.sql`, creada con CLI 3.1.0.
Aplicada posteriormente el2026-11-20 a GMA por autorización expresa; ver validation.md.
No cambia `aggregate_report` ni las métricas existentes.

## Consulta

`GET /api/rentabilidad` → cliente SSR del usuario → `public.quarterly_roa_report`.
Admin y reader habilitados con sesión vigente reciben la misma proyección publicada.
Wrapper invoker; implementación privada del ejecutor NOLOGIN/NOBYPASSRLS con
search_path vacío y comprobación de acceso. Sin service_role ni datos de fallback.

| URL | Contrato |
| --- | --- |
| `anio`, `trimestre` | Obligatorios, enteros 1900–9998 y 1–4. Trimestre calendario, tres meses exactos. |
| `custodio`, `equipo`, `comercial`, `cliente`, `cuenta` | UUID opcionales; todos se combinan con AND. |
| `servicio` | Literal `Advisory`, `Brokerage` o `sin_clasificar`. Omitido conserva todos los valores, también otras etiquetas no clasificadas. No renombra cuentas existentes. |
| `agrupar` | account (default), custodian, team, advisor, client, service. |
| `limite`, `offset` | Default 25/0; máximo 250/1.000.000. Orden por clave estable. |
| `revision` | Huella de 32 caracteres hexadecimales; requerida cuando offset > 0. |

Claves desconocidas/repetidas, períodos inválidos, servicio desconocido y páginas
sin revisión fallan con 400. Sesión ausente 401; sin permiso 403; revisión obsoleta
409; timeout 504; indisponibilidad 503. Las respuestas son privadas/no-store, sin
errores SQL internos ni resultados parciales. No se admite un año/trimestre por
defecto ni parámetros de rango, para evitar selecciones implícitas en esta API.

Ejemplo exclusivamente sintético de contrato:

```text
/api/rentabilidad?anio=2024&trimestre=1&servicio=Advisory&agrupar=account
```

## Cálculo y cobertura

Se leen solo `aum_current` y `revenue_current`, agregados independientemente por
cuenta/mes. La unión del universo conserva ambas fuentes y el mes previo para
detectar ausencias, sin incluir ese mes en sumandos. Una matriz de tres meses
resuelve FA publicado con prioridad sobre asignación manual principal, y membresía
principal al cierre mensual. No se usan aliases ni REF para atribuir importes.
Equipo/comercial filtran cada mes; un mes fuera del grupo es exclusión estructural,
un mes incluido sin snapshot es faltante. Cliente/servicio usan clasificación
actual sin historia modelada, explicitado por `dimension_basis`.

```text
S = suma de los tres totales mensuales de AUM filtrado
AUM promedio = S / 3
Revenue trimestral = suma de todas las filas Payout broker de MES/AÑO publicados
ROA porcentual = 1200 × Revenue / S
```

Todas las sumas/productos son numeric; montos, tasas y porcentajes se serializan
como texto/null. Se conserva S, divisor tres y numerador/denominador; las divisiones
periódicas usan precisión decimal de PostgreSQL. No hay redondeo monetario ni
conversiones binarias; la clasificación usa productos cruzados, no el ratio
redondeado: Bajo <0,40%; OK de 0,40% a 0,60% inclusive; Muy bien >0,60%.
Cada grupo y total recalcula su ratio; no promedia ratios ni suma páginas.

La respuesta incluye total, filas paginadas, desgloses por servicio, tres meses,
publicaciones fuente/mes/custodio, conteos de filas/importes, ausencias y meses
sin cliente/comercial/equipo. `service_coverage_before_filter` cuantifica cuentas
y montos sin clasificar antes de excluirlas con el filtro de servicio.

`aum_known_sum_usd` y `revenue_quarter_usd` son subtotales conocidos cuando faltan
datos. `aum_average_usd` requiere todas las fotos/importes de los cuenta-meses
incluidos. `calculation_status` distingue no_data, open_quarter, incomplete,
zero_aum, negative_aum y calculable. ROA y categoría quedan null salvo calculable:
no se imputan cero, saldos, meses ni movimientos. AUM promedio negativo o cero no
produce ratio; Revenue negativo sobre base positiva sí. Fotos negativas se
conservan y señalan. El trimestre debe haber terminado en Buenos Aires, incluso
si se cargan anticipadamente sus tres meses.

**El resultado calculable es provisional sobre cobertura observada**:
`assessment_basis=observed_only_provisional`, `coverage_basis` informa universo
esperado sin confirmar y `revenue_basis` advierte que Payout broker no está validado
económicamente para ambos servicios. No es un ROA de negocio certificado. La
categoría, cuando existe, describe ese cálculo provisional. No existe todavía un
contrato de cuentas esperadas, altas/bajas o certificación de cero movimientos;
no se añadieron declaraciones de completitud inventadas para desbloquear ratios.
La solicitud de backend autoriza este cálculo explícito; no confirma las decisiones
económicas pendientes del plan ni habilita producción.

La revisión incluye filtros, estado abierto/cerrado, hechos y versiones activas,
etiquetas/atribuciones, tasas publicadas/obsoletas, cobertura y clasificación previa
al filtro de servicio. Preparación de importaciones no altera reportes; correcciones
publicadas invalidan páginas afectadas. Una respuesta usa un único snapshot SQL.

## Referencia Advisory publicada

`POST /api/rentabilidad/tasas` es exclusivo de admin, sesión vigente y mismo origen;
cuerpo máximo 64 KiB. No acepta importes/tasas calculadas en cliente:

```json
{
  "request_id": "92000000-0000-0000-0000-000000000001",
  "source_event_id": "90000000-0000-0000-0000-000000000001",
  "expected_rate_id": null,
  "evidence": "SINTÉTICO: tasa anual comparable con Payout broker para todo el trimestre."
}
```

La RPC `publish_roa_rate` exige un evento expected vigente/verificado de Comisiones,
evidencia confirmada para su trimestre, tasa anual no negativa y cuenta Advisory
del custodio correspondiente. La evidencia adicional acredita comparabilidad
económica con Payout broker y aplicabilidad a todo el trimestre: no basta el estado
verified de Comisiones. La tasa se copia del evento, no del request. Un evento
administrativo no se convierte automáticamente en dato público.

Esta operación publica una referencia revisada para **una cuenta/trimestre**;
`expected_rate_id` debe ser la última versión, incluso si está obsoleta. Varias
cuentas se consultan por separado para revisar sus referencias: al filtrar una
cuenta, `advisory_rate_version_id` devuelve el UUID publicado recuperable para
la corrección siguiente, sin exponer el evento privado de Comisiones. Varias
obligaciones o componentes requieren una selección/composición económica acreditada;
el motor no suma tasas ni selecciona silenciosamente la primera. La versión
elegida queda explícita en el comando y la historia. No hay nuevas cargas XLSX,
tasas mensuales, escalas o interpolación intrames en esta etapa.

`roa_rate_versions` conserva versiones inmutables, UUID idempotente, referencia
fuente, anterior, tasa, actor, fecha y evidencia. No tiene permisos de tabla para
authenticated; solo el ejecutor opera bajo RLS forzado. La RPC de lectura proyecta
únicamente métricas y cobertura, sin eventos, originales o evidencia privada.
`commission_events` conserva sus políticas administrativas anteriores.

Un trigger invoker registra en `roa_rate_invalidations` la corrección del evento
fuente, dentro de su misma transacción. No abre lectura de Comisiones al reader.
La tasa anterior queda obsoleta hasta una nueva publicación revisada; reintentar el
UUID viejo no la reactiva. El lock compartido con Comisiones serializa publicación
y corrección. Error o revisión obsoleta revierte todo el comando. No hay DELETE,
UPDATE de historia, cambios financieros ni efecto en otros custodios.

Con exposición completa, positiva/no negativa y tasas acreditadas para toda la
exposición positiva del conjunto exclusivamente Advisory:

```text
W = SUM(AUM[a,m] × tasa_anual_proporcional[a])
Fee anual ponderado (%) = 100 × W / S
Diferencia (pp) = (1200 × Revenue − 100 × W) / S
```

La diferencia usa una sola división y conserva sus componentes exactos, evitando
restar ratios previamente redondeados. Las tasas ya son anuales. Falta de tasa,
fuente obsoleta, fotos incompletas, AUM negativo o conjunto mixto dejan el comparador
en N/D según el caso; no se compara tasa de un subconjunto con ROA global. Los
estados son verified_reference, obsolete, insufficient_coverage o not_applicable.
En un conjunto mixto, los comparadores solo aparecen en el desglose Advisory.
Un cambio de servicio actual también afecta esos filtros, sin inventar historia.

## Pruebas, continuidad y límites

`tests/roa.test.ts` cubre parser, publicación revisada, adaptador y errores;
`tests/database/quarterly-roa.test.sql` cubre el cálculo y seguridad;
`quarterly-roa-capacity.test.sql` cubre 800 cuentas y tres meses;
`scripts/test-roa-concurrency.sh` compite publicaciones/reintentos reales SQL;
`scripts/test-roa-http.mjs` se integra al recorrido Next → PostgreSQL local.
El runner SQL incluye operador administrado y restauración; el recorrido HTTP
usa Auth/PostgREST/Storage sintéticos explícitos. Resultados en validation.md.

Pendientes antes de uso real: conciliar Payout broker/periodización por servicio,
acreditar servicio único o resolver mixtas, historia de cliente/servicio, población
esperada y ceros, significado/vigencia/comparabilidad de cada Fee y muestras privadas.
En el cierre original no se aplicó remotamente. La aplicación posterior del20/11
está verificada estructuralmente en validation.md; no acredita pruebas autenticadas
remotas por rol ni una conciliación de muestras reales.
La interfaz fue autorizada después y se describe a continuación. La habilitación
de producción sigue pendiente y fuera de esta etapa.


## Frontend local — 2026-11-20

`/rentabilidad` y navegación «Rentabilidad / ROA» disponibles para administrador y
lector con acceso vigente. Server Components reutilizan la consulta del backend;
no hay fetch de tablas privilegiadas, edición de importes, publicación de tasas ni
fallback de demo. Carga mediante Suspense/Skeleton existente, error recuperable,
selección inicial de período, vacío, trimestre abierto y faltantes diferenciados.

Elegir año y trimestre explícitos. Todos los filtros de entidad/servicio se combinan
con AND; el cambio de filtros reinicia la página. Selectores Radix reutilizan las
opciones observadas del reporte existente con un máximo de 100 por selector.
Esto solo aporta etiquetas: las métricas provienen de `quarterly_roa_report`.
Si ese catálogo no responde se informa y se conservan resultados/filtros ROA.
Limpiar filtros permite ampliar opciones. Navegación desde otras vistas conserva
entidades compatibles, sin traducir `desde`/`hasta` a un trimestre.

KPIs: promedio de tres fotos, Revenue conocido del trimestre y ROA anualizado.
Valores de cabecera redondeados solo para presentación con helpers decimales
existentes; tabla conserva texto exacto. Las categorías muestran texto y color,
incluido N/D con su motivo. La advertencia de cálculo provisional, métrica económica
pendiente y clasificación actual de cliente/servicio permanece visible.

El comparador Advisory muestra tasa anual ponderada y diferencia en pp únicamente
cuando el backend las devuelve. En conjuntos mixtos se mantiene el total N/D y se
muestra el desglose por servicio. Estados de referencia obsoleta, insuficiente o
no aplicable y exposición cubierta/sin tasa están en el detalle de cobertura.

La tabla paginada conserva la revisión y el total de todas las páginas. Una revisión
obsoleta ofrece reiniciar con los mismos filtros. Para consultar las tres fotos de
una cuenta, abrir «ver tres meses» desde su fila: los meses son del conjunto filtrado,
porque el contrato no incluye snapshots por cada fila. No hay consultas por fila.
Se incluyen publicaciones por mes/custodio, importes ausentes, asignaciones faltantes
y cobertura de servicios antes del filtro.

Evolución de hasta cuatro trimestres, en paneles separados de AUM promedio, Revenue
y ROA/Advisory Fee; cada trimestre usa la misma consulta financiera y sus filtros.
La serie no promedia ratios ni recalcula Fee. Recharts usa números finitos solo para
coordenadas, con null interrumpiendo líneas; tooltip y tabla alternativa presentan
los textos decimales. Cada trimestre tiene su revisión independiente, aclarado en UI;
no se afirma consistencia transaccional de las cuatro consultas. Fallo aislado de un
trimestre se muestra junto a sus valores N/D, sin reemplazos silenciosos.

CSV no habilitado: el contrato vigente no acepta un formato de exportación completa.
No se reutiliza el CSV de Resumen ni se ofrece descarga de solo una página.
Sin dependencias nuevas, cambios de API/SQL ni operaciones remotas en esta etapa.
Pruebas y límites de accesibilidad/entorno en [validation.md](validation.md).

## ROA: comparación anual y tasas visibles — 2026-11-20

La comparación principal ahora presenta T1–T4 del mismo año al comienzo. El trimestre
seleccionado determina el detalle; enlaces conservan filtros y reinician paginación.
Gráficos/tabla comparativa desplegables separan ROA total de ROA/Fee Advisory.

La respuesta agrega `advisory_reference_percent` (tasa anual efectiva de una sola
cuenta Advisory sin exigir AUM), `advisory_accounts` y `advisory_rate_accounts`
(cuentas observadas y con tasa efectiva). Una tasa ausente u obsoleta nunca se
sustituye por cero. `advisory_fee_percent` sigue siendo ponderado por AUM con sus
requisitos originales; su diferencia requiere ROA calculable. Clave por UUID
intacta, etiqueta por custodio/identificador original resuelto, sin unir aliases.

Ver [progreso](progress.md) y [validación](validation.md). Migración aplicada en GMA
como `20261120180701`; push a main autorizado después por el dueño. Documentación oficial de [funciones PostgreSQL en Supabase](https://supabase.com/docs/guides/database/functions)
y [changelog](https://supabase.com/changelog.md) consultados antes del cambio.
