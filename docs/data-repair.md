# Fase 4 — preparación de reparación relacional

2026-11-24. Herramientas locales y ensayo sintético terminados. No se ejecutó una
reparación productiva ni se generó un manifiesto individual real autorizado.
Los dos pares detectados en la auditoría siguen pendientes de evidencia/aprobación.

## Herramientas y resultados

`src/lib/data/repair.ts` prepara una proyección reproducible de reparación a partir
de un snapshot completo de los alcances revisados, el catálogo de Fase 3 y revisiones
explícitas por hecho. `scripts/plan-data-repair.ts` ofrece solo `--dry-run`.
No tiene credenciales, SQL remoto ni modo apply; todos los manifiestos incluyen
`executable: false`, incluso cuando el estado es `reviewable`.

| Control / ensayo | Resultado |
| --- | --- |
| Sintético: revisión explícita de un Revenue | 1 cambio de cuenta; 4 filas conservadas |
| Sintético: total del alcance antes/después | 0,15 / 0,15 USD; 3 importes conocidos y 1 ausente |
| Sintético: dos filas Revenue idénticas | Ambas conservadas, sin deduplicación |
| Sintético: negativos/ausentes | Conservados como -0,05 / NULL, sin imputar cero |
| Sintético: colisión AUM proyectada | Bloqueada; no suma ni elimina snapshots |
| Sintético: otro custodio | Sin reemplazo ni cambio de revisión/filas |
| Sintético: restauración local de la imagen previa | Relaciones y originales idénticos a la entrada |
| GMA real, lectura de control | 18.800 AUM / 17.893 Revenue; 433 + 225 alcances sin discrepancias de suma/recuento/cobertura |
| GMA real, identidades candidatas | 2 grupos / 4 UUID; 55 AUM / 64 Revenue; sin resolver |
| GMA real, claves AUM duplicadas | 0 |

La tabla separa el ensayo de la lectura real. Los importes de ejemplo son sintéticos.
No hay comparación «después de reparar producción»: no se ejecutó esa reparación.

## Contrato de entrada y salida

Entrada JSON `RepairInput` (tipos en repair.ts; fixture en tests/fixtures/repair.ts):

- `snapshot.context`: catálogo confiable y revisado del motor de Fase 3.
- `snapshot.scopes`: fuente, período, custodio, ID de alcance y lote activo, versión,
  filas, cantidad de importes y suma revisada. Debe incluir cada alcance completo;
  un archivo vacío no significa borrar/reemplazar.
- `snapshot.facts`: ID exacto de hecho y alcance, cuenta anterior, importe decimal
  textual/null, celdas originales y registro/procedencia de Fase 3. La importación
  del registro debe coincidir con el lote activo del alcance.
- `reviews`: hecho, cuenta anterior esperada, cuenta destino, revisor y evidencia.
  Una revisión explícita puede proyectar una reasignación que Fase 3 deja como
  conflicto; no convierte esa reasignación en aprobada para producción.

Se verifica procedencia, pertenencia al alcance, custodio de origen/destino, cuenta
anterior, coordenadas únicas y controles publicados. Revisiones repetidas, huérfanas,
obsoletas o sin evidencia abortan la generación. Se usan UUID canónicos en minúsculas
en este contrato; el adaptador debe conservar los identificadores externos literales.

Los importes se validan sin adivinar separadores; las sumas usan BigInt/decimal
existente, sin punto flotante financiero. Para cada fuente/período/custodio se muestra
antes/después: filas, valores conocidos, suma exacta y cuentas distintas. La cantidad
de cuentas puede cambiar; montos, filas, ausencias y originales deben conservarse.
AUM se controla por mes, nunca se presenta una suma de meses como AUM de rango.

Los cambios se limitan a `accountId` y su relación proyectada en el registro; no hay
patch de importes ni de celdas. Solo aparecen reemplazos para alcances afectados,
cada uno con **todas** sus filas y el puntero/versión activa esperados. El original,
la multiplicidad y la procedencia se conservan. El algoritmo no fusiona entidades
ni elimina aliases o cuentas históricas.

Salida privada:

- `manifest.json`: huella, contexto/revisión, estado, cambios por ID y evidencia,
  bloqueos, controles antes/después y payload completo de los reemplazos previstos.
- `backup.json`: imagen de entrada completa, independiente de las proyecciones.
- `rollback.json`: imagen previa de alcances afectados y huella de hechos proyectados;
  es un plan de restauración local, no una orden SQL de rollback.

`blocked` impide tratar el lote como reparable; `no_changes` no autoriza una
publicación vacía; `reviewable` significa que la proyección superó sus controles,
no que haya aprobación del dueño ni que el adaptador de publicación esté implementado.
Una ejecución CLI exitosa puede contener bloqueos: hay que leer `status`.

