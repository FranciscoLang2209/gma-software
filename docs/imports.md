# Importaciones — preparación, correspondencias y publicación (etapas 4–5)

## AUM + REF y preparación compartida — 2026-11-18

La preparación histórica procesa hasta cinco alcances por petición, compartiendo
sólo dentro de esa petición la lectura y verificación de original+REF. Mantiene los
límites por bloque, cursores, fingerprints y resúmenes; no usa caché entre peticiones.
Pausar/reintentar retoma el mismo UUID y no vuelve a insertar filas ya guardadas.

AUM preparado y sin bloqueos ofrece «Resolver cuentas con REF». Requiere motivo y
confirmación del par literal/custodio y la equivalencia bd_REV→ACCOUNT acreditada.
Reutiliza la cuenta exacta de REV o AUM; si no existe, crea la propia y registra sus
aliases explícitos. Un REF ambiguo o UUID contradictorio detiene el bloque sin fusionar
cuentas. Se guarda SHA, hoja y fila REF junto con la procedencia AUM. No crea
movimientos REV ni atribuciones comerciales. «Conciliar alcances de AUM» conserva
la unicidad de foto por cuenta/mes y exige las mismas cifras exactas del archivo.

Una decisión de identificadores numéricos ya autorizada debe quedar marcada y con
motivo en cada carga. Para cambiarla se crea una nueva operación con los mismos
originales; nunca se altera el manifiesto de una preparación anterior.

## Resolución histórica de Revenue por bloques — 2026-11-18

Una carga REV completamente preparada y sin bloqueos ofrece «Resolver cuentas
exactas». Requiere confirmar ACCOUNT literal/custodio y registrar evidencia. Cada
petición resuelve hasta 50 filas usando las operaciones existentes, reutilizando el
UUID de ese identificador dentro de Revenue/custodio o creando uno si no existe.
No une con AUM/REF ni clientes/comerciales por nombre; cuentas sin REF quedan sólo
REV. Se conserva cada movimiento, sus originales, ceros, N/D y ajustes negativos.
Un conflicto detiene el proceso; pausa/reintento conserva lo ya resuelto.

«Conciliar alcances de REV» requiere revisar todos los meses/custodios del archivo;
ejecuta la conciliación existente por hijo, con filas/importes/cobertura exactos y
control de versión activa. También se puede retomar. Luego «Revisar toda la carga»
congela la revisión conjunta; «Publicar carga completa» continúa siendo un paso
explícito, separado y atómico. Resolver o conciliar no publica datos.

Solo administradores habilitados y con sesión vigente. Se usa su JWT para Storage, vistas y RPC; no hay clave privilegiada ni fallback a una demo. Aplicar todas las migraciones vigentes en un destino dedicado antes de usar la pantalla. Estado del entorno remoto en [progress.md](progress.md) y operación en [operations.md](operations.md).

## Uso

1. En Importaciones elegir fuente, mes, un custodio registrado, convención de importes de texto y delimitador CSV. El alcance es **fuente + mes de referencia + custodio declarado**. No es autorización de reemplazo. En FA, mes y custodio son contexto declarado: no acreditan historia ni asignación. La falta de custodios se muestra; se registran por el operador según los permisos existentes, sin inferir nombres del archivo.
2. Cargar un original `.xlsx` sin macros o CSV UTF-8. Se registra metadato, actor y SHA-256 de bytes; se guarda el original privado sin sobrescribir objetos. Si falla Storage, reintentar el mismo formulario sin cambiar sus datos: conserva la clave de solicitud. Tras recargar la página puede crearse otra preparación, sin borrar la incompleta.
3. Elegir una hoja de las devueltas por el servidor y revisar la convención numérica. Iniciar validación. La hoja y convención quedan fijadas al primer lote persistido; para cambiarlas, crear otra preparación. El delimitador queda fijado al cargar.
4. El navegador solicita y **espera** un lote por vez. Pausar detiene el siguiente lote; cerrar el navegador no inicia trabajo en segundo plano. Retomar desde las últimas 50 preparaciones. Una petición en curso puede terminar de confirmar su lote.
5. Revisar mapeo de headers, cuentas distintas por referencia principal, filas, controles, errores y originales paginados (25 por página, opción solo errores). Descarga privada del original para admin. Sin descargas firmadas reutilizables.

