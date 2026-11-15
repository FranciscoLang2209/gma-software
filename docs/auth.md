# Acceso por invitación — etapa 3

Implementación local del 2026-11-11. **Sin destino Supabase dedicado configurado ni verificación remota.** Los tres enlaces conectados se consultaron solo para listar proyectos: ninguno corresponde a App Papá. No se aplicó SQL, creó usuario, envió invitación ni cambió configuración remota.

## Configuración efectiva pendiente en el proyecto dedicado

Antes de habilitar usuarios reales, el operador con acceso al proyecto debe:

1. Aplicar todas las migraciones versionadas, en orden, en un Supabase dedicado. No exponer `app_private` en Data API; mantener `public` como esquema API y desactivar exposición automática. Verificar propietarios y grants, no copiar funciones definer como propietario `postgres` indiscriminadamente.
2. En Auth → configuración de usuarios, desactivar **Allow new users to sign up** (`disable_signup=true` en Management API). Desactivar acceso anónimo y mantener proveedores externos/SSO no solicitados deshabilitados. Confirmar la configuración efectiva después de guardar. `config.toml` no modifica un proyecto alojado.
3. Establecer Site URL al origen HTTPS exacto de la aplicación y limitar las URL de redirección. Configurar SMTP autorizado y sus límites. No dejar localhost ni comodines en producción.
4. Copiar `supabase/templates/magic-link.html` a la plantilla de Magic Link (envía `{{ .Token }}`) y `supabase/templates/invite.html` a Invite User. El enlace de invitación apunta a `{{ .SiteURL }}/invitacion?token_hash={{ .TokenHash }}`. No usar el enlace predeterminado con tokens en el fragmento: esta aplicación verifica el hash en servidor después de una aceptación explícita por POST.
5. Confirmar bucket `app-papa-imports` privado y políticas instaladas. La descarga de la app no usa URLs firmadas. No emitir enlaces públicos ni compartir URLs firmadas preexistentes: esos enlaces son credenciales transferibles hasta su vencimiento.
6. Configurar solo `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en el servidor Next. La aplicación no usa clave `service_role`/`sb_secret` ni la requiere para consultar, preparar, publicar o descargar.
7. Probar registro directo por `/auth/v1/signup` y OTP con creación de usuarios: deben fallar y no crear una cuenta. Repetir matriz de permisos de `validation.md` con JWT emitidos por Auth y peticiones REST/Storage reales.

La configuración **local versionada** ya tiene `auth.enable_signup=false`, acceso anónimo desactivado, plantillas, correo local de prueba y Storage habilitados. El stack local no se inició. Estos valores no prueban que un servicio externo los esté usando. El correo local de desarrollo solo se consulta en la bandeja del stack, puerto 54324.

## Primer administrador, sin autoasignación

El dueño/operador usa Supabase Dashboard → Auth → Invite User para invitar al correo acordado, después de configurar la plantilla. Copia el UUID exacto generado y comprueba que corresponde a ese correo. Aceptar una invitación **no asigna ningún rol**. Un usuario sin perfil habilitado no puede consultar la aplicación ni datos.

En SQL Editor del proyecto dedicado, con acceso del operador, ejecutar una sola vez lo siguiente, reemplazando los dos placeholders. No ejecutar desde el navegador de la app ni crear una RPC de bootstrap:

```sql
begin;
lock table app_private.user_profiles in exclusive mode;
do $$
declare
  invited_user uuid := '<UUID_VERIFICADO>'::uuid;
  invited_email text := '<CORREO_ACORDADO>';
begin
  if exists (select 1 from app_private.user_profiles where role='admin' and enabled) then
    raise exception 'Ya existe un administrador; revisar con el dueño';
  end if;
  if not exists (select 1 from auth.users
    where id=invited_user and email=invited_email and invited_at is not null) then
    raise exception 'La invitación no coincide con UUID y correo revisados';
  end if;
  insert into app_private.user_profiles(id,role,enabled)
    values (invited_user,'admin',true);