## Ejecución local privada

Usar una exportación privada consistente del servidor autorizado, nunca un catálogo
aportado por el navegador como fuente de verdad. La herramienta no exporta datos de
Supabase ni verifica por sí sola la integridad externa del snapshot. La extracción
real deberá realizarse en una única transacción de lectura y guardar controles de
todos los alcances revisados. Hash de contenido no equivale a firma/autorización.

```sh
node scripts/plan-data-repair.ts --dry-run /ruta/privada/entrada.json /ruta/privada/plan-nuevo
```

Directorio padre existente fuera del repositorio; salida nueva con modo 0700 y
archivos 0600. No sobrescribe revisiones previas y rechaza `--apply`. Console muestra
solo estado y cantidades; no UUID, nombres ni importes. Un fallo puede dejar artefactos
locales parciales: conservarlos para inspección y volver a generar en otro directorio.
Los JSON contienen datos privados y no deben copiarse a Git ni compartirse como logs.

Ejemplo **exclusivamente sintético** generado realmente al cerrar esta etapa:
`/var/folders/gh/wg38xssj69gdgn08zxbfr8vh0000gn/T/gma-phase4-review-SINTETICO-HeezGt/plan/`.
El CLI imprimió `reviewable`, 1 cambio y 0 bloqueos. No es una reparación real.

## Migraciones y aplicación futura

No se creó una migración especulativa: no hay una equivalencia real aprobada que
justifique modificar identidad, y las reglas vigentes ya hacen inmutables los hechos
publicados. La nueva herramienta no exige tablas nuevas para funcionar localmente.

El circuito existente permite reimportar un original, revisar un alcance y publicar
una versión nueva con comparación del puntero activo; restaurar exige otra versión,
sin reactivar historia superseded. **Pero resolve bloquea un alias ya acreditado a
otra cuenta.** Por eso los reemplazos proyectados no pueden enviarse ciegamente a
esa RPC. La migración/adaptador para una eventual corrección de identidad debe
diseñarse después de aprobar la correspondencia y su alcance, preservando aliases
históricos, referencias REF/Master/tasas/asignaciones y auditoría. No se desactivan
triggers ni se hace UPDATE de hechos publicados para sortear ese bloqueo.

Antes de cualquier escritura productiva se requiere:

1. Evidencia individual y revisión de correspondencias ambiguas. Presentar el
   manifiesto exacto y su hash al dueño; aprobación explícita sobre ese impacto.
2. Backup real recuperable y ensayo de restauración en base aislada. El backup JSON
   local no sustituye un backup PostgreSQL/Storage verificado; no se activan planes pagos.
3. Adaptador servidor autenticado/admin y migración mínima, si hace falta. El autor
   de revisión del JSON no acredita una sesión ni permiso. Verificar snapshots y
   relaciones vigentes bajo locks del circuito y abortar si cambiaron.
4. Validar dependencias y colisiones AUM globales del conjunto afectado. Los datos
   proporcionados al planner deben ser completos; sus controles locales no prueban
   que el servidor no haya omitido un alcance o modificado datos concurrentemente.
5. Publicar todos los alcances aprobados atómicamente, con clave idempotente ligada
   al manifiesto; registrar actor, motivo, IDs originales/nuevos y revisión. Cualquier
   bloqueo revierte la transacción, sin publicación parcial ni cambios a otros custodios.
6. Repetir sumas/recuentos/ausencias por fuente/mes/custodio y controles de originales.
   Separar errores de importes y pedir aprobación financiera adicional antes de corregirlos.

## Rollback y límites de la verificación

El ensayo local reconstruye la imagen previa desde rollback.json y compara relaciones,
montos y originales; no se borra historia. La huella de proyección describe IDs de la
foto local: una publicación real creará IDs de lote/hechos nuevos, y el adaptador deberá
registrar esa correspondencia y validar las coordenadas, controles y versión publicada.
No comparar directamente una foto SQL con nuevos IDs contra la huella local pretendiendo
que deba ser idéntica.

El rollback productivo deberá crear y revisar otra versión del alcance desde los
originales/relaciones preservados y exigir como precondición el lote reparado vigente.
Si hubo cambios posteriores, abortar y revisar de nuevo; nunca sobrescribirlos. Una
fusión de aliases requiere una reversión también versionada de esas equivalencias.
No se implementó aún ese adaptador ni se probó un rollback PostgreSQL real.

Pruebas: 76 unitarias, lint y tsc aislado correctos. Sin SQL de escritura, migración,
deploy ni QA de permisos/HTTP nuevos. Build/typegen mantienen el bloqueo SWC previo.
Ver [validación](data-quality-validation.md). El próximo trabajo de producto es Fase 5,
filtros/dashboards; la reparación real sigue pendiente de evidencia y aprobación.