Resultados: `uploaded` → `validating` → `needs_resolution` si terminó sin errores, o `failed` si hay errores bloqueantes. Una lectura inválida puede guardarse como fallo desde «Validar y preparar», conservando el original. Los errores no publican filas válidas parcialmente. La preparación no crea cuentas, equivalencias, personas, vigencias ni hechos financieros. Continúa en Correspondencias; solo la operación interna de revisión puede promover `preparation_only=true`, después de resolver y conciliar todo el lote. La API no tiene UPDATE financiero directo.

## Formatos y límites efectivos

| Entrada / trabajo | Límite |
| --- | --- |
| Original | 1 byte a 2 MiB; nombre hasta 200 caracteres |
| Cuerpo multipart | 2 MiB + 64 KiB, contado leyendo el stream, sin confiar en Content-Length |
| Cuerpo de procesamiento | 8 KiB; opciones, nunca filas enviadas por el navegador |
| XLSX expandido | 12 MiB reales; ZIP procesado en fragmentos de entrada de 1 KiB, hasta 200 entradas |
| Hojas | 10, nombres únicos de hasta 100 caracteres |
| Filas | 5.000 de datos + header en cada hoja; celdas vacías formateadas también cuentan para el límite de coordenadas |
| Columnas / celda | 64 / 4.096 caracteres de valor o fórmula |
| Fila preparada | 1 MiB serializado; un exceso se informa como error de lectura |
| Persistencia | Hasta 250 filas y aproximadamente 1 MiB serializado por llamada; RPC rechaza chunks mayores de 2 MiB |
| Decimales de entrada | 60 dígitos enteros y 30 fraccionarios; nunca redondear |
| Vista previa | 25 filas por página; original íntegro en Storage |

CSV: UTF-8 con o sin BOM, coma/punto y coma/tabulación explícitos, comillas y saltos dentro de campos admitidos. No hay autodetección de tipos, fórmula, delimitador ni convención. Header en el primer registro. `row_number` es la línea física inicial del registro, también con campos multilínea. XLSX: número físico de fila de Excel; se conservan huecos. Filas completamente vacías no crean un preparado; el archivo mantiene esas filas y sus coordenadas no se renumeran.

Se rechazan `.xls`, `.xlsm`, `.xlsb`, archivos encriptados/no ZIP válidos, DTD/entidades, macros detectadas y hojas con celdas combinadas. Instrucción al usuario: recalcular en Excel y guardar una copia **.xlsx sin macros** o **CSV UTF-8**; descombinar y completar datos. No se ejecuta Office, macros, fórmulas ni conexiones externas. Rechazar un formato no elimina el original previamente guardado; extensiones/tamaños no admitidos se rechazan antes de la carga.

No se recibieron muestras identificadas de estas fuentes. Se revisaron nombres/extensiones en proyecto y Downloads; hay archivos ajenos, no se abrieron ni usaron como muestras financieras. Por eso **no se confirmó necesidad de .xls** ni formatos reales. No instalar el paquete `xlsx` antiguo de npm: la opción elegida para XLSX es `read-excel-file` 9.3.15, con actividad y engines consultados en npm el 2026-11-12 (Node >=18, compatible con Node 24). Lee números con callback que conserva strings. `csv-parse` 7.0.3 mantiene campos textuales; `fflate` 0.8.3 acota expansión; `saxen` 11.2.0 inspecciona coordenadas, tipos y fórmulas que el lector puede presentar como vacíos. Las cuatro dependencias directas quedan exactas y con lockfile.

El límite actual hace viable releer/validar la hoja completa en cada petición y detectar conflictos entre lotes. Solo la persistencia avanza por cursor. No es un importador streaming ilimitado. `parserVersion=1` queda fijado con la configuración; ante cambios incompatibles se debe crear otra preparación. Medición local sintética en `validation.md`; no promete tiempos, memoria ni volumen representativo en hosting.

## Reglas de lectura y validación

