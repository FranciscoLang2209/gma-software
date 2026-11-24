# Consultas agregadas y exportación — etapas 6 a 9

Implementado localmente el 2026-11-13. Contrato común para dashboard, tablas y exportación; Resumen y Análisis comercial conectados en etapa 7. No hay datos reales conciliados ni servicios Supabase remotos verificados.

## Entrada y salidas

Resumen, Análisis y CSV comparten la consulta de cierre/rango. Fase 5 agrega localmente
`public.aggregate_report_ref(...)` con selección REF separada; ver
[contrato y migración pendiente de aplicación](data-quality-filters.md). La firma
anterior `public.aggregate_report(...)` se conserva. Reciben fechas de inicio de mes
(`date`), UUID opcionales de custodio/equipo/comercial/cliente/cuenta, servicio (`text`),
dimensión permitida, tamaño/offset y revisión. Los wrappers públicos son invoker;
la implementación privada usa el ejecutor NOLOGIN/NOBYPASSRLS sujeto a RLS y sesión.
Admin y lector reciben la misma proyección publicada, sin originales/preparados.
ROA conserva su motor trimestral independiente, con la misma selección REF en su
versión nueva. Las consultas no construyen SQL dinámico a partir de filtros de usuario.

El adaptador servidor `src/lib/queries/server.ts::queryReport` usa el cliente SSR del usuario y los parámetros tipados de `contracts.ts`; no usa service_role. El endpoint `GET /api/consultas` valida antes de llamar a la misma RPC:

| Parámetro URL | Contrato |
| --- | --- |
| `desde`, `hasta` | Obligatorios, `AAAA-MM`, inclusivos, entre 1900 y 9998; máximo 120 meses. |
| `custodio`, `equipo`, `comercial`, `cliente`, `cuenta` | UUID opcional; omitido = todos, incluidas las clasificaciones desconocidas. |
| `servicio` | Texto exacto opcional, hasta 200 caracteres; `sin_clasificar` es una clasificación explícita. |
| `agrupar` | `account` (predeterminado), `custodian`, `team`, `advisor`, `client`, `service`. |
| `limite`, `offset` | Predeterminados 100/0; límite 1–250, offset 0–1.000.000; cuentas por UUID; otros desgloses por AUM descendente, nulos al final y desempate por clave estable. |
| `revision` | Huella del primer resultado. Obligatoria cuando offset > 0. |
| `formato` | `json` (predeterminado), `csv` (página) o `csv-completo` (todas las filas, hasta 10.000). Misma RPC y filtros. |

Ejemplo sin datos personales en la URL:

```text
/api/consultas?desde=2026-01&hasta=2026-02&agrupar=team&limite=25
```

JSON contiene `total` del conjunto completo, `months`, `coverage`, `rows` de la página, `row_count`, filtros, política de atribución y revisión. La dimensión cambia las filas, no el total ni los filtros. Montos y porcentajes son texto decimal o null; nunca calcular totales en el navegador ni convertirlos a Number para operaciones financieras. `null` se representa como **N/D**; cero es un valor presente.

`csv` conserva la exportación **de una página**, con total global y metadatos. `X-Next-Offset`, `X-Report-Row-Count` y `X-Report-Revision` permiten recorrerla. `csv-completo`, usado por los enlaces de Resumen y Análisis comercial, comienza en offset 0, consulta páginas de 250 con una misma revisión y entrega todas las filas una sola vez, con una sola copia del total, series y cobertura. Conserva orden/desglose y los siete filtros; la revisión del enlace corresponde al dashboard mostrado. Superar 10.000 filas devuelve 422 con instrucción de acotar filtros; revisión obsoleta devuelve 409. Error/permisos en cualquier página aborta toda la descarga, sin CSV parcial. `X-Report-Scope` distingue `page`/`complete`. El límite de descarga en memoria es deliberado; no se promete capacidad a volumen real.

Ambos CSV incluyen período inclusivo, cierre AUM, revisión, filas totales/exportadas, fecha de publicación, USD, filtros UUID/texto y etiquetas disponibles, definiciones de AUM y `SUM(Payout broker)`, variaciones/participaciones, conteos y faltantes/sin clasificación. UUID sigue siendo la referencia si no hay etiqueta disponible (opciones observadas hasta 100). Ausencia se escribe N/D; cero y ajustes negativos conservan su valor. La serie informa AUM/Revenue y comparaciones mensuales; la tabla incluye cobertura y subtotales sin comercial. No exporta originales, archivos, filas preparadas ni versiones sustituidas, tampoco al admin.

Formato UTF-8 con BOM, coma separadora, comillas escapadas y CRLF. Textos con indicadores de fórmula ASCII o de ancho completo, incluidos prefijos de espacios/controles y tab/CR/LF iniciales, reciben apóstrofo; delimitadores/comillas/saltos internos quedan dentro de la celda. Importes/porcentajes numéricos conservan sus cadenas decimales exactas sin apóstrofos ni conversión binaria. Excel puede redondear números extensos al abrir un CSV: importar esas columnas como texto si se necesita preservar toda su precisión; no se altera el archivo para imponer tipado. La protección corresponde a la descarga original, no garantiza el comportamiento de guardar/reabrir en todas las versiones de Excel. JSON/CSV son privados `no-store`; acceso inválido 401/403, fallo 503, cambio 409 sin errores internos.

