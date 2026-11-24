# Calidad de datos — Fase 7: prevención en importaciones

2026-11-24. Implementación local sobre los circuitos existentes. Sin migración
nueva, reimportación real, cambios remotos o despliegue. La migración REF de Fase 5
sigue pendiente antes de desplegar el conjunto. No se reparan identidades ambiguas.

## Circuito y controles

Se conserva original privado → lectura en servidor → staging por bloques → vista
previa → correspondencias acreditadas → conciliación → publicación explícita.
Tablas, cursores, auditoría, versiones y publicación atómica ya existen; no se
agrega otro staging ni otro publicador. Contratos en [product.md](product.md) y
circuito completo en [imports.md](imports.md).

| Control | Comportamiento existente y refuerzo de esta fase |
| --- | --- |
| Columnas | 6 AUM / 29 Revenue / 7 FA. REF y Master ahora comparten el control de headers literales y colisiones. Master conserva sus 14 columnas exactas. |
| Identificadores | Helper común mensual/histórico, REF y Master. Literal y ceros conservados; rechaza ciencia textual incluso con espacios, tipos fecha/booleano y fórmulas. |
| Formato sospechoso | Espacios en extremos e invisibles/de control generan advertencia por columna. Se amplía diagnóstico Unicode, sin limpiar cuentas ni crear aliases. |
| Períodos | Mes 1–12, año 1900–2200. Booleanos/fechas Excel no se convierten en mes/año por su escalar. Historia conserva filas sin alcance válido y bloquea publicación conjunta. |
| Importes y tasas | Decimal exacto y convención explícita; cero/negativos válidos. Master ya no admite booleanos/fechas como Balance o tasa. Fee anual en puntos básicos: 50 → 0,005 proporcional. |
| Duplicados | AUM repetido por referencia/mes bloquea; colisión UUID se revisa antes de publicar. Revenue conserva toda su multiplicidad y suma, incluso idénticos. Huella de fila diagnóstica. |
| Reconciliación | Alias por fuente/namespace/custodio y revisión con evidencia existentes. AUM histórico exige par REF y custodio único. No se une por nombre ni por un solo número. |
| Vista previa | Resumen agrupado mensual y en historia aun sin excepciones solicitadas. REF muestra fila/columna y advertencias; Master muestra avisos de cuenta. Detalles y originales conservados. |
| Reintentos | Hash avisa archivo repetido, sin deduplicar movimientos. Solicitud/cursor/alcance/revisión previenen duplicar operaciones y preservan reemplazos versionados. |
| Trazabilidad | Archivo, hoja, fila, celdas, metadatos, usuario y auditoría existentes. Admin prepara/revisa; lector sin originales/staging. Servidor, RLS y Storage privado conservados. |

Los porcentajes/campos descriptivos Revenue cuyas unidades no están acordadas
siguen como originales; no se inventa interpretación financiera. Métrica principal:
SUM(Payout broker). No se ejecutan fórmulas, macros ni conexiones externas.

## REF e identidad

referencePairs usa prepareHeaders e identifierIssues, igual que la preparación
financiera. Broker debe ser código de custodio en texto literal. Una fila errónea
no produce un par; sus errores quedan en el manifiesto padre y bloquean toda
publicación, aunque existan otras filas válidas. Original REF privado e íntegro.

El consentimiento numérico existente ahora menciona expresamente archivo y REF
adjunto. Solo admite enteros nativos de hasta 15 dígitos tal como están escritos,
con motivo acreditado; nunca fórmulas, exponente, fracciones o precisión perdida.
Master conserva su confirmación numérica específica antes de publicar.
No se certifica que un número ya escrito sin ceros esté históricamente completo.

Espacios/invisibles advierten porque pueden tener significado. « 001 » y «001»
siguen siendo literales distintos. La revisión coteja fuente y equivalencias:
similitud no acredita identidad. Se hace visible el riesgo de los dos pares reales,
sin autorizar su fusión. Sin coincidencia única, la relación sigue pendiente.

