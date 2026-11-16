# App Papá — Operación y puesta en uso

Revisado el 2026-11-15 (Buenos Aires). **Preparación local; puesta en uso pendiente.**
La base de prueba **gma-software-prueba** está creada en Supabase Free/São Paulo,
ref `zwdqnrbqqszjrtkhyqnz`, con ocho migraciones aplicadas y conectada solo a Preview.
Registro público/anónimo desactivado; bucket privado con límite2MiB. La integración
conserva en runtime solo URL/clave publicable; no claves administrativas. Todavía
no hay apertura a datos reales ni restauración completa validada. Por autorización posterior
del dueño se creó el proyecto Vercel app-papa, luego renombrado por él a
[gma-software](https://vercel.com/franlang2209-8232/gma-software),
en la cuenta `franlang2209-8232`, que continúa en Hobby. Proyecto
`prj_lPEM6UXsDFB4YBzBs5p1BAKgRHn2`, equipo `team_ckh7dlHz13Q9LyiEOOob04Nx`.
Configuración remota leída tras guardar: Next.js, Node **24.x**, instalación `npm ci`,
build `npm run build`. Protección observada `all_except_custom_domains` y
`gitForkProtection=true`; no se debilitó. No hay autorización para activar planes pagos.
Preview verificado: [rama prueba](https://gma-software-git-prueba-franlang2209-8232.vercel.app),
Functions en gru1 y Node24.x. El acceso conserva protección Vercel y permisos de la app.
**SMTP quedó pendiente por decisión del dueño:** la consola Free exige SMTP propio
para editar las plantillas usadas por esta app. No se envió invitación ni se creó el
primer administrador. No usar el correo predeterminado con enlaces que la app no
admite ni cambiar a un plan pago para resolverlo sin autorización.
Se configuró `VERCEL_ORG_ID` como Config para Preview/Production; URL/clave Supabase
solo en Preview. Production sigue sin base ni origen autorizados. No conectar la
base de prueba a Production. Si la integración vuelve a sincronizar variables al
rotar claves o reconectar, retirar las administrativas/públicas antes de desplegar.

CLI **65.16.0** ejecutada con `npx`, sin añadir dependencias. Para operar este proyecto
usar siempre `--scope franlang2209-8232 --global-config /Users/franciscolang/.config/app-papa-vercel`;
la sesión separada fue autorizada por el dueño en Chrome y su directorio/archivos
tienen permisos 700/600. La sesión global por defecto sigue siendo Watchparty:
**no usarla para esta app**. `.vercel/project.json` enlaza solamente este proyecto.
`vercel link` generó automáticamente `.env.local` con un token OIDC de desarrollo;
se eliminó ese archivo nuevo, sin imprimir el token, porque el runtime no lo necesita.

## Destinos y variables por ambiente

| Ambiente | Base/Auth/Storage | Variables Next | Datos |
| --- | --- | --- | --- |
| Desarrollo | Stack local propio o proyecto dedicado de desarrollo | `.env.development.local`, desde `.env.development.example` | Sintéticos |
| Prueba alojada | Supabase compartido con producción por decisión del dueño | Vercel **Preview**, desde `.env.preview.example` | Sintéticos identificados |
| Producción | Mismo Supabase que Preview: `zwdqnrbqqszjrtkhyqnz` | Vercel **Production**, desde `.env.production.example` | Reales solo tras los criterios de apertura |

Los arneses `test:db`, `test:auth:http` y `test:dashboard` crean su entorno sintético;
no necesitan ni deben recibir credenciales reales. Preview ejecuta Next en
`NODE_ENV=production`; no usar `NODE_ENV=preview` ni esperar que Next cargue
`.env.preview.local` automáticamente. Evitar `.env.local` global: puede sobreponerse
a los archivos específicos. El entorno del proceso tiene prioridad sobre los archivos.
Ver [carga de variables Next](https://nextjs.org/docs/app/guides/environment-variables).

Runtime: **solo `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`**, ambas sin `NEXT_PUBLIC_`.
La clave publicable no es un privilegio administrativo; los permisos dependen del JWT,
perfil y RLS. Nunca incorporar `service_role`, `sb_secret`, contraseña PostgreSQL,
token de plataforma o SMTP al cliente ni al runtime de Next. Las credenciales de
operador se guardan en el gestor del dueño o la sesión autenticada de su herramienta;
SMTP se configura en Supabase. No pegarlas en el chat, comandos, logs ni repositorio.

`config/deployment-targets.json` es el registro **sin secretos** de los destinos
revisados: referencia Supabase, proyecto/equipo Vercel y origen HTTPS fijo para Auth.
Sus valores vacíos bloquean el build remoto intencionalmente. Completar únicamente
el ambiente autorizado, contrastando los IDs con los dashboards. Preview y Production pueden compartir referencia solo con `sharedSupabase: true`
en ambos destinos y el mismo proyecto/equipo Vercel. Desarrollo continúa separado.
Las pruebas alojadas comparten usuarios, archivos y datos con producción; sus escrituras
afectan el mismo negocio. Los arneses locales siguen usando datos sintéticos aislados.

`npm run prebuild` ejecuta el control cuando `VERCEL=1`; verifica entorno, proyecto,
equipo declarado, URL/clave publicable e impide variables Supabase privilegiadas o
públicas. En Vercel habilitar variables de sistema y configurar `VERCEL_ORG_ID` como
Config con el team ID revisado: **no es una variable de sistema garantizada**.
`VERCEL_PROJECT_ID` sí es provisto por Vercel. La comprobación del equipo declarado
es consistencia de configuración, no prueba independiente de propiedad. No sustituye
el inventario, la autorización del dueño ni las pruebas de servicios.

Para revisar un archivo local de prueba explícitamente, cargarlo con Node, sin imprimirlo:

```sh
VERCEL_ENV=preview VERCEL_PROJECT_ID=prj_ID_REVISADO VERCEL_ORG_ID=team_ID_REVISADO \
  node --env-file=.env.preview.local scripts/check-deployment.ts --required
```

Los IDs anteriores son placeholders. No se ejecutó este ejemplo con credenciales reales.
El build local sin conexión permanece disponible; no usar `next build` directamente
para eludir el prebuild al desplegar. `.vercelignore` excluye `.env*`, fuentes
Excel/CSV y directorios privados/backups de cargas CLI. Mantener fuentes privadas
fuera del árbol del proyecto; `.gitignore` no despublica archivos ya versionados.

## Región, plan y capacidad

**Sin elegir región ni plan operativo:** faltan volumen representativo, frecuencia,
presupuesto, requisitos de residencia y objetivos de recuperación del dueño.
Como candidatos a comparar, São Paulo es `sa-east-1` en Supabase y `gru1` en Vercel;
North Virginia es `us-east-1` / `iad1`. Ubicar cómputo cerca de la base una vez
confirmada residencia/costo, y medir latencia. No inferir residencia por el idioma
ni reutilizar la región de proyectos ajenos. Fuentes:
[Supabase](https://supabase.com/docs/guides/platform/regions),
[Vercel](https://vercel.com/docs/functions/configuring-functions/region).

Hobby Vercel está limitado a uso personal/no comercial; no se adopta como plan para
operar este negocio. Evaluar plan comercial con el dueño antes de habilitarlo;
no se inició trial, upgrade ni compra. Supabase Free puede servir para prueba si
existe cuota autorizada: publica 500 MB de base, 1 GB de archivos, 5 GB de egreso
y pausa por inactividad. No implica backups recuperables incluidos ni capacidad
suficiente para historial. Confirmar la factura completa: ambientes, compute,
Storage, egreso, correos y recuperación. Ver
[uso permitido Vercel](https://vercel.com/docs/limits/fair-use-guidelines) y
[cuotas Supabase](https://supabase.com/pricing).

Límites oficiales consultados con Fluid Compute: cuerpo de petición/respuesta
Vercel 4,5 MB; memoria por defecto 2 GB; duración por defecto 300 s, máximo
800 s Pro/Enterprise, con extensión beta que no se adopta. El MVP tiene original
2 MiB, multipart 2 MiB + 64 KiB (2.162.688 bytes), XLSX expandido 12 MiB,
5.000 filas/hoja, 64 columnas y 10 hojas. La subida actual cabe bajo el límite de
cuerpo; no se aumentan estos topes. Referencia:
[Functions limits](https://vercel.com/docs/functions/limitations).

`npm run benchmark:imports` genera seis archivos **sintéticos**, 5.000 filas por
caso, en temporales privados eliminados al terminar; reutiliza los lectores reales,
verifica totales y serializa cada chunk. Ejecuta en proceso separado cada caso y
repite lectura completa por petición, como el importador. Resultados en `validation.md`.
No mide la red, Next completo, Auth, descarga Storage, RPC, publicación, consultas,
exportación ni concurrencia en hosting. Es una muestra de forma/volumen declarados,
no el peor caso de todos los límites combinados ni un volumen de negocio confirmado.

Antes de abrir el servicio, medir un archivo privado representativo por fuente:
bytes comprimidos/expandidos, hojas/filas/columnas, tamaño de respuesta, pico RSS,
duración máxima por petición y total, tiempos Storage/RPC y dos trabajos simultáneos.
Repetir en el plan/región elegidos; incluir publicación de 5.000 filas y exportación
con los nombres/longitudes reales. El CSV completo tiene tope 10.000 filas y hasta
40 consultas; su respuesta en memoria también está sujeta al límite de cuerpo.
No se garantiza ese máximo en Vercel sin medir sus bytes y duración.

Si un archivo representativo excede esos topes, **no dividir filas del mismo
fuente/mes/custodio en publicaciones independientes**: cada publicación sustituye
todo el alcance y perdería cobertura. Antes de admitirlo, implementar subida
directa autorizada a Storage privado, vinculada a lote/ruta/actor, con expiración,
límites, no-upsert y verificación servidor de tamaño/hash. Procesamiento con
cursor/configuración/estado persistidos e idempotencia; lectura acotada o índice de
filas persistido para evitar releer libros grandes. Verificar reanudación tras timeout,
no duplicación y publicación atómica del alcance entero. No hay esa ampliación
implementada ni promesa de soportar esos volúmenes. El procesamiento actual **ya**
persiste hasta 250 filas/~1 MiB por RPC, pero relee el libro en cada petición.

## Migraciones, Auth y Storage antes del primer uso

1. Confirmar organización, referencia e IDs autorizados y plan/región. Inventariar
   tablas, historial de migraciones y bucket antes de escribir. Si hay objetos de
   otra aplicación, detenerse. No usar `db reset` remoto ni `include-all` a ciegas.
2. Aplicar **las ocho migraciones existentes en orden**; no hubo cambio de esquema
   en esta preparación. Lista y propósito en `supabase/migrations/README.md`.
   CLI 3.1.0 usa local por defecto. Help comprobado de `link`, `db push`,
   `migration list`, `db dump`. Con sesión del operador autorizada, primero revisar:

   ```sh
   npx --no-install supabase migration list --remote=REFERENCIA_REVISADA
   npx --no-install supabase db push --remote=REFERENCIA_REVISADA --dry-run --skip-vault
   ```

   Si el destino e historial coinciden, ejecutar el mismo push sin `--dry-run`;
   confirmar el destino exacto de la CLI, sin contraseñas por flags. Después repetir
   `migration list`, revisar propietarios/grants y ejecutar advisors del destino.
   No exponer `app_private`; Data API solo `public`, sin exposición automática.
3. Auth alojado: **Allow new users to sign up desactivado**, acceso anónimo
   desactivado, sin OAuth/SSO no solicitados. Verificar lectura de configuración
   después de guardar; `supabase/config.toml` solo configura el stack local.
4. Site URL compartida = `https://gma-software-franlang2209-8232.vercel.app`;
   al configurar Auth alojado, conservar el alias Preview como redirect exacto
   `https://gma-software-git-prueba-franlang2209-8232.vercel.app`.
   Este registro no actualiza la configuración remota automáticamente. Invitación =
   `ORIGEN/invitacion?token_hash={{ .TokenHash }}` mediante plantilla versionada
   `supabase/templates/invite.html`. Magic Link usa el código `{{ .Token }}` de
   `magic-link.html`. La aceptación del hash es por POST, no fragmento de URL.
   Limitar redirects a URLs exactas necesarias de ese ambiente, sin comodines,
   localhost ni otros proyectos. No hay callback OAuth que configurar.
   Preview con URL efímera debe adoptar un alias fijo revisado antes de invitar;
   no promover un preview esperando que Site URL cambie automáticamente.
5. SMTP autorizado con remitente/dominio verificado y límites efectivos. El SMTP
   predeterminado solo envía a miembros del equipo y tiene un límite actual de
   2 mensajes/hora: no sirve como correo operativo. Probar entrega real y que el
   proveedor no reescriba los enlaces. Ver
   [SMTP](https://supabase.com/docs/guides/auth/auth-smtp) y
   [redirects](https://supabase.com/docs/guides/auth/redirect-urls).
6. Bucket `app-papa-imports` **privado**, sin URL pública ni emisión rutinaria de
   enlaces firmados; fijar límite de objeto de 2 MiB en el proyecto dedicado.
   La app envía `application/octet-stream`: conservar ese MIME si se restringen tipos.
   Políticas SQL existentes: solo admin habilitado con sesión vigente SELECT/INSERT,
   sin UPDATE/DELETE incluso frente a otra policy permisiva; anon/reader denegados.
   No upsert; cada versión usa otro objeto. Verificar objetos/policies efectivos
   con JWT reales, incluidas descarga directa y fuente histórica. Ver
   [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control).
7. Configurar las dos variables por ambiente, completar destinos y ejecutar prebuild.
   Usar `npm run build` y despliegue **Preview** explícito en el proyecto revisado,
   con protección de acceso disponible en su plan. No desactivar protección para
   automatizar pruebas. El código sigue requiriendo invitación/perfil aunque exista URL.
   No hay deploy hook ni CI personalizado. Git está inicializado con `origin`
   en `FranciscoLang2209/gma-software`, branch `main`. Al enlazar Git, Vercel puede
   iniciar builds automáticamente con los pushes; el prebuild seguirá bloqueándolos
   hasta tener Supabase y orígenes revisados. No eludir ese control para lograr un deploy.

## Bootstrap e invitaciones

El operador invita desde Dashboard Auth al correo acordado del dueño, verifica
UUID/correo/invited_at, y ejecuta **la transacción con lock y comprobación de admin
existente de [auth.md](auth.md#primer-administrador-sin-autoasignación)**. No crear
otro mecanismo de bootstrap. Un invitado sin perfil no accede. Registrar responsable,
fecha, ambiente y UUID sin tokens/códigos; el evento SQL conserva auditoría.

Para un lector, invitar desde el mismo proyecto, verificar UUID y correo, y crear
perfil `reader`, `enabled=true`, `created_by=UUID_ADMIN_RESPONSABLE` mediante operador
autorizado. No otorgar `admin` por defecto. Para revocar, deshabilitar perfil por
operador y comprobar denegación en una sesión existente; conservar usuario/historia.
Ningún usuario de la app, tampoco admin, puede cambiar perfiles por API. No autorizar
por nombres, `user_metadata` ni orden de registro. Invitación/código vencido se reenvía
tras revisar identidad y rate limits; no compartir enlaces por canales públicos.

## Importar AUM, Revenue y FA

En Configuración registrar custodios/códigos y entidades con evidencia. Revisar
los contratos de [producto](product.md) y [formatos](imports.md). Solo admin importa.
Preservar original privado; no ejecutar macros ni fórmulas. Declarar una fuente,
un mes y un custodio completo; seleccionar hoja, delimitador y convención decimal.

| Fuente | Control previo | Conciliación |
| --- | --- | --- |
| AUM (6 columnas) | Referencias textuales/custodio, mes/año, sin subtotales mezclados ni duplicados de cuenta | Una fila consolidada/cuenta/mes; total de `Value (USD)` contra Excel; no sumar meses |
| Revenue (29 columnas) | CUSTODIO/código y período iguales a selección; conservar las 29 columnas y todas las filas legítimas | Filas, valores presentes y `SUM(Payout broker)` USD por mes/custodio/cuenta; negativos y repeticiones conservados |
| FA (7 columnas) | Acreditar namespace/custodio, UUID cuenta, columna comercial y fechas explícitas | Referencias/cuentas/asignaciones y cobertura temporal; no tiene total monetario; OLD Owner no acredita historia |

Subir → elegir hoja → validar/preparar. Pausar o cerrar detiene el siguiente chunk;
retomar desde Importaciones, no iniciar otra carga si solo se quiere reanudar.
Revisar errores/originales, resolver cada cuenta con evidencia en Correspondencias
y confirmar UUID compartido entre fuentes solo cuando esté acreditado. Meses sin
asignación siguen visibles en totales. FA requiere inicio y fin exclusivo opcional;
`Grupo` no identifica al comercial. Crear clientes/equipos/membresías expresamente,
sin unir personas por nombre ni inferir vigencias del mes de carga.

Confirmar alcance completo → Revisar → cotejar candidata/activa → Publicar versión
revisada. Errores bloqueantes impiden todo el lote. `ready` no significa publicado;
comprobar estado, versión activa y evento con actor. Preparación/fallo no cambian
totales publicados. Archivo vacío o custodio ausente nunca ordena borrar/reemplazar.

## Errores, correcciones y recuperación de versión

| Situación | Acción |
| --- | --- |
| Red/Storage falló al cargar | Reintentar el mismo formulario/solicitud y original; revisar lote ya registrado. No borrar metadatos ni sobrescribir objeto |
| Procesamiento interrumpido | Abrir lote y retomar configuración fija/cursor; reintento no agrega filas ya confirmadas |
| Formato, fórmula sin caché, ceros perdidos, headers o decimal ambiguo | Corregir/reexportar una copia desde origen sin ejecutar en la app; nuevo lote si cambia archivo/configuración. No rellenar ceros inventados |
| Correspondencia ambigua/conflicto AUM/FA | Detener publicación y obtener evidencia; no sumar duplicados ni forzar alias |
| Revisión vencida/obsoleta (409) | Recargar, revisar activa y conciliar otra vez; nunca ignorar otra publicación |
| Error al publicar | Consultar estado antes de repetir; repetir el mismo lote activo es idempotente |
| 401/403/503 | Revisar sesión/perfil/destino o estado del servicio; no cambiar roles ni caer a demo para ocultarlo |
| Archivo supera topes | Conservar original y revisar capacidad/arquitectura; no publicar trozos del mismo alcance |

**Corregir un período:** importar archivo completo corregido para la misma
fuente/mes/custodio; resolver, revisar diferencias de filas/total/activa y publicar.
Verificar que otro custodio y otros períodos conservan cifras. Registrar motivo,
lote anterior/nuevo, responsable y conciliación. La versión anterior queda
`superseded`, inmutable y descargable por admin.

**Recuperar una versión:** descargar su original privado desde historial, verificar
SHA-256 contra metadatos, reimportar como nueva versión del mismo alcance, resolver
y conciliar; para FA revisar y reconfirmar también la configuración/fechas originales
registradas, que los bytes por sí solos no contienen. Publicar tras revisión contra
la activa. No editar hechos ni volver a apuntar manualmente a una versión histórica.
Esta recuperación funcional es distinta de restaurar un backup completo.

## Comprobar totales y habilitar datos reales

Elegir los mismos filtros/fechas en Excel y app. Conciliar por fuente independientemente
antes de relacionarlas: filas originales/preparadas/publicadas, importes presentes,
duplicados legítimos, AUM del último mes seleccionado y Revenue sumado del rango.
Comparar global, custodio y cuenta; luego cliente/comercial/equipo/servicio incluyendo
sin asignar, N/D, ceros y negativos. Con iguales filtros deben coincidir Resumen,
Análisis comercial, cuenta y CSV completo. Importar CSV como texto en Excel cuando
la precisión exceda la admitida por Excel; no redondear para disimular diferencias.

Antes de usar datos reales deben quedar **resueltos y registrados con el dueño**:
campo/mapeos comerciales y namespaces, alcance completo de cada entrega, vigencias
iniciales y cobertura esperada. Después conciliar un período real contra los Excel
originales privados; documentar filas/totales/diferencias por fuente/custodio/cuenta,
aprobador y fecha. No existe todavía esa conciliación.

En despliegue aislado repetir primero con sintéticos: OTP/invitación de un solo uso,
signup directo y OTP con alta rechazados sin crear usuarios, anónimo/lector/admin,
perfil sin habilitar/revocado, REST/RPC/Storage directos, fuente privada/histórica,
preparación/reanudación, publicación/retry, corrección aislada, consulta/exportación.
Confirmar cookies HTTPS, no-store y que fallos no muestran originales/tokens.
Registrar URL/deploy ID, versión de runtime/base, ocho migraciones y resultados.
Las pruebas locales de `validation.md` no sustituyen este acta remota.

## Backups, restauración y retención

**Plan operativo no elegido; backups remotos no configurados ni restaurados.**
Capacidades publicadas, a confirmar en el proyecto/contrato elegido:

| Plan Supabase | Recuperación publicada de base |
| --- | --- |
| Free | Mantener exportaciones propias fuera del proyecto; no asumir backups diarios recuperables |
| Pro | Backups diarios, últimos 7 días |
| Team | Backups diarios, últimos 14 días |
| Enterprise | Hasta 30 días de backups diarios según plan |
| PITR | Requiere contratación/configuración adicional; no está activado ni presupuestado |

El backup SQL/físico de base **no contiene los bytes de Storage**, solo sus metadatos.
Borrar un objeto no se revierte restaurando SQL. Fuente:
[Database Backups](https://supabase.com/docs/guides/platform/backups).

Acordar con el dueño RPO (pérdida máxima aceptable), RTO (tiempo de recuperación),
responsable y destino cifrado independiente antes de declarar recuperación lista.
Propuesta para revisar: snapshot/exportación y copia de fuentes antes de cada
corrección importante y backup periódico según RPO; esto no está automatizado.
Mantener juntos un manifiesto de fecha/proyecto/migraciones, tablas y conteos,
versiones activas, totales por alcance, bucket/ruta/tamaño/SHA-256 de **cada** original,
y un inventario de configuración Auth/SMTP/roles/policies sin secretos en texto plano.
Guardar copias cifradas con acceso restringido y claves recuperables por el dueño.

Para exportación manual, el operador consulta `supabase db dump --help` de CLI3.1.0
y usa destino `--remote=REFERENCIA_REVISADA` explícito. Obtener roles, esquema y datos
por separado según la [guía oficial de backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
Comprobar inclusión de **app_private**, public, usuarios/identidades Auth y datos
necesarios de Storage e historial `supabase_migrations`; no asumir que el dump
predeterminado incluye esquemas administrados o sus políticas personalizadas.
Revisar el contenido y permisos del archivo sin publicar registros. No poner URL
con contraseña en flags/logs. No ejecutar un dump remoto hasta tener destino autorizado.

Copiar por API/CLI de Storage autenticada todos los originales, incluidos lotes
fallidos, incompletos e históricos; la paginación debe terminar y cada ruta/hash/tamaño
debe coincidir con el manifiesto. Un objeto ausente es incidente, no motivo para
eliminar su lote. Restringir copias y credenciales de backup a operadores; no usar
URL pública ni entregar service_role al runtime. No hay job de copia instalado.

Ensayo de restauración (pendiente) en **otro destino aislado autorizado**:

1. Congelar escrituras durante snapshot/copia o acordar punto consistente; conservar
   la fuente original del incidente. Restaurar roles revisados, esquema/datos/historial
   con parada ante error, conforme al método del plan. Mantener
   `app_papa_executor` NOLOGIN/NOBYPASSRLS, propietarios y grants correctos.
2. Reaplicar/verificar personalizaciones de Storage/Auth, bucket privado y políticas;
   subir bytes faltantes por sus rutas originales sin sobrescribir datos distintos.
   Comprobar todos los hashes/conteos; restaurar solo metadata no basta.
3. Comparar hechos, auditoría y punteros/versiones, totales decimales por alcance,
   identidades/vigencias y fuentes históricas contra el manifiesto; comprobar Auth
   efectivo y permisos por rol. Recrear configuración SMTP/URLs y secretos desde
   el gestor autorizado; no dar por restauradas sesiones ni configuraciones externas.
4. Medir RPO/RTO, documentar divergencias y obtener revisión del dueño antes de
   cambiar variables/dominio al destino recuperado. Un rollback Vercel revierte
   código, **no** publicaciones ni migraciones ni archivos; corregir datos por el
   circuito versionado cuando no sea necesaria una restauración completa.

**Retención pendiente del dueño:** plazo para originales, preparados/fallidos,
versiones publicadas/reemplazadas, auditoría y backups; excepciones/bloqueos, permisos
y procedimiento de recuperación/borrado. Hasta acordarla, no hay cron, lifecycle
ni borrado automático. Esto conserva el historial; no constituye una política de
retención permanente acordada. Antes de habilitar borrados demostrar recuperación
de base **y** archivos bajo el plan efectivo.


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