end $$;
commit;
```

El evento de auditoría registra el rol de base del operador; `actor_id` es null porque SQL Editor no es una sesión del usuario invitado. Conservar el responsable de esta operación en el registro operativo del dueño. No registrar tokens ni claves. El lock evita dos bootstrap concurrentes. No se elige al primer usuario registrado, no se confía en nombres ni `user_metadata`, y no se incorpora una clave privilegiada al runtime.

Para otros usuarios: invitar por Dashboard, verificar su UUID y crear explícitamente un perfil `reader`, con `created_by` igual al UUID del administrador responsable. Cualquier alta `admin`, cambio de rol o habilitación exige decisión y operación explícita del dueño/operador. **Ningún usuario de la app, incluido admin, tiene INSERT/UPDATE/DELETE de perfiles por API.** Se conserva auditoría; para revocar acceso, actualizar `enabled=false` por el operador. No borrar perfiles/historia. En emergencia de pérdida del único administrador, el operador verifica identidad y documenta la recuperación por SQL Editor; no hay endpoint público de recuperación de privilegios.

## Sesión y autorización

- `@supabase/ssr` 0.12.7 con Supabase JS 2.119.0 y Next 16.4.6. Clientes nuevos por solicitud, cookies oficiales `getAll`/`setAll`; Proxy refresca con `getClaims`, propaga cookies y aplica encabezados de caché. Identidad confirmada con `getUser` y perfil vigente por RPC. No se usa `getSession` para autorizar.
- `/ingresar`: solicitud de código con `shouldCreateUser:false`, mensaje indistinguible para cuentas inexistentes, validación de correo/código en servidor. Invitación: `verifyOtp` de tipo fijo `invite`, con aceptación por Server Action; login OTP de tipo fijo `email`. El frontend no ofrece registro ni solicita roles.
- Proxy verifica antes de renderizar; cada página del workspace y la API vuelven a verificar identidad/rol. Importaciones y Correspondencias requieren admin; Configuración es consultable por lector, y toda mutación requiere admin. Las Server Actions de Auth usan la protección de origen de Next, sin ampliar `allowedOrigins`.
- Todas las páginas son dinámicas y las respuestas pasan por `private, no-store`, `Pragma`, `Expires` y `Referrer-Policy:no-referrer`. Las consultas del cliente servidor usan `cache:no-store`. Sin ISR ni cachés persistentes de datos privados.
- Perfil habilitado y `session_id` existente en `auth.sessions`, del mismo usuario y con `not_after` vigente, son condición de cada política. Deshabilitar un perfil o eliminar/vencer la sesión niega acceso aun con JWT anterior. Logout cierra la sesión actual (`scope:local`), borra cookies mediante SSR y muestra error genérico con reintento si falla. Otros dispositivos conservan sus sesiones; deshabilitar el perfil revoca acceso global inmediatamente en las consultas posteriores.
- Sesión inválida conduce al ingreso; perfil ausente/deshabilitado o rol insuficiente a Sin acceso. Fallos de Auth/base cierran el acceso con error, nunca una demo ni datos ficticios. Errores de la API: 401 anónimo, 403 lector, 503 validación no disponible; no incluyen payloads internos.

## Base, agregados y archivos

| Superficie | Anónimo | Lector habilitado | Administrador habilitado |
| --- | --- | --- | --- |
| RPC `current_access` | Sin EXECUTE público | Su rol vigente | Su rol vigente |
| RPC `published_metrics`/`published_totals` | Sin EXECUTE | Global publicado, proyección sin originales | Igual lectura publicada |
| Vistas `admin_*` y tablas privadas | Sin acceso | Sin filas; escritura rechazada o 0 filas modificadas | Lectura de originales/configuración; escritura financiera y del modelo solo por RPC revisada (etapas 5/8) |
| RPC `publish_import` | Sin EXECUTE | Denegada | Publicación/reemplazo explícito, actor de sesión |
| Perfiles | Sin escritura | Sin escritura | Sin escritura por API |
| RPC `source_file` y `/api/fuentes/[id]` | Denegados | Denegados | Descarga autenticada, sin URL firmada |
| Storage `app-papa-imports` | Sin listado/lectura/carga | Sin listado/lectura/carga | SELECT/INSERT; sin reemplazar/borrar objetos |

Las vistas administrativas son `security_invoker=true`. Las proyecciones publicadas usan una función privada con dueño `app_papa_executor`, rol `NOLOGIN`, `NOBYPASSRLS`, sin propiedad de tablas ni membresía para usuarios. Es una capacidad acotada para leer las columnas necesarias sin conceder originales a lectores. Sus consultas atraviesan RLS y vistas invoker: solo batches publicados **y activos**. No se otorgan originales a `authenticated` mediante la política de lectura publicada.

La publicación también usa una función privada de ese rol para insertar auditoría sin permitir que usuarios fabriquen eventos. Su entrada comprueba admin vigente y la función original sigue siendo invoker. El único lookup con privilegios del propietario de migración es `app_private.current_access`: devuelve exclusivamente el rol habilitado de `auth.uid()`, contrastando su sesión real. Tiene `search_path=''`, sin SQL dinámico ni parámetros de identidad. El resto de funciones definer tampoco acepta SQL ni nombres de objetos.

`published_metrics` entrega solo fuente, cuenta UUID, custodio UUID, mes e importe como texto decimal; `published_totals` agrega cada fuente/mes por separado y conserva conteo de valores presentes. No calcula un AUM sumando meses ni implementa todavía los indicadores/rangos de etapa 6. Los originales de Revenue siguen en `admin_revenue_entries` y `admin_import_rows`, visibles solo para admin. No se borran datos financieros ni fuentes.

Las políticas restrictivas del bucket mantienen la frontera aunque exista otra política permisiva de Storage. El administrador sube cada corrección como otro objeto, sin upsert. Usuarios privilegiados del proyecto/Storage siguen siendo operadores de confianza, fuera de los roles de la aplicación.

El importador Excel, su UI y la conciliación de archivos reales no forman parte de esta etapa. La superficie SQL administrativa tiene permisos para preparar/publicar sobre el modelo existente; su prueba sintética no habilita un circuito real de importación sin implementar las etapas 4–5.

## Referencias oficiales verificadas

- [SSR Next y cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [identidad en servidor Next](https://nextjs.org/docs/app/guides/authentication).
- [Configuración general Auth](https://supabase.com/docs/guides/auth/general-configuration), [invitaciones](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [plantillas](https://supabase.com/docs/guides/auth/auth-email-templates), [OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless).
- [Sesiones y comprobación de session_id](https://supabase.com/docs/guides/auth/sessions), [Storage/RLS](https://supabase.com/docs/guides/storage/security/access-control).
- [Changelog](https://supabase.com/changelog.md), [cambio CLI 3](https://supabase.com/changelog/supabase-cli-v3). Se conserva la versión fijada y no se habilitan cifrados TLS retirados.

### Actualización de etapa 4

El importador de preparación ya existe: ver [imports.md](imports.md). Mantiene este modelo de
sesiones/RLS/Storage y no usa secretos privilegiados. Las RPC invoker `begin_import` y
`prepare_import_chunk` comprueban admin vigente y no tienen EXECUTE para anon/service_role/PUBLIC.
Los nuevos lotes `preparation_only` no se pueden revisar, marcar ready ni publicar, aun con
la RPC anterior de publicación. Los permisos de los servicios Supabase reales siguen pendientes;
las pruebas SQL/HTTP sintéticas se detallan en validation.md.

## Actualización de permisos — etapa 5

La escritura directa vía vistas/tablas de import_scopes, import_batches, import_rows, aum_monthly, revenue_entries y account_identifiers se revoca también al administrador. Preparación y correspondencias usan wrappers públicos invoker con implementaciones privadas propiedad de app_papa_executor, NOLOGIN/NOBYPASSRLS, permisos acotados y checks de admin/perfil/sesión. La publicación heredada solo acepta un lote listo; los lotes de aplicación llegan a ready mediante revisión completa. Nuevas tablas row_resolutions y fa_rows: RLS habilitado/forzado, lectura admin, escritura solo del ejecutor con admin vigente. Lectores no las consultan ni ejecutan manage_import. Correspondencias se protege también en Proxy, página y endpoint. Ver [imports.md](imports.md).


## Cuentas y administración — etapa 8

`account_directory` y `account_detail` comprueban perfil/sesión vigente y usan el ejecutor acotado con RLS. Exponen identidad resuelta, métricas publicadas, vigencias y referencias de procedencia. Lector no recibe celdas originales, headers de archivo, nombre de archivo ni acceso a Storage. Admin puede ver originales paginados; no hay escritura financiera en estas RPC. Las tablas privadas siguen cerradas al lector. RLS del ejecutor excluye cuentas/aliases exclusivos de preparación también en catálogos/sugerencias y acceso directo. La procedencia de identidades publicadas puede provenir de versiones reemplazadas: el ejecutor lee esa metadata bajo RLS, pero las métricas siguen exclusivamente en las vistas de versiones activas y los originales nunca se proyectan al lector.

`manage_model(list)` ofrece una proyección explícita de catálogo a lector/admin; únicamente admin recibe auditoría antes/después. `preview/save` exigen admin tanto en Next `/api/modelo` como en SQL. POST valida origen, cuerpo hasta 16 KiB, operación, UUID y motivo; el motor valida campos permitidos, referencias, entidades activas y solapamientos. Borrado y escritura directa del modelo revocados. Preview revierte su subtransacción; token privado por autor, vigencia de 30 minutos y revisión del modelo. Save usa lock compartido con publicación y auditoría atómica, con reintento idempotente. Sin grants de perfiles ni metadatos editables para autorización.