La revisión es una huella del resultado financiero y de las clasificaciones/etiquetas/cobertura bajo esos filtros (incluye la base comparativa), no un backup ni una transacción abierta entre peticiones. Un cambio que afecte la salida obliga a reiniciar la paginación/exportación. Una nueva versión con idéntica salida no necesita invalidarla. Cada llamada SQL estable observa un único snapshot; no se mezclan versiones entre total, serie y filas de una respuesta.

## Cálculo y atribución

1. AUM y Revenue leen exclusivamente `aum_current` y `revenue_current`. Se filtran por cuenta/custodio/período y se agregan **independientemente por cuenta/mes**. AUM conserva su unicidad publicada; Revenue conserva todas sus filas, aun idénticas o negativas.
2. FULL JOIN de esos agregados preserva solo-AUM y solo-Revenue. No se unen aliases al cálculo. Las entidades se buscan por UUID; la asignación principal y la membresía principal tienen vigencias sin solapamiento. No hay reparto entre múltiples coincidencias.
3. Se resuelve `advisor_at(cuenta, mes)` usando FA activo o asignación manual con vigencia explícita en el último día del mes; el equipo es la membresía principal del comercial al mismo cierre. Las fechas son `[desde,hasta)`. Sin cobertura, comercial/equipo quedan nulos y el desglose incluye **Sin asignar**. Los filtros de equipo/comercial se aplican aquí a cada mes, igual para ambas fuentes.
4. Para el rango, **AUM = suma exclusivamente de las fotos de `hasta`**, con la atribución de ese cierre. Revenue = suma de cada mes ya atribuido históricamente. Ejemplo: A pasa del equipo 1 al 2 antes del cierre de febrero; enero 100/10 y febrero 120/12 → global 120/22; equipo 1 AUM N/D y Revenue 10; equipo 2 AUM 120 y Revenue 12. No se prorratea ni se sustituye por equipo actual.
5. `months` muestra la foto AUM y el flujo Revenue de cada mes. El total AUM no es la suma de esa serie; Revenue sí suma sus meses. Consultar una cuenta por UUID permite obtener su detalle agregado paginado y su serie mensual, sin descargar el detalle de todas las operaciones.

Cliente y servicio proceden de `accounts`, sin historia de esos atributos modelada. Sus filtros/clasificación usan ese estado documentado; no se promete una historia de cliente/servicio inferida del FA. No se aplica una regla de “actividad”. `accounts_with_aum` cuenta UUID con fila AUM presente al cierre, aun valor cero/negativo/nulo. `clients_with_aum` cuenta clientes distintos no nulos de esas cuentas; `aum_accounts_without_client` expone el resto. `accounts_with_revenue` cuenta cuentas con registros de Revenue del rango, por separado. Los conteos distintos de clientes/cuentas pueden solaparse entre equipos durante un rango y **no son aditivos**; los importes de los desgloses sí concilian con el global.

## Ausencia, cobertura y comparación

El universo observado es la unión de cuentas de ambas fuentes publicadas en el rango **y en el mes calendario inmediatamente anterior a `desde`**, para conservar la base comparativa y detectar ausencias. Se cruza ese universo con los meses, sin copiar saldos. No se usa un listado de “cuentas activas” inventado. Una cuenta nunca observada en esa ventana no se declara esperada.

Para cada total/desglose/mes se devuelven filas/valores por fuente, cuentas con datos, cuentas AUM sin fila, cuenta-meses sin Revenue y cuentas sin cliente/comercial/equipo; también subtotales sin comercial. Una suma con valores ausentes es un **subtotal conocido**. `aum_values < aum_rows` o `revenue_values < revenue_rows` identifica importes ausentes; `aum_missing_accounts` y `revenue_missing_account_months` identifican registros ausentes en el universo observado, no ceros ni bajas de negocio confirmadas. Equipo sin foto de cierre devuelve AUM null, aunque tenga Revenue anterior.

`coverage` indica publicación por fuente/mes/custodio observado (o custodio filtrado explícitamente), incluso cuando falta el mes completo. No considera un archivo preparado una fuente publicada. Publicación presente no acredita que estén todas las cuentas. `coverage_basis` declara **expected_coverage_unconfirmed**: faltan acordar el universo contractual por mes/custodio y cómo confirmar meses sin movimientos. Sin ninguna observación no se inventa un denominador de cobertura. No se puede afirmar completitud real con estos datos.