- Headers contractuales de `product.md` y guía: 6 AUM, 29 Revenue, 7 FA. Mapeo por posición, trim + espacios consecutivos reducidos + minúsculas españolas **solo para headers**. Sin aliases semánticos adivinados. Colisiones y faltantes bloquean. Columnas adicionales conservadas, con mapeo «sin mapeo»; datos que exceden el header generan error.
- `original_cells` usa posiciones textuales `"1"`, `"2"`, etc. para conservar incluso headers repetidos; `totals.headers` conserva el mapeo original/canónico. `cell_metadata.cells` retiene tipo, resultado original, fórmula, presencia de caché y referencia de estilo cuando aplica. Los bytes originales son la referencia completa de estilos, fórmulas compartidas y otros metadatos OOXML. No se conserva un número redondeado como original.
- Cuentas obligatorias: ambos números de AUM, `ACCOUNT` de Revenue y ambos números de FA. Identificadores como texto exacto; espacios no se normalizan. Cuenta XLSX numérica, calculada, fecha/booleano/error o científica textual bloquea por posible pérdida previa de ceros/precisión. No se reconstruyen ceros desde formato visual ni longitud. Un CSV ya dañado no permite detectar todos los ceros perdidos: advertencia explícita para revisar con origen.
- Mes numérico 1–12 y año de cuatro dígitos deben coincidir con el mes elegido en AUM/Revenue. El período elegido admite 1900–2200. No se interpretan nombres de meses o fechas ambiguas. `CUSTODIO` de cada fila Revenue debe coincidir con el **código** registrado elegido (trim/minúsculas); no se infieren aliases ni se filtran custodios ajenos silenciosamente.
- Solo `Value (USD)` y `Payout broker` derivan un importe. Los demás campos y porcentajes de Revenue se retienen sin asumir unidades, bases o tipos aún no acordados. Números nativos XLSX: sintaxis OOXML exacta con punto y exponente decimal; se expanden mediante texto. Textos: convención punto decimal (`1,234.56`) o coma decimal (`1.234,56`), agrupaciones estrictas; sin convención, cualquier separador decimal/miles bloquea. No convertir `1,234` automáticamente. Moneda, espacios internos, NaN, infinito y fórmulas textuales son inválidos como importe. Negativos y cero explícito válidos; ausencia es null y error bloqueante, nunca cero.
- Una fórmula con resultado guardado usa exclusivamente ese resultado y deja advertencia de revisión. Sin resultado, resultado vacío o error: bloqueo con instrucción de recalcular/guardar/exportar desde Excel. No se acredita que un caché esté actualizado. Texto CSV que empieza con `=` sigue siendo texto inerte; no existe exportación CSV de preparados que lo vuelva ejecutable.
- AUM: conflicto en **todas** las filas que repitan cualquiera de sus referencias de cuenta en la hoja/período, aun entre lotes. Equivalencias internas que aún no se conocen se resuelven en Correspondencias; no se inventan.
- Revenue: ninguna deduplicación. La huella SHA-256 de valores de fila avisa repeticiones, nunca impone unicidad por contenido/ticket/cuenta-mes. FA: referencias repetidas con distinta contraparte, cliente, owner, grupo o broker generan contradicción/ambigüedad en todas las filas involucradas; ninguna equivalencia o persona se crea automáticamente. Diferencias de OLD Owner se conservan sin inventar historia fechada.
- Suma de control exacta por strings y BigInt. Incluye importes interpretables aunque la fila tenga otro error; se etiqueta como **no publicable**. Se muestran cobertura de valores, ausencias, cantidad de errores y filas repetidas conservadas. Para FA no hay suma financiera. Cuentas distintas son referencias principales de esa fuente/custodio declarado, no UUID ni clientes resueltos.
- SHA-256 de **bytes** indexado, sin restricción única. Advierte otros lotes, incluso fallidos o de otro alcance. El reintento de subida usa clave por alcance y contenido original coherente. No sustituye los controles de alcance/versión/puntero activo de publicación de la etapa 5.

## Transacción, errores y recuperación

`begin_import` valida admin y parámetros, bloquea el alcance para asignar versión y reutiliza la clave de solicitud únicamente si coincide archivo/convenios. Primero registra metadatos y después se carga Storage, pues no hay transacción distribuida entre ambos. Un fallo puede dejar un lote uploaded sin objeto; se muestra como archivo no disponible, se conserva auditoría y se reintenta. No se automatiza limpieza ni retención.

Cada `prepare_import_chunk` bloquea el lote, comprueba configuración/cursor, inserta filas y actualiza resumen/cursor/estado en **una transacción PostgreSQL**. Si una fila falla, no queda avance parcial. Reintentos/carreras con cursor anterior devuelven el cursor ya confirmado sin duplicar originales. Un archivo/configuración no cambia debajo de un proceso. Se vuelve a comprobar la huella al descargarlo para procesar. La API ignora filas/resúmenes enviados por un cliente y los calcula a partir del original en servidor.

Wrappers RPC públicos invoker, implementaciones privadas de preparación/revisión bajo el rol interno sujeto a RLS y sesión/perfil actuales; anónimo y lector no ejecutan estas RPC, ni leen preparados u originales. POST requiere origen correspondiente al protocolo/host de la petición; se verifica también en HTTP de producción local con el SDK SSR. GET/POST privados `no-store`. Ningún log imprime archivo, filas, nombres de cuentas ni tokens.

