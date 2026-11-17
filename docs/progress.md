# App Papá — Progreso

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