Cada mes se compara con **el calendario anterior**, incluido el inmediatamente anterior al rango; nunca con el último mes disponible. Una comparación es de la misma población de cuentas con registros de la fuente en ambos meses y con todos sus importes presentes. Si cambia esa población o falta una base/importe, delta y porcentaje son null; no se compara un subtotal de población diferente. Porcentaje = `(actual − anterior) × 100 / anterior` en PostgreSQL numeric, con denominador firmado. Base cero permite delta absoluto, pero porcentaje null. No hay infinito, arrastre ni cero artificial. El dashboard puede usar las variaciones del último elemento de `months`; no debe comparar Revenue acumulado de varios meses contra un solo mes.

No hay rendimiento, flujos netos, beneficio neto, advisory ni ratio Revenue/AUM.

## Índices y límites de rendimiento

Las consultas reales usan índices ya existentes: `aum_period_custodian`/`revenue_period_custodian` para rango/custodio; `aum_account_period`/`revenue_account_period` para cuenta; PK de cuentas; `accounts_client`; únicos de alcance y batch; índice Revenue por batch y unicidad AUM con batch como primera columna; `fa_rows_account`; exclusiones GiST parciales de asignación/membresía por entidad y `valid_during`. Cubren las uniones por versión activa y las vigencias consultadas. No se agregó otro índice redundante ni uno por cada filtro de interfaz.

Sin volumen representativo ni problema medido no se justifica un índice nuevo. Si el plan real muestra escaneo costoso por servicio/cliente, evaluar `(service,id)` o `(client_id,id)` sobre cuentas; si las búsquedas FA por cuenta/vigencia dominan, evaluar GiST `(account_id,valid_during)`. Comparar `EXPLAIN (ANALYZE, BUFFERS)` del núcleo bajo rol/sesión y filtros representativos antes y después; no basta el nodo Function Scan del wrapper. No se ejecutaron estos índices ni se afirma una mejora sin medición.

`shortcut: OFFSET acotado y matriz cuenta×mes/revisión recalculada por página; medir y pasar a cursor/snapshot persistido solo si el volumen real muestra latencia o presión de memoria.` El límite temporal reduce el producto cuenta×mes; el detalle enviado al navegador está paginado. No se declara benchmark ni capacidad de producción.

## Evidencia

`tests/database/queries.test.sql`: fixture 100/10 → 120/22, solo-fuentes, ceros, valores ausentes, negativos/repetidos, exactitud decimal, cierres faltantes, cambio de equipo, FA activo para lector, aliases, versión sustituida/candidata, filtros y conciliación por dimensión, páginas/revisión y acceso con RLS. Unitarias de parámetros/CSV y pruebas HTTP de Next complementan SQL; no sustituyen Supabase real. Resultados y límites en [validation.md](validation.md).


## Proyección de interfaz — etapa 7

La sexta migración conserva la firma y permisos de `aggregate_report`. Agrega a cada fila `aum_share_percent` y `revenue_share_percent`: `importe × 100 / total_filtrado` en `numeric`, **antes de paginar**. Cada fuente permite participación solo con total positivo, todos sus importes presentes y sin negativos subyacentes en el rango correspondiente (AUM solo al cierre; Revenue incluye cada ajuste aunque el neto de su cuenta sea positivo). Las participaciones son sobre importes conocidos, no certifican cobertura contractual. Faltantes de registros/cuenta-mes continúan expuestos. Total no positivo, importes ausentes o negativos → null. El total no necesita sumar la página ni los porcentajes redondeados.

Cuentas conserva orden por UUID; los otros desgloses se ordenan por AUM descendente, null al final y clave con collation C como desempate, antes de LIMIT/OFFSET. Un equipo con solo Revenue histórico permanece en el ranking con AUM N/D. No hay ranking separado por Revenue ni nueva métrica financiera.

`options`: por dimensión, hasta 100 ID/etiquetas distintas observadas **dentro de los filtros**, ordenadas por etiqueta/ID. No es catálogo completo ni lista de cuentas activas. Las etiquetas de cuenta son sus UUID internos. Se permite limpiar filtros y navegar por los desgloses paginados; un ID seleccionado fuera del listado sigue visible. No se abren tablas dimensionales a lectores ni se incluyen originales.

`published_at`: máximo timestamp de las versiones activas del alcance financiero/rango incluyendo la base comparativa, y FA activo de los custodios observados. No es fecha de edición de asignaciones manuales o de cliente/servicio. La UI lo llama **última publicación del alcance** y muestra por separado la hora de consulta en Buenos Aires. Sin alcance observado devuelve null. FA no tiene un denominador mensual acordado: se informan vigencias al cierre y cuentas sin comercial/equipo por mes; no se declara FA completo a partir de su fecha de archivo.

Resumen presenta las variaciones verificadas del último mes, incluyendo su mes comparativo. No calcula variación del Revenue acumulado ni cambios de conteos sin regla aprobada; esas comparaciones se indican N/D. Montos exactos agrupados como texto, USD explícito, MM/AAAA. Porcentajes de participación redondeados a dos decimales solo para lectura (BigInt); el valor SQL exacto está en el detalle accesible. Los Number de Recharts se usan exclusivamente como coordenadas; cero incluido en la escala para representar barras negativas, null sin punto/barra y sin conectar a través del faltante.
