# Fase 5 — filtros y dashboards locales

Actualización 2026-11-24: aplicada en GMA con autorización del dueño como
20261124202626_reference_filters_and_complete_options. Archivo renombrado desde
20261124172735 para coincidir con MCP, SQL idéntico. Ver [progreso](progress.md).
Las menciones de pendientes siguientes conservan el cierre local de Fase 5.

2026-11-24. Implementación local; migración **no aplicada a GMA**, sin despliegue ni
cambios de identidad/hechos financieros. Ver evidencia final en
[data-quality-validation.md](data-quality-validation.md).

## Cambios

Resumen, Análisis comercial, Cuentas/directorio/detalle y ROA admiten filtros
independientes de cliente/comercial/equipo **REF**, además de los canónicos existentes.
Las etiquetas son una foto publicada sin vigencia histórica: no crean personas,
clientes canónicos ni asignaciones comerciales. Los filtros se combinan con AND.

La selección se resuelve en PostgreSQL como población de UUID de cuentas antes de
agregar cada fuente. AUM y Revenue conservan sus agregaciones independientes; la
selección REF no agrega un JOIN de detalle ni elimina cuentas con una sola fuente.
AUM del rango sigue siendo el último mes, Revenue suma el rango y ROA usa sus
tres meses/base de cobertura existentes. Las tasas y umbrales permanecen iguales.

El detalle de cuenta ahora aplica también los filtros a su lista AUM (antes esa
lista no aplicaba las condiciones que sí filtraban Revenue). Mantiene visible la
identidad/contexto de la cuenta, sin convertir una exclusión por filtros en cuenta
inexistente. Los meses conservan su indicador de contexto fuera del filtro.

Los selectores financieros eliminan el corte de 100 opciones y ofrecen búsqueda
local por etiqueta/ID. PostgreSQL devuelve la lista completa de opciones observadas
bajo los filtros, independientemente del tamaño de página de la tabla. La selección
se conserva al buscar, incluso si no coincide con el texto de búsqueda. Las cuentas
se muestran con identificador original acreditado, manteniendo UUID como valor.

El volumen actual permite cargar las opciones completas; no se implementó un
buscador remoto paginado. Si el volumen medido lo requiere, paginar sin volver a
introducir cortes inaccesibles. La prueba SQL de 800 cuentas verifica la eliminación
del límite; no promete rendimiento ilimitado del dropdown.

Las opciones REF describen etiquetas de toda la foto publicada con alguna cuenta
relacionada; no se recortan por el período ni por los filtros financieros dependientes.
Esto permite explorar otra referencia aunque el resultado actual sea vacío. Las
opciones canónicas siguen siendo las observadas bajo el conjunto filtrado.

Comisiones conserva su circuito administrativo de expectativas/cobros/conciliación,
beneficiario literal revisado y bases separadas. No se transforma REF en beneficiario
fechado ni se conecta todo Revenue a una comisión automáticamente. Configuración
conserva UUID y paginación propios. Los límites administrativos de Correspondencias
(50 lotes/200 cuentas y aliases) quedan para su sección de revisión/calidad de datos;
esta fase corrige selectores de las pantallas financieras, no inventa relaciones.

## Contrato y revisión

| URL | Valor |
| --- | --- |
| `ref_snapshot` | UUID de la foto publicada; obligatorio si hay selección REF |
| `ref_cliente` | Primera source_row del grupo literal de cliente o `sin_referencia` |
| `ref_comercial` | Primera source_row del grupo literal comercial o `sin_referencia` |
| `ref_equipo` | Primera source_row del grupo literal de equipo o `sin_referencia` |

Los IDs de fila identifican grupos dentro de esa foto/dimensión; no identifican
personas ni cuentas por nombre. El servidor verifica que sean los representantes
correctos, conserva etiquetas literales y rechaza nombres usados como IDs, filas
no representativas, claves desconocidas y valores inválidos. Sin referencia incluye
cuentas sin fila REF o con etiqueta NULL para la dimensión elegida. Sin filtro
incluye todos, también sin referencia.

Snapshot obsoleto produce conflicto de revisión (409/SQLSTATE 40001), sin aplicar
la selección a otra foto. Los enlaces de reinicio indican cuándo limpian REF;
reintentar conserva filtros. Si fallan las opciones, la selección REF se conserva
en el formulario y se explica su indisponibilidad. No hay fallback mock.

Enlaces entre vistas, paginación, comparación T1–T4 y CSV completo conservan los
parámetros. CSV declara snapshot, selectores/etiquetas y la base sin vigencia.
La huella de revisión incluye las selecciones REF además de la revisión financiera.
Los errores técnicos siguen separados de una respuesta vacía; la mejora integral
de motivos del vacío se hará en Fase 9.

## Migración y compatibilidad

`supabase/migrations/20261124202626_reference_filters_and_complete_options.sql`,
creada con CLI existente 3.1.0 y comando local `migration new`.

Agrega `aggregate_report_ref`, `account_directory_ref`, `account_detail_ref` y
`quarterly_roa_report_ref` (públicas invoker y privadas con el ejecutor existente).
El primer parámetro RPC es `reference_filters` JSON: snapshot, client, advisor, team;
`{}` significa sin selección REF. Los wrappers anteriores se conservan para otros
clientes; el runtime nuevo usa exclusivamente las RPC nuevas, sin fallback silencioso.

Se generan copias verificadas de las funciones anteriores para conservar fórmulas,
guards y contratos. La migración falla ante estructuras inesperadas y se aplica
atómicamente. Helpers de selección/opciones son invoker, ejecutables solo por el
ejecutor; verifican perfil/sesión actuales. Se conserva RLS y search_path vacío;
anon/service_role no ganan ejecución. No se crean tablas de hechos ni aliases.

Antes de desplegar el runtime nuevo hay que revisar/aplicar esta migración en GMA
con autorización expresa. Sin ella se obtiene un error de consulta; no se simula
una integración funcional. No hubo aplicación remota ni cambio de políticas reales.

Fuentes oficiales revisadas: [changelog](https://supabase.com/changelog.md),
[funciones](https://supabase.com/docs/guides/database/functions),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
No se actualizaron las dependencias ni el lockfile del proyecto.

## Verificación

El entorno local ahora dispone de Node 24.22.3 y PostgreSQL 17.12 instalados con
Homebrew para verificar esta fase. No se inició un servicio persistente; los arneses
usan clústeres sintéticos temporales por socket privado y los eliminan al terminar.
Node local puede cargar SWC, resolviendo el bloqueo de firma del Node integrado en
la app observado antes. Build y typecheck completos vuelven a ser verificables.

Casos nuevos SQL: referencia compartida entre custodios, AND, Sin referencia,
solo-Revenue, negativos/cero/null, detalle AUM, ROA con igual población, foto obsoleta,
grupo no representativo, metadata faltante y lector/admin/anon. Capacidad: 800
opciones aunque la página tenga una fila. Se conservan las regresiones existentes.

Pruebas de contrato/enlaces y recorrido HTTP/navegador están en
tests/reference-filters.test.ts y scripts/test-reference-filters-http.mjs. Los
transportes Auth/PostgREST/Storage del arnés son sintéticos; PostgreSQL y Next son
reales locales. No certifican una sesión remota ni conciliación económica de fuentes.

El próximo paso de la secuencia es Fase 6, validación de ROA/métricas financieras.
Las correspondencias ambiguas y la reparación productiva siguen pendientes de
evidencia, impacto revisado y aprobación específica.
