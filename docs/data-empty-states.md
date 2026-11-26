# Calidad de datos — estados vacíos (Fase 9)

Implementación local del 2026-11-25. Reutiliza consultas, permisos, métricas y
componentes de Fases 5–8. No se consultaron datos GMA, aplicaron migraciones,
publicaron archivos, repararon identidades o desplegaron cambios en esta fase.

## Causas y acciones

| Evidencia | Mensaje / comportamiento |
| --- | --- |
| Cero hechos publicados del período antes de filtros | No existen registros publicados para este período; elegir fechas o consultar fuentes con el administrador |
| Hay hechos del período, pero los meses filtrados no incluyen ninguno | Los registros del período no cumplen estos filtros; quitar entidades/REF conservando fechas y desglose |
| Cuentas publicadas sin cliente o servicio; asignaciones fechadas ausentes | Referencias pendientes explícitas y recuentos, conservando importes sin asignar. Los recuentos generales son contexto, no una equivalencia acreditada ni prueba de la causa de cada fila excluida |
| Hay hechos, pero falta cierre AUM, fuente, cuenta-mes o publicación observada | Cobertura incompleta; mostrar importes conocidos y revisar meses, sin arrastre ni ceros |
| Hay filas con importe ausente | Información insuficiente; suma conocida parcial y N/D para lo desconocido |
| ROA incompleto, trimestre abierto, base cero o negativa | Explicar el impedimento específico, sin cambiar cálculo o imputar información |
| Fee no calculable o no aplicable | Distinguir tasas faltantes, fotos/base insuficiente, ausencia de población Advisory y referencia obsoleta |
| Consulta fallida, timeout, selección inválida o revisión obsoleta | Estado de error/reintento separado; no afirmar ausencia ni mostrar cifras sintéticas |

Los controles pueden coexistir. En Resumen/Análisis, las filas sin importe tienen
prioridad como aviso principal sobre cobertura; el detalle de todos los faltantes
se mantiene visible. Un AUM anterior dentro del rango impide declarar el período
vacío aunque el cierre seleccionado y Revenue no tengan registros.

Los conteos reales de registros incluidos pueden ser cero. Los montos ausentes
siguen siendo null/N/D; un importe cero publicado conserva su significado.

## Pantallas

Resumen y Análisis muestran primero la causa, después los faltantes detallados.
Los gráficos distinguen registros sin importe y fuente sin registros incluidos;
no sugieren volver a importar por un filtro que no coincide. CSV conserva cifras
y agrega recuentos de disponibilidad antes de filtros con su alcance explícito.

Cuentas distingue una búsqueda sin coincidencias de una página fuera de rango;
el directorio incluye cuentas sin cifras, por lo que no se interpreta como un
inventario de hechos del período. Detalle mantiene contexto mensual y explica
Revenue excluido por filtros, inexistente en el rango o página sin filas. Un
resultado inesperadamente nulo del directorio es error, no un vacío financiero.

ROA conserva sus seis estados SQL y las cuatro consultas trimestrales independientes.
La falta de valores en gráficos no oculta errores de un trimestre. Fee muestra
motivo junto a N/D, manteniendo tasas individuales publicadas aunque no se puedan
ponderar. Comisiones usa su universo existente: expectativas y Revenue por revisar;
una tasa Master o un movimiento sin clasificar no acredita cobro o comisión calculada.

Calidad distingue un control sin problemas, un tipo de problema sin coincidencias,
historial sin coincidencias y una página fuera del resultado. No certifica calidad
económica a partir de cero problemas técnicos. Los lectores conservan acceso sólo
a publicados; el enlace a revisión administrativa se muestra exclusivamente al admin.

## Consulta, permisos y revisión

Migración local 20261125234324_report_availability_diagnostics.sql, creada con
Supabase CLI 3.1.0. Pendiente de aplicación; no modifica SQL de migraciones previas.
Antes de desplegar esta fase, revisar/aplicar su migración con autorización del dueño.

Helper privado invoker, EXECUTE sólo del ejecutor existente, guard de acceso y
search_path vacío. Cuenta filas AUM/Revenue vigentes del rango inclusivo y cuentas
observadas sin cliente/servicio, antes de todos los filtros de entidad y REF.
No incluye preparación, originales, saldos ni identificadores. RLS y lectura global
publicada existentes; mismo resultado para admin y lector. No agrega tablas,
roles, permisos Auth ni clientes privilegiados.

Se añade availability a aggregate_report_ref y quarterly_roa_report_ref dentro del
mismo snapshot SQL; directory/detail lo heredan de su reporte. La revisión incorpora
el diagnóstico: si cambia la clasificación general, una página antigua se rechaza.
Las firmas, guards, dueños y ACL se conservan. Los replacements fallan si cambia
la estructura esperada; no omiten silenciosamente la modificación.

Comisiones reutiliza commission_report sólo con año/trimestre y página de una fila
para obtener el recuento completo previo a los demás filtros. Mantiene su guard
administrativo y su propio significado de registros; el diagnóstico entra en su
revisión. No mezcla tasas ROA con expectativas ni modifica la fórmula.

Sin availability de una versión anterior, un vacío dice Disponibilidad del período
sin verificar y propone reintentar; no inventa un cero ni certifica ausencia.
Errores de consulta siguen siendo errores. No se usa fallback demo ni caché nueva.

## Verificación y pendientes

Evidencia y resultados efectivos en [data-quality-validation.md](data-quality-validation.md).
Casos puros en [availability.test.ts](../tests/availability.test.ts), SQL en
[availability.test.sql](../tests/database/availability.test.sql) y HTTP en
[test-availability-http.mjs](../scripts/test-availability-http.mjs).
Se conservan fixtures sintéticos explícitos; no se certifica sesión Supabase remota,
accesibilidad manual completa o conciliación económica real.

Documentación consultada: [funciones de base](https://supabase.com/docs/guides/database/functions)
y [changelog vigente](https://supabase.com/changelog.md). Sin actualización de SDK,
CLI, lockfile o stack; no se usan las operaciones remotas afectadas por cambios de CLI.

Próxima fase: 10, QA integral de los circuitos y sus permisos. La reparación real
de los pares ambiguos sigue necesitando evidencia, adaptador versionado y revisión.