## Bloqueantes y advertencias

Bloquean headers faltantes/ambiguos/calculados, cuentas inseguras sin consentimiento
válido, tipos/períodos inválidos, importes ambiguos/ausentes no acreditados,
duplicados AUM, conflictos, REF inválido y filas sin alcance. No se publican
parcialmente las filas válidas de un lote con errores.

Advierten formato sospechoso, repeticiones Revenue, cachés que requieren revisión
y excepciones explícitas previas. Con motivo registrado, Payout broker ausente puede
seguir N/D y errores descriptivos no críticos de Revenue pueden advertir.
No se amplían excepciones a AUM ausente, cuentas calculadas o importes inválidos.
Una advertencia no autoriza publicación ni corrección automática.

El resumen agrupa incidencias por severidad/código/columna y conserva hasta 25
filas de ejemplo; detalle íntegro en preparados paginados/original. No descarta
filas. Errores de encabezado incluyen fila y posición/columna.

## Versión y recuperación

validationVersion=1 identifica por primera vez estos controles, separado de los
parserVersion 1/2/3 del formato. Se guarda en configuración congelada mensual/de
hijos históricos y manifiesto histórico mediante el JSON existente, sin SQL nuevo.

Retomar bloques de otra versión se rechaza sin persistir filas nuevas. Una carga
histórica anterior sin marca tampoco se reanaliza con reglas nuevas al reintentar
registro/preparación. Se informa conservarla y crear otra con los originales:
no se parchea el manifiesto inmutable ni se mezclan validadores. Los conflictos
de versión reconocidos devuelven 409. Publicaciones y preparaciones terminadas
no se revalidan retroactivamente ni se borran.

Una preparación mensual sin iniciar puede usar reglas actuales; una histórica
ya tiene manifiesto fijado al cargar y necesita otro si es anterior. Preparaciones
nuevas conservan pausa/retoma y reintentos dentro de la misma versión. Sin migración
masiva ni limpieza automática de historia/archivos.

Para retirar el cambio local, revisar/revertir solo el diff de esta fase,
preservando trabajo anterior. No hay rollback de datos: no se escribió en GMA.
No continuar bloques nuevos con runtime antiguo; conservarlos y crear otra
preparación si cambia el validador. Aplicar/desplegar requiere autorización específica.

## Verificación y límites

Ocho unitarias nuevas en [import-quality.test.ts](../tests/import-quality.test.ts):
ceros/literales, invisibles/bidi/control, ciencia textual, tipos, consentimiento,
REF, headers, períodos, Master, resúmenes y versiones. Solo datos sintéticos.

[test-import-quality-http.mjs](../scripts/test-import-quality-http.mjs), integrado
en npm run test:dashboard: Next → PostgreSQL temporal real con Auth/PostgREST/
Storage sintéticos. Comprueba avisos/originales persistidos, Revenue repetido y
negativo con suma exacta 0,15, REF bloqueado, lector denegado, configuración anterior
rechazada y publicados intactos. Suites existentes comprueban publicación,
reintentos, concurrencia, reimportación, corrección y rollback.

Checks y navegador en [data-quality-validation.md](data-quality-validation.md).
Sin reimportación real ni sesión remota: no certifica formatos o conciliación de
Excel reales. Siguen pendientes identidades, servicios, tasas y cobertura económica.

Se consultaron [changelog de Supabase](https://supabase.com/changelog.md),
[Storage/RLS](https://supabase.com/docs/guides/storage/security/access-control)
y [lector XLSX](https://github.com/catamphetamine/read-excel-file#numbers).
Sin integración nueva ni actualización de paquetes/lockfile. Cambios recientes
de CLI/ramas no requieren operaciones remotas aquí.

Próximo paso: Fase 8, panel administrativo Calidad de datos, reutilizando permisos,
colas y revisión existentes.
