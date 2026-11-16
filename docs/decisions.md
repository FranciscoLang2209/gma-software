# App Papá — Decisiones y pendientes

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