## Referencias consultadas el 2026-11-12

- [read-excel-file: precisión y fórmulas](https://github.com/catamphetamine/read-excel-file#numbers), [código publicado](https://www.npmjs.com/package/read-excel-file).
- [csv-parse: opciones](https://csv.js.org/parse/options/), [fflate](https://github.com/101arrowz/fflate), [saxen](https://github.com/nikku/saxen).
- [Supabase changelog](https://supabase.com/changelog.md), [CLI 3](https://supabase.com/changelog/supabase-cli-v3), [Storage upload](https://supabase.com/docs/reference/javascript/storage-from-upload), [carga estándar](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [RPC](https://supabase.com/docs/reference/javascript/rpc), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

No se cambiaron recursos Supabase/Vercel remotos. La seguridad de los servicios reales y la conciliación con muestras privadas siguen pendientes.

## Correspondencias y publicación — etapa 5

1. En Importaciones, abrir el lote y seguir **Resolver correspondencias, revisar y publicar**. También se puede abrir por UUID en `/correspondencias?lote=...`; presionar Abrir. Se muestran las últimas 50 importaciones y hasta 200 sugerencias recientes de cuentas, comerciales y equivalencias. Las filas se paginan de a 25. UUID fuera de sugerencias se puede ingresar manualmente; la base valida el custodio.
2. Ver los identificadores originales, coincidencias exactas acreditadas con su namespace/custodio/evidencia, celdas originales y conflictos. **No hay asignación automática** entre fuentes. Elegir el UUID destino conocido o dejar vacío para crear una cuenta nueva, elegir el custodio expresamente y escribir evidencia. Para vincular FA, AUM y Revenue elegir expresamente el mismo UUID según evidencia del par de referencias. No se supone que Holding Account Number sea ACC # Addepar ni que los ACCOUNT de distintos custodios sean equivalentes.
3. Resolver cada fila. Se crean aliases exactos de esa fuente/header/custodio y resolución auditada. Un alias ya acreditado contra otra cuenta bloquea la operación sin redirigir historia; revisar evidencia y corregir el archivo cuando corresponda. FA sin custodio sigue sin resolver. Duplicados AUM que recién al resolver apuntan a una misma UUID bloquean la revisión; no se suman. Revenue idéntico conserva su multiplicidad.
4. Para FA elegir un comercial UUID o crear uno explícitamente sin deduplicar nombres; dejarlo vacío mantiene la fila sin asignar. Antes de dejar listo confirmar cuál columna identifica al comercial (`Owner Name payout` o `Broker`) y vigencia **[desde inclusive, hasta exclusiva)**. Un inicio es obligatorio; fin vacío significa sin límite. Debe existir valor en la columna elegida para una fila con comercial asignado. Se conservan ambas columnas, OLD Owner, Grupo y Client; no se generan historia, clientes o equipos por nombre.
5. Confirmar que el archivo cubre **el mes completo de la fuente y custodio seleccionados**, incluyendo revisión de omisiones. El servidor comprueba todas las filas/resoluciones/errores y materializa hechos en una transacción. Si algo falla no deja hechos parciales ni cambia datos activos. La revisión congela la resolución y vigencia; para cambiarlas crear otra versión. Se puede repetir la revisión de una candidata lista para actualizar la versión activa esperada tras una publicación ajena.
6. Comparar archivo/candidata/versión activa: filas, valores presentes, total decimal USD, misma huella, y filas nuevas/retiradas por contenido original conservando multiplicidad. Las ausencias son N/D. La candidata antes de conciliar no tiene hechos. La conciliación muestra cuentas y filas sin comercial al cierre, e importe exacto que permanece en el total. FA muestra cobertura de asignaciones, sin total monetario.
7. Revisar la comparación y confirmar **Publicar versión revisada**. Se conserva token, versión activa esperada y revisión. La transacción cambia estado y puntero de ese único alcance, con auditoría. No se toca ningún custodio ausente. Ante revisión obsoleta recargar y volver a revisar; ante error de red recargar estado o reintentar: publicar el lote ya activo devuelve éxito sin sumar nuevamente ni repetir el evento.

**Estados:** uploaded → validating → needs_resolution → ready → published. Errores bloqueantes producen failed; no hay publicación parcial. `superseded` se deriva de published cuando otro lote ocupa su puntero. El reemplazo no modifica ni borra la versión anterior. La resolución, revisión y cambios de lote tienen auditoría antes/después; `publish` registra puntero anterior/nuevo y actor. Preparación fallida no modifica publicados.

**Correcciones y recuperación:** volver a importar un original corregido para el mismo alcance, resolver, comparar contra activa y publicar. Mismo archivo con otra clave genera una versión candidata, no ingresos adicionales. Para recuperar una versión histórica, descargar su original privado y reimportarlo como versión nueva revisada; nunca actualizar importes de la anterior ni reactivar un lote superseded. No hay borrados automáticos.

**Cero filas y multi-custodio:** este MVP no admite publicar un lote vacío, aun con confirmación genérica de alcance. Un mes sin filas es falta de cobertura; no se declara Revenue cero ni borra una versión previa. Hace falta un flujo futuro específico de certificación y evidencia si se requiere publicar meses sin movimientos. Se aceptan filas reales con importe cero o suma cero. Revenue con otro custodio/período bloquea todo el archivo; para este importador se requieren entregas completas de un solo mes/custodio, revisadas por el administrador.

**Asignación temporal:** `advisor_at` usa el último día de cada mes y solo FA activos o asignaciones manuales principales explícitas. Períodos anteriores sin cobertura quedan sin asignar; OLD Owner no crea ninguna fecha. Publicar FA rechaza vigencias superpuestas de la misma cuenta con otros FA activos o asignaciones manuales. Corregir/terminar explícitamente la versión del alcance anterior antes de abrir otro intervalo. Cambios manuales toman el mismo lock y no pueden solaparse con FA vigente.

**API y transacciones:** GET `/api/importaciones/:id/gestion?page=0` inspecciona; POST con `operation` (`resolve`, `review`, `publish`) e `input` envía una RPC atómica. JSON hasta 16 KiB, admin vigente y mismo origen; no-store. SQL `manage_import` revalida permisos, cuenta/custodio, evidencia, alcance y token. El rol de usuario no escribe tablas financieras/identificadores directamente. Resolución/revisión/publicación usan lock transaccional común, alcance y lote; un fallo revierte toda la llamada. El lock común es deliberado para el MVP acotado, sin prometer throughput concurrente.

Referencias verificadas para esta etapa: [changelog Supabase](https://supabase.com/changelog.md), [funciones y privilegios](https://supabase.com/docs/guides/database/functions) y [locks PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html). Los checks ejecutados y los servicios reales pendientes están en [validation.md](validation.md).

Etapa 9: reintentar la misma carga conserva su lote también después de preparar/publicar. La octava migración excluye de la comparación la configuración añadida por el parser, sin modificarla; cambios de hash/nombre/tamaño/opciones originales siguen rechazados. Nueva clave de solicitud crea otra versión para el alcance, nunca añade su importe al activo anterior. Verificado en PostgreSQL y por multipart HTTP con CSV sintéticos.

## AUM histórico multiperíodo — 2026-11-17

En `/importaciones`, elegir **Importación histórica**. Conserva el contrato largo de
seis columnas de AUM: `mes` y `año` determinan cada período (1900–2200); el usuario
declara **un custodio por archivo**. AUM no incluye una columna de custodio: no se
infiere desde identificadores o nombres. Para varios custodios se cargan archivos
separados. Una hoja elegida explícitamente por libro; si el libro tiene varias,
se exige su nombre y se registran las hojas excluidas. CSV utiliza la hoja `CSV`.

Flujo: guardar/analizar original → períodos detectados → validar bloques → abrir
correspondencias de cada período → resolver UUID con evidencia y conciliar foto
mensual completa → regresar a la carga → revisar todos los períodos/comparaciones
→ confirmar publicación conjunta → resultado. Las referencias acreditadas se
consultan en el circuito existente; no hay fusiones por nombre ni aprobación
silenciosa de sugerencias. La conciliación de cada hijo no publica datos.

La vista muestra año/mes, custodio, cuentas, total USD exacto de control, errores,
filas con identificadores AUM duplicados, progreso persistido, versión candidata,
versión activa/total y cambios de filas. El total de control puede incluir filas
inválidas: no es AUM publicable mientras haya errores. Se descargan errores como
JSON privado (incluidas coordenadas y originales), sin convertir texto en fórmulas.
El original se descarga desde el padre (también sin períodos válidos), verificando
tamaño/hash, o por la ruta privada existente de cualquiera de sus hijos.

### Límites y segmentación

Se mantienen 2 MiB de original, 12 MiB expandidos, 5.000 filas/hoja, 64 columnas,
10 hojas y defensas ZIP/XML/macros existentes. Una carga histórica acepta hasta
120 particiones mensuales y 5.000 filas de datos en total. No se amplía capacidad
sin muestras/medición. Para más volumen, segmentar **por meses completos y custodio**:
cada archivo es una unidad de publicación independiente. No dividir una misma
foto mensual en archivos parciales destinados a reemplazarse entre sí. Si un mes
completo supera el límite, requiere una futura ampliación del procesamiento;
esta implementación lo rechaza y no promete importar toda la historia real.

Preparación secuencial en bloques de hasta 250 filas/~1 MiB serializado mediante
`prepare_import_chunk`. Relee el original acotado por petición, igual que el flujo
mensual. El navegador muestra filas confirmadas por SQL, permite pausar después
del bloque y retomar; cambiar de pestaña/desmontar el componente pausa el bucle.
No hay worker en segundo plano. Conservar UUID o consultar cargas recientes
(últimas 50); se puede abrir por UUID una carga anterior. Tras interrupción de red,
recargar estado: cursores y tokens persistidos permiten retomar sin duplicación.
Si falla Storage al subir, reintentar el mismo formulario sin cambiar archivo ni
configuración conserva la clave de solicitud y verifica los bytes existentes.
Tras recargar/abrir por UUID, «Recuperar una carga cuyo original no llegó a
Storage» permite reponer exactamente los mismos bytes con la configuración fijada.

### Manifiesto y publicación

Nueva migración `20261117133211_historical_aum_uploads.sql`, **solo local, no aplicada
remotamente**. `import_uploads` conserva solicitud/UUID, original único (nombre,
hash, tamaño y path privado), opciones, actor, manifiesto inmutable y revisión.
`import_batches.upload_id` enlaza hijos normales con sus versiones/scopes y el
mismo objeto Storage. Los lotes mensuales previos conservan `upload_id = null`.

El manifiesto fija períodos, coordenadas/huellas, conteos/totales decimales,
headers, validaciones, filas vacías, hojas excluidas y filas sin período válido
con sus celdas originales. Las filas no enrutables no reciben un mes ficticio y
bloquean el conjunto. No se puede retirar una partición con errores. SQL valida
unicidad de particiones/coordenadas, pertenencia de filas y archivo, igualdad
exacta del conjunto preparado, resumen y suma decimal antes de publicar.

`manage_historical(begin/inspect/review/publish)` usa el ejecutor existente,
`NOLOGIN/NOBYPASSRLS`, RLS forzada, sesión/perfil administrador y auditoría. API
Next usa SSR/JWT del usuario, límites de solicitud, verificación del custodio,
hash de bytes y `no-store`; sin claves privilegiadas ni datos financieros en logs.
Lectores no ven operación, manifiesto, preparación ni Storage original.

La revisión padre exige hijos conciliados, todos los punteros esperados actuales
y confirmación explícita de fotos mensuales completas/reemplazos. Congela los
tokens de todos los hijos. La publicación toma el lock común `71482026` y cambia
**todos** los punteros en **una transacción SQL**, invocando el publicador existente.
Un error revierte estados, punteros y auditoría; queda la revisión recuperable.
El estado transitorio `publishing` solo existe dentro de esa transacción. Un
trigger impide publicar individualmente cualquier hijo por todas las entradas,
incluidas `manage_import`, `public.publish_import` y el publicador interno.
No usa flags de cliente ni GUC para autorizar una publicación agrupada.

Reintentar una publicación terminada no duplica ni reactiva una versión histórica
reemplazada. Otro archivo con los mismos bytes genera versiones nuevas únicamente
tras revisión, conservando una sola versión vigente. Correcciones de un mes
pueden usar también el flujo mensual existente; otros meses/custodios y versiones
anteriores se conservan. Una revisión obsoleta se rechaza íntegramente y exige
volver a conciliar los períodos afectados y revisar el padre. Ausencia de una
cuenta no es saldo cero: el operador debe completar un archivo parcial antes de
confirmar que sustituye una foto mensual completa. La aplicación muestra retiros
y exige confirmación; no puede acreditar por sí sola la completitud del Excel.

## Histórico con varios custodios — 2026-11-17

Implementación nueva sobre el padre histórico existente. En **Importación histórica**
la opción de varios custodios está marcada inicialmente. Elegir AUM o Revenue:

- **AUM**: adjuntar archivo financiero completo y REF completo. Confirmar que Broker
  es custodio y que ACC # Addepar / ACCOUNT acreditan los dos números de AUM.
  Se exige coincidencia literal de ambos números y un custodio único registrado.
  REF original se guarda privado con hash/tamaño/hoja y sus pares congelados en la
  operación. No genera clientes/comerciales/asignaciones ni fechas históricas.
- **Revenue**: CUSTODIO, MES y AÑO de cada fila determinan el alcance. No requiere
  REF ni un custodio global. Se mantienen cuentas sólo Revenue y filas repetidas.
- Encabezado autodetectado en las primeras 20 filas por contrato completo, o fila
  explícita 1–100. Si es ambiguo se rechaza. Preámbulo y auxiliares permanecen en
  el original/manifiesto. Anotaciones sin cuenta/período/importes se pueden excluir
  indicando fila y motivo en una nueva carga; no se pueden excluir datos financieros.
- Si falta un código de custodio, las filas quedan sin alcance en el padre y el
  conjunto no se publica. Registrar el código y volver a analizar como nueva carga.
  No se crea/fusiona/desactiva catálogo silenciosamente desde un Excel.

Límites del modo nuevo: 2 MiB por original/REF, 4 MiB + 64 KiB de multipart total,
25.000 filas por hoja (incluye encabezados), 32 MiB expandidos del financiero,
1.024 alcances mes/custodio y 5.000 filas por alcance; 8 MiB de entrada RPC del
manifiesto. REF mantiene el lector acotado de 5.000 filas / 12 MiB expandidos.
Modo mensual y lectura histórica heredada mantienen sus límites anteriores.

La migración multicustodian_history extiende los guards existentes a período +
custodio + fuente y conserva versiones, idempotencia, transacción conjunta y rechazo
de publicación individual. Manifiestos heredados versión 2 siguen funcionando.
Nuevo manifiesto versión 3 conserva custodio por partición, encabezado, preámbulo,
exclusiones/motivo y errores sin alcance. Configuración de catálogo congelada para
recuperación aunque después se registren custodios nuevos. No se recalculan fórmulas.

El navegador prepara bloques secuenciales con opciones acotadas por hijo, nunca
reenvía el REF completo en cada bloque. Progreso local tras cada confirmación y
recarga del estado al terminar/pausar. Original financiero y REF se verifican por
hash antes de procesar; recuperación requiere los mismos bytes y configuración.
Ambos se pueden descargar sólo como administrador, también antes de publicar.

Los identificadores numéricos, errores Excel e importes faltantes siguen siendo
bloqueantes. Ampliar capacidad/enrutamiento no acredita que el archivo sea publicable.
Se conserva la revisión de correspondencias y de mes/custodio completo antes de
publicar. El cambio no importa ni publica automáticamente las muestras reales.


### Resumen de cargas grandes y tiempos de espera

El resumen inicial no ejecuta la conciliación completa de cada hijo. Antes de revisar
un alcance muestra «Comparación pendiente», sin inventar altas/bajas. Después utiliza
su comparación revisada y comprueba la versión activa actual. Si cambió, requiere
revisar de nuevo. La revisión individual y la publicación mantienen sus controles.
Timeout/espera de base de datos devuelve 503 reintentable con la solicitud conservada:
reintentar con los mismos archivos/formulario evita duplicar operaciones. No se amplió
el timeout administrado de 8 segundos para resolver el problema.
## Revisión de excepciones de archivos manuales (2026-11-17)

Las cargas históricas nuevas permiten decisiones explícitas con motivo: cuentas
numéricas literales acreditadas por el dueño (enteros de hasta 15 dígitos, sin
fórmulas/científica/ceros inventados); Payout broker ausente como NULL con suma
conocida y cobertura incompleta; errores de Excel en columnas descriptivas de REV
como advertencias. Cuenta, custodio, período e importe siguen siendo críticos.
Las opciones quedan congeladas con la preparación y se reutilizan al procesar
bloques. Reintentar con decisiones diferentes requiere una carga nueva. Originales,
tipo de celda, warnings, motivo y coordenadas se conservan. No cambia el circuito
de correspondencias/revisión/publicación conjunta ni se publica parcialmente.


## Master Owners / Advisory fee — implementación local 2026-11-20

Pestaña **Master Owners / Fee** en Importaciones, sólo administrador. XLSX de hasta
2 MiB, hoja explícita si hay varias, 14 headers en fila 2 y una columna Balance.
Se admite una combinada únicamente en la fila 1 de preámbulo; los demás lectores
siguen rechazando combinadas. Subtotal sólo reconocible sin cuenta/datos en las
primeras diez columnas y fórmula SUBTOTAL; se conserva en los bytes originales.
No se ejecutan fórmulas/macros. Errores de saldo/tasa Excel o cuentas ambiguas son
bloqueantes; una condición textual de tasa se conserva pendiente, nunca cero.

Flujo: guardar original → indicar trimestre/corte y evidencia → asociar Broker a
custodio → confirmar identidad literal ACCOUNT de REV o UUID individual acreditado
→ seleccionar filas → conciliar → revisar tasa anterior y confirmar publicación.
La selección de filas acredita tasa anual, trimestre completo, base bruta y fórmula
Balance × tasa /4. La selección masiva requiere una nueva conciliación; condiciones,
faltantes o cuentas no Advisory no pueden publicarse como tasas. Un UUID manual
no crea identidades ni modifica equivalencias existentes. Máximo una fila elegida
por cuenta; revisar componentes múltiples por el motor existente, sin sumarlos.

Original y manifiesto inmutables en Storage privado, ruta `master/<UUID>/`; se
retoma con ese UUID y se descarga el original con la sesión de administrador.
Una preparación no publica. Reanudar abre el archivo para una nueva revisión;
no restaura campos de un formulario que no se haya publicado. El evento publicado
conserva manifiesto, alcance, decisiones, actor y fecha. No hay borrado automático
de preparaciones ni originales huérfanos de una subida interrumpida.

RPC `import_master`: preview de identidad/pendientes y revisión de versiones;
publish conjunto con locks compartidos con correspondencias/modelo y Comisiones/ROA. Cada fila elegida alimenta
`manage_commission` (componente estable `master-owners`) y `publish_roa_rate` dentro
de la misma transacción. Una corrección conserva eventos previos, invalida tasa
anterior y publica referencia nueva. Cuenta omitida conserva su tasa previa; esto
se informa antes de publicar y no acredita que siga siendo económicamente vigente.
Un cambio de versiones o de identidad/modelo invalida la revisión y obliga a conciliar otra vez. Reintento del mismo comando y
contenido devuelve el resultado previo; no duplica obligaciones ni tasas.

Las filas sin tasa/identidad/evidencia quedan visibles en la preparación conservada,
fuera de la referencia ROA. No implica completar cobertura esperada del trimestre.
Readers no acceden al archivo, manifiesto o eventos; sólo a las referencias
publicadas existentes mediante el contrato ROA. Migración aplicada por autorización posterior como 20261120164104
en GMA (ver progress.md); el archivo privado no se incluye en Git ni en fixtures/logs/capturas.

Consulta documental: [funciones SQL](https://supabase.com/docs/guides/database/functions),
[Storage upload](https://supabase.com/docs/reference/javascript/storage-from-upload)
y changelog oficial, sin actualizar paquetes ni lockfile.


### Vigencia por rango y clasificación confirmada — 2026-11-20

El flujo visible publica sólo tasas mediante `import_master_rates`: primer y último
inicio de trimestre inclusivos; último vacío equivale al primero. Máximo 20
trimestres por carga. Para todo 2023–2026: 2023-01-01 a2026-10-01,16referencias por
cuenta elegida. La evidencia y el checkbox de vigencia deben acreditar cada
trimestre del rango. El corte del Balance es independiente y no genera importes
esperados de comisiones históricas. Balance ausente no impide una tasa acreditada.

Checkbox separado de clasificación: por confirmación del dueño, sólo Fee type
exactamente Advisory puede clasificar cuentas resueltas con servicio sin_clasificar,
incluso cuando la tasa es pendiente. No sobrescribe Brokerage/otros servicios ni
crea identidades por nombre. La revisión muestra cuántas cuentas se clasificarán,
cuántas tasas se publicarán y las versiones anteriores por trimestre. Una cuenta
pendiente o un tipo distinto de Advisory conserva sus originales, fuera de la
proyección. No se infiere historia de comerciales ni nuevas fechas de servicio.

La transacción guarda snapshot, clasificaciones (con auditoría/motivo) y referencias
ROA con FK al snapshot/fila. Las fuentes de tasas ahora admiten alternativamente
un evento de Comisiones verificado o un snapshot Master revisado; nunca ambos ni
ninguno. No se modifica la fórmula ROA. La RPC anterior `import_master` sigue
admitiendo revisiones trimestrales del flujo anterior; no se reinterpreta un
comando antiguo como un rango ni se editan migraciones que ya fueron aplicadas.
