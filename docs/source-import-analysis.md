# Fuentes reales: diseño de carga histórica

> Actualización: flujo con varios custodios implementado y probado el 17/11/2026.
> Ver contrato vigente en imports.md y evidencia de habilitación en progress.md.
> El análisis siguiente conserva sus hallazgos; no se publicaron las muestras reales.

Análisis autorizado del 17/11/2026. Sólo lectura local de los cuatro Excel privados
entregados. No se implementó ni desplegó un importador nuevo, ni se cargaron datos.
El informe privado y evidencias por fila se entregaron fuera del repositorio.
Este documento conserva estructura y reglas, sin cuentas, nombres ni montos reales.

## Confirmaciones del dueño

- `Account Number bd_REV` de AUM corresponde a `ACCOUNT` de Revenue.
- `Broker` de REF identifica al custodio, no al comercial.
- El balance del Master Owners corresponde al **30/09/2026**. No acredita otros cortes.
- No está confirmada todavía la unidad universal de las tasas de ese archivo.

Estas confirmaciones superan la incertidumbre previa sobre Broker de REF y su
correspondencia. No acreditan vigencias históricas de comerciales o beneficiarios.
`Owner Name payout`, cliente, Grupo y comercial siguen siendo conceptos separados.

## Contratos observados

| Fuente | Encabezado | Estructura que debe admitir la carga |
|---|---:|---|
| AUM | Fila 4 | Seis columnas, varios meses/custodios, preámbulo conservado |
| REF | Fila 1 | Siete columnas, fórmulas guardadas en Grupo, columna sin header con contenido auxiliar |
| Revenue | Fila 3 | Las 29 columnas originales más columna auxiliar booleana `Es texto?`, anotación final sin cuenta/período |
| Master Owners | Fila 2 | Catorce columnas, encabezado de balance multilínea, fila final de SUBTOTAL |

Los originales de AUM y Revenue caben en 2 MiB comprimidos, pero ambos superan
5.000 filas; Revenue también supera 12 MiB expandidos. El AUM requeriría más de
120 particiones mes/custodio. No basta con eliminar el selector de custodio.
Revisar además tamaño del manifiesto/RPC, memoria, persistencia por bloques y
transacciones. Conservar defensas ZIP/XML, permisos y validación del servidor.

## Flujo propuesto

1. **Referencias**: subir REF completo, proponer catálogo Broker y pares de cuentas,
   resolver tipos/ambigüedades y aprobar evidencia. Esta operación de identidad no
   debe inventar vigencias comerciales ni exigir un único custodio para todo REF.
2. **AUM histórico**: subir archivo completo. Resolver `Holding Account Number`
   contra `ACC # Addepar` de REF aprobado y corroborar `Account Number bd_REV`
   contra `ACCOUNT`. Obtener custodio del Broker confirmado. La muestra es coherente
   para todas sus cuentas; no imponer esa unicidad como supuesto de archivos futuros.
3. **Revenue histórico**: leer CUSTODIO/MES/AÑO por fila, preservando toda la
   multiplicidad. Admitir cuentas sólo-Revenue con identidad propia por custodio;
   no exigir que existan en REF o AUM para conservarlas.
4. **Master Owners**: snapshot separado al corte confirmado. Conflictos con REF
   deben revisarse y no reemplazarlo silenciosamente. No sustituir AUM ni extender
   condiciones actuales a meses anteriores.

Por cada fuente financiera: original privado único, particiones por fuente/mes/
custodio, revisión de cada alcance, publicación conjunta atómica e idempotente del
archivo. No publicar hijos aislados, ni interpretar custodios/meses ausentes como
borrado o cero. Referencias aprobadas reutilizables; sin joins financieros de detalle.

Detectar encabezado por contrato y mostrarlo para revisión. Toda fila se clasifica
como dato, preámbulo, subtotal, anotación o excepción con coordenada/motivo. Conservar
columnas auxiliares y originales; no desechar notas o errores automáticamente.

## Reglas y excepciones observadas

- Los custodios de Revenue no cubren todo el catálogo de Broker de REF. Proponer
  alta de etiquetas adicionales sin inferir equivalencias entre códigos.
- Una etiqueta del filtro de Revenue procede sólo de una anotación sin cuenta,
  período ni montos: no acredita un custodio real. No borrar lo ya registrado sin
  revisión expresa del dueño.
- AUM tiene pares de referencias consistentes, sin duplicados por cuenta/mes.
  Revenue tiene repeticiones exactas permitidas y cuentas fuera de REF.
- Hay importes Revenue ausentes, errores Excel en campos auxiliares, identificadores
  numéricos y fórmulas externas con resultados guardados. Conservar faltantes, ceros,
  negativos y errores. Errores bloqueantes impiden publicación parcial.
- Identificadores numéricos requieren evidencia revisada antes de una equivalencia
  textual; nunca completar ceros o eliminar diferencias para forzar una coincidencia.
- Se observaron fórmulas de bruto anual `Balance * (tasa / 10000)` en Master, por
  lo que no se puede asumir que el número original ya sea una tasa proporcional.
  Revisar unidad/aplicabilidad y conservar conversión explícita. No ejecutar fórmulas.
- Las tasas textuales no numéricas deben conservarse como condiciones pendientes,
  nunca convertirse a cero. No sustituir importes ausentes con otras métricas.

## Validación de esta etapa y siguiente implementación

Lectura XML/ZIP con texto numérico original y Decimal; recuentos y cruces principales
corroborados con openpyxl read_only/data_only/keep_links=False, sin guardar libros.
Assertions de conservación de filas/totales exactos al particionar AUM y unicidad
de pares. Prueba de lectura con el importador vigente confirmó rechazos de tamaño/
filas y bloqueos de REF. No acredita importación ni conciliación financiera real.

Próximo alcance sugerido: implementar localmente carga de referencias y carga
histórica AUM/Revenue con varios custodios, preservando la publicación versionada.
Crear fixtures exclusivamente sintéticos que reproduzcan desplazamiento de headers,
auxiliares/subtotales, más de 120 particiones, tipos mixtos, ceros iniciales,
excepciones, sólo-AUM/sólo-Revenue, duplicados y reintentos. Medir capacidad y probar
rollback/concurrencia/roles antes de habilitar o importar estas fuentes reales.
