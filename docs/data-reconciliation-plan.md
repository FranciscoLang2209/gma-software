# Plan de reconciliación — basado en Fase 1

Actualización posterior 2026-11-24: las dos migraciones REF/panel ya se aplicaron
en GMA por pedido expreso del dueño; entrega de Fases 1–8 a main autorizada.
No se autorizaron reparaciones de identidad. Ver [progreso](progress.md).

2026-11-24. Estado: Fases 2 y 3 locales y herramientas de preparación de Fase 4
implementadas; sin reparaciones ejecutadas. Diagnóstico y cantidades
en [data-quality-audit.md](data-quality-audit.md). La primera entrega terminó con
la auditoría; la continuación completa normalización y diseño de filtros en
[data-normalization.md](data-normalization.md). Motor local de propuestas en
[data-reconciliation-engine.md](data-reconciliation-engine.md). Preparación de Fase 4
en [data-repair.md](data-repair.md); adaptador/migración de reparación real pendientes
de correspondencias acreditadas. Fase 5 implementada localmente; ver
[data-quality-filters.md](data-quality-filters.md). Fase 6 verificada con oráculo
local y diagnóstico remoto de solo lectura; ver
[data-financial-metrics-validation.md](data-financial-metrics-validation.md).
No cambia reglas financieras: conserva ausencias y grupos incompletos, sin
certificación económica. Fase 7 local implementada y verificada: controles comunes
de importación, avisos y versión congelada; ver [data-import-quality.md](data-import-quality.md).
Fase 8 implementada y verificada localmente: [panel administrativo](data-quality-panel.md),
cola e historial paginados y equivalencias exactas por lote con vista previa.
No modifica hechos publicados ni ejecuta las reparaciones pendientes. Fases 9–10
no iniciadas; migraciones REF y panel pendientes de aplicación remota.
Ninguna modificación de producción queda autorizada por este documento.

## Orden de trabajo propuesto

| Paso | Cambio concreto | Evidencia / condición de aceptación |
| --- | --- | --- |
| 1 | Separar filtros de referencias REF de dimensiones canónicas/fechadas | Una etiqueta permite explorar cuentas con REF sin crear clientes ni asignaciones históricas; explicar la base utilizada y conservar Sin referencia |
| 2 | Búsqueda/paginación de opciones y correspondencias en servidor | Recuperar las 629 cuentas observadas del rango y lotes Revenue fuera de los últimos 50, conservando selección por ID, permisos y revisión |
| 3 | Diagnóstico explícito del vacío y cobertura | Distinguir período sin publicación, filtros sin coincidencia, dimensión pendiente, cálculo incompleto y error; sin exponer staging a lectores |
| 4 | Catálogo revisado de equivalencias y sugerencias | Revisar 2 pares/4 UUID, 34 filas REF y 20 filas Master; mostrar originales solo al admin y registrar regla/evidencia/actor |
| 5 | Normalización compartida y prevención | Reutilizar reglas actuales de headers/códigos; detectar espacios/invisibles en cuentas como advertencia/conflicto y no alterar el literal |
| 6 | Reparación relacional revisada, si corresponde | Dry-run por registros y alcances, aprobación específica, conservación decimal por fuente/mes/custodio, historia recuperable |
| 7 | Panel administrativo Calidad de datos | Consolidar cola, filtros por fuente/período/custodio/problema, historial y aprobación de equivalencias; reutilizar circuitos existentes |
| 8 | QA integral | Matriz de filtros/roles, ROA, importaciones/reintentos y rollback; pruebas locales + recorrido remoto autenticado diferenciados |

No se propone reimportar todo ni rehacer el modelo: ya existen UUID, aliases por
namespace/custodio, staging, auditoría y publicación versionada. La funcionalidad
de revisión financiera debe seguir usando esas garantías.

## Identidad y normalización

Mantener UUID como clave interna. La clave de resolución externa sigue siendo
fuente + namespace + custodio + identificador acreditado; número/custodio por sí
solo no sustituye la distinción entre los namespaces AUM y Revenue.

Separar las reglas por dominio en un helper compartido: headers y códigos de
custodio admiten las transformaciones actuales; cuentas conservan texto literal,
ceros y separadores. Nombres de cliente/comercial/equipo y servicios pueden tener
una clave de búsqueda normalizada, siempre separada del original y de la identidad.
Fecha/período exige contrato numérico no ambiguo. Tipos de comisión y tasas mantienen
unidades y bases revisadas. No agregar aliases semánticos de servicios o personas
sin aprobación/evidencia. No rellenar ceros ni corregir precisión retrospectivamente.

Clasificación propuesta del resultado de reconciliación:

