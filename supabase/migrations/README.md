# Migraciones de App Papá

`20261111174240_financial_schema.sql`: esquema privado, 15 tablas, identidad,
procedencia, vigencias, hechos financieros, versiones, auditoría, RLS cerrado y
vistas invoker. La tabla auxiliar `import_scopes` permite un único puntero vigente
por fuente/mes/custodio, sin flags duplicados en los hechos.

Nombre generado con `npx --no-install supabase migration new financial_schema`,
CLI 3.1.0 fijada en el lockfile. SQL revisado y comprobado desde cero en PostgreSQL
17.11 nativo temporal. No se ejecutó `db pull`, `db push`, `db reset` ni una
migración remota. Una vez aplicada en un entorno compartido, cualquier cambio debe
agregarse como nueva migración; no editar retrospectivamente su historia.

```sh
npm run test:db
npx --no-install supabase migration new --help
npx --no-install supabase migration new nombre_descriptivo
```

El primer comando solo usa un clúster efímero propio, sin TCP ni URL externa, y lo
elimina al terminar. Ver [pruebas y límites](../../docs/validation.md),
[diccionario](../../docs/data-dictionary.md) y
[consultas](../../docs/aggregate-queries.md).

En un stack Supabase local dedicado futuro, revisar primero el help de `start`,
`db reset`, `migration list`, `db lint` y `db advisors` de la versión instalada.
No apuntar a una base remota para suplir Docker ausente. Los roles anon,
authenticated y service_role y el esquema auth deben existir (los provee Supabase;
el runner nativo crea solamente contratos mínimos para estas pruebas).

`20261111180338_auth_authorization.sql`: políticas admin/reader, lookup de perfil/sesión,
RPC seguras y vistas administrativas invoker, rol interno sin BYPASSRLS, bucket privado
y límites restrictivos de Storage. Nombre generado con CLI `migration new auth_authorization`.
La configuración de registro público del proyecto alojado requiere el paso operativo de
[docs/auth.md](../../docs/auth.md); una migración SQL no modifica GoTrue.

No hay archivos financieros ni secretos en las migraciones o fixtures. El
esquema no autoriza al importador futuro a marcar ready sin validación de archivo,
convenciones, correspondencias y conciliación.

`20261112143232_import_preparation.sql`: generada con `supabase migration new import_preparation`,
CLI 3.1.0. RPC invoker para registrar original y preparar chunks atómicos/reanudables, índice
no único de hash y bandera/trigger que impiden publicar los nuevos preparados. Se agrega
la bandera al final de la vista administrativa invoker existente. No se aplica a un destino
remoto ni desactiva RLS; no hay nuevas tablas. Ver [preparación](../../docs/imports.md).

`20261114012532_account_resolution_publication.sql`: cuarta migración, generada por CLI
`migration new account_resolution_publication`. Resolución auditada por fila y aliases,
FA versionado con vigencias, revisión completa, conciliación decimal, publicación atómica
por alcance/token y exclusión de solapamientos. Revoca escrituras API directas y mueve las
implementaciones de preparación al esquema privado con el ejecutor sujeto a RLS. Los
wrappers públicos siguen siendo invoker. No se aplicó remotamente; ejecutar todas las
migraciones en orden en destino dedicado y verificar permisos/servicios antes de uso real.


`20261114015146_aggregate_queries.sql`: quinta migración, generada con CLI
`migration new aggregate_queries`. Consulta agregada única con filtros, historia al cierre,
series/calendario/cobertura, numeric como texto y páginas con revisión. Wrapper invoker,
ejecutor sin BYPASSRLS y políticas dimensionales solo para la proyección, sin abrir
originales al lector ni nuevas escrituras. No crea índices redundantes. Contrato y límites
en [consultas](../../docs/aggregate-queries.md). Solo probada localmente.


`20261114022000_dashboard_projection.sql`: sexta migración, generada con CLI
`migration new dashboard_projection`. Reemplaza únicamente el cuerpo de la RPC privada
existente y conserva su propietario/permisos. Rankings y participaciones numeric antes
de paginar, opciones observadas y fecha de publicación para las pantallas. No modifica
hechos, tablas, vigencias ni publicaciones. Probada desde cero en PostgreSQL temporal;
sin aplicación remota. Contrato en [consultas](../../docs/aggregate-queries.md).

`20261115174622_accounts_administration.sql`: séptima migración; directorio/detalle seguro,
administración con preview/confirmación, vigencias y auditoría. Solo pruebas locales sintéticas.

`20261115190934_import_retry_after_preparation.sql`: octava, generada con CLI
`migration new import_retry_after_preparation`. Corrige retry de carga tras parsing/publicación
comparando las convenciones originales sin la configuración añadida. Conserva función/propietario/
grants, archivos y versiones existentes; no modifica datos financieros. Verificada desde cero y por
regresiones SQL/HTTP, sin aplicación remota.

### Primer destino administrado (etapa 10)

En Supabase PostgreSQL17.11 el operador `postgres` tiene CREATEROLE/BYPASSRLS,
pero no SUPERUSER. La migración2, aún sin aplicar en ese destino, necesitó un
grant explícito temporal con INHERIT/SET al creador del ejecutor para transferir
propiedad de funciones. La migración8 retira ese grant propio al terminar.
La membresía automática de administración de PostgreSQL queda sin INHERIT ni SET;
ningún rol de aplicación gana membresía. Estas correcciones se hicieron antes de
aplicar esas dos versiones en el único destino compartido autorizado; la migración1,
ya aplicada, no se modificó. Ocho versiones coincidentes en el destino de prueba.

`test:db` ahora prueba primero toda la cadena con un operador sintético sin
SUPERUSER y comprueba propietario/limpieza de permisos, además de sus suites previas.
Para migraciones futuras que modifiquen funciones del ejecutor, usar y retirar
explícitamente el permiso temporal del operador dentro del alcance revisado;
no dar LOGIN/BYPASSRLS al ejecutor ni membresía a usuarios de la aplicación.

`20261117133211_historical_aum_uploads.sql`: operación padre AUM, manifiesto,
asociación inmutable de hijos/versiones con original único, RLS admin, auditoría,
RPC agrupada y trigger contra publicación individual. Mantiene el publicador y
las vistas vigentes. Una transacción publica todas las particiones; fallo revierte
todos los punteros. Grants del ejecutor se fijan antes de transferir propiedad y
se retira la membresía temporal del operador. No se aplicó a destinos remotos.

`20261117175338_commission_reconciliation.sql`: motor trimestral local sobre
entradas revisadas. Eventos inmutables con originales/actor/versiones, RLS forzado,
clasificación de Revenue vigente, reservas exclusivas con lock transaccional y
consultas comparables con cobertura. RPC de comando y reporte bajo ejecutor acotado,
permiso temporal del operador retirado. No cambia hechos/publicadores existentes.
Ver `docs/commissions.md`. Probado sólo en clústeres sintéticos locales, sin aplicar
remotamente ni acreditar muestras financieras reales.

`20261117181230_commission_dashboard.sql` agrega consulta estable administrativa
para las cuatro vistas/CSV, agregación numeric por base y evidencia trazable.
Reutiliza el motor anterior, sin modificar hechos, historial ni publicación.
Grants/RLS y propietario sin SUPERUSER se verifican en `test:db`. Migración
exclusivamente local en esta etapa; no aplicada a ningún proyecto remoto.
