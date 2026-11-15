# App Papá — Progreso

Actualizado: 2026-11-15, fecha local de Buenos Aires. **Etapa 10 solicitada: preparación local de operación verificada; configuración y validación alojadas pendientes de destinos/accesos y decisiones del dueño.** Último circuito funcional completo: etapa 9, sintético local. Los apartados anteriores son registros históricos.

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