- `matched`: misma clave literal confiable y única, dentro del custodio/namespace.
- `auto-resolved`: única equivalencia previamente aprobada o regla determinística
  respaldada por contrato; registrar la regla concreta. No aplica aún a los dos pares.
- `needs review`: sugerencia por espacios, caracteres o similitud; sin modificar FK.
- `unmatched`: no existe destino acreditado; conservar en cola y totales pertinentes.
- `conflict`: más de un destino o evidencia contradictoria; bloquea la reparación.

Buscar coincidencias aproximadas solo para sugerencias administrativas. Nombres
no bastan para resolver cuenta, cliente, comercial o vigencia. Una equivalencia
aprobada debe registrar original/destino/regla/evidencia, autor, revisión anterior y
alcance; su revocación no puede destruir el historial. Evaluar extensión mínima de
`account_identifiers` y auditoría existentes antes de crear nuevas tablas.

## Revisiones de negocio necesarias

1. **Referencias vs atribución:** elegir si se desea filtrar la foto REF o una
   asignación histórica. Para esta última hacen falta persona/cuenta y fechas
   acreditadas; Owner/OLD Owner/Grupo no inventan historia.
2. **Servicio:** revisar las 663 cuentas sin clasificar. No asumir Brokerage por
   descarte ni extrapolar el Fee type de una cuenta a otra.
3. **Dos pares con espacios:** cotejar por custodio, namespace y fuentes privadas.
   La ausencia de solapamiento de meses no acredita que sean la misma cuenta.
4. **ROA:** confirmar cobertura esperada y si un cuenta-mes sin Revenue representa
   actividad cero acreditada o dato no recibido. Mantener N/D mientras no se resuelva.
5. **Master/REF:** revisar 8 Advisory sin identidad, 12 Advisory sin tasa y restantes
   pendientes, sin convertir texto condicional a tasa ni publicar importes inferidos.

Estas decisiones no impiden avanzar localmente en selectores, diagnóstico del vacío
y vistas administrativas con fixtures sintéticos explícitos cuando se solicite
continuar. No se cambian fórmula de ROA, umbrales ni ponderación ya documentados.

## Contrato del futuro dry-run y aprobación

El script SQL diagnóstico es solo lectura; **no es un dry-run de reparación**.
Fase 4 agrega plan-data-repair.ts y un manifiesto sintético de ensayo. No se ha
generado un manifiesto individual real aprobado porque aún no hay equivalencias
revisadas para los pares ambiguos. Los cambios proyectados no se pueden ejecutar
sin el adaptador versionado y la aprobación del dueño.

Antes de proponer una escritura remota, preparar en entorno privado un manifiesto
con ID exacto de registro, versión previa, destino, fuente/mes/custodio, regla,
evidencia, motivo y estado esperado. Incluir número de filas modificadas, conflictos,
dependencias y referencias previas/nuevas. No guardar identificadores reales en Git.

Comparar antes/después por fuente, mes y custodio: suma `numeric`, número de filas,
cuentas distintas, importes ausentes y coordenadas originales; conservar multiplicidad
de Revenue. Si dos UUID generan una colisión AUM del mismo mes, bloquear: no sumar
snapshots ni borrar filas. Una reparación puramente relacional conserva importes;
un error financiero se separa y exige aprobación adicional del dueño.

Los publicados son inmutables. Usar correcciones/restauraciones versionadas y
publicación revisada por alcance existente; no desactivar triggers ni sobrescribir
hechos. La unión entre UUID requiere diseñar cómo preservar identidad histórica y
publicaciones anteriores antes de implementarla. Idempotencia por manifiesto/revisión;
si el estado remoto cambió desde el dry-run, abortar y pedir nueva revisión.

## Backup y rollback propuestos

Antes de una reparación aprobada: verificar recuperación/backup del proyecto y
conservar exportación privada del alcance y sus relaciones, revisiones, punteros y
auditoría. Esta fase no creó ni verificó un backup restaurable; no hay permiso para
activar un plan pago. Probar la restauración en una base aislada antes de producción.

Ejecutar cada operación aprobada atómicamente con locks/revisión del circuito
existente. Un error bloqueante revierte la transacción completa; no publicar un
subconjunto. Rollback operativo mediante una versión de restauración acreditada,
sin borrar la reparación ni la auditoría. Verificar de nuevo sumas/cobertura y
aislamiento de otros custodios. No automatizar limpieza de historia o originales.

## Próximo prompt

«Continuá con Fase 9: diferenciá los estados vacíos según período sin registros,
filtros sin coincidencias, relaciones pendientes, cobertura incompleta, cálculo
insuficiente y error de consulta, reutilizando diagnósticos existentes sin ocultar
fallos ni imputar cero; sin modificar producción ni desplegar».
