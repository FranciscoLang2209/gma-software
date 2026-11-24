# Calidad de datos — Fase 6: ROA y métricas financieras

2026-11-24. Validación local del motor existente y diagnóstico agregado de solo
lectura en GMA. No se cambian fórmulas, tasas, clasificación, hechos publicados ni
permisos. No hay migración nueva, escritura remota o despliegue en esta fase.
Las reparaciones ambiguas de Fase 4 y la aplicación de la migración REF de Fase 5
continúan pendientes. Evidencia de ejecución en
[data-quality-validation.md](data-quality-validation.md).

## Fórmula, población y unidades verificadas

Para cada mes del trimestre se agrega cada fuente por cuenta antes de relacionarla.
La población filtrada por UUID es común a numerador y denominador; REF usa selección
de cuentas, sin multiplicar hechos por sus etiquetas. Se conservan cuentas de una
sola fuente. Comercial/equipo usan vigencias al cierre mensual: una exclusión por
filtro no se convierte en un dato faltante. Cliente/servicio son clasificación actual.

```text
S = AUM total mes 1 + AUM total mes 2 + AUM total mes 3
AUM promedio trimestral = S / 3
R = SUM(Payout broker del trimestre)
ROA anualizado proporcional = (R × 4) / (S / 3)
ROA anualizado porcentual = 1200 × R / S
```

El AUM promedio es específico de ROA. El AUM de un rango en Resumen sigue siendo
el cierre del último mes elegido; no se suman fotos como activos del rango.
Revenue conserva movimientos repetidos legítimos, ceros explícitos y ajustes
negativos. Un cuenta-mes sin fila o con importe ausente sigue faltante.

Sumas y productos usan `numeric`; componentes financieros salen como texto/null.
La división decimal puede ser periódica: no se afirma precisión racional infinita.
Clasificación y comparación usan productos cruzados antes del redondeo de pantalla.
La documentación de [numeric de PostgreSQL 17](https://www.postgresql.org/docs/17/datatype-numeric.html)
respalda la elección; [SUM y AVG](https://www.postgresql.org/docs/17/functions-aggregate.html)
no sustituyen controles de cobertura, porque omiten nulos y SUM sin filas no es cero.

Brokerage conserva Bajo si ROA < 0,40%, OK entre 0,40% y 0,60% inclusive y Muy bien
si > 0,60%. Las etiquetas existentes no certifican rendimiento de cartera.
La clasificación provisional actual del ROA se mantiene; para Advisory se muestra
además el comparador específico, sin cambiar silenciosamente sus reglas.

## Comparación Advisory ya implementada

La ponderación ya estaba documentada e implementada en
[quarterly-roa.md](quarterly-roa.md); esta fase la valida, no introduce otra regla.
La tasa es anual y proporcional: 50 bps = 0,005 = 0,50% anual. No se vuelve a
anualizar una tasa que ya es anual.

```text
W = SUM(AUM de cuenta/mes × tasa anual vigente de esa cuenta/trimestre)
Fee anual ponderado (%) = 100 × W / S
Diferencia (puntos porcentuales) = (1200 × R − 100 × W) / S
```

Se usan los mismos cuenta-meses Advisory y su AUM mensual, no el promedio simple
de tasas ni balances de Master en lugar del AUM histórico. Exige fotos completas,
exposición no negativa, S positivo y tasa publicada no obsoleta para toda exposición
positiva. La diferencia exige también Revenue completo y trimestre cerrado.
Un conjunto mixto no compara su ROA global con el Fee de un subconjunto: la
comparación corresponde al desglose Advisory. Una tasa individual puede mostrarse
como referencia sin que el promedio ponderado o la diferencia sean calculables.

El motor separado de expectativa de Comisiones puede calcular balance × tasa / 4
con su base acreditada. Esa expectativa no reemplaza Payout broker, no es un cobro
confirmado y no aporta por sí sola cobertura al ROA.

## Oráculo sintético independiente

Nuevo [financial-metrics.test.sql](../tests/database/financial-metrics.test.sql),
integrado en `npm run test:db`. Consulta directamente cada fuente mensual por
separado y coteja meses, promedio, Revenue, componentes del ratio, ponderación y
diferencia con la RPC local `quarterly_roa_report_ref`. No reutiliza su CTE de
cuenta-meses. Datos exclusivamente sintéticos de T1 2024:

| Caso | AUM enero / febrero / marzo USD | Revenue trimestre USD | Resultado |
| --- | --- | ---: | --- |
| Cuenta A | 10.000.000 / 11.000.000 / 12.000.000 | 13.750 | Promedio 11.000.000; ROA 0,50%; Fee 0,50% |
| Cuenta B | 30.000.000 / 30.000.000 / 30.000.000 | 15.000 | ROA 0,20%; Fee 0,20% |
| A + B Advisory | 40.000.000 / 41.000.000 / 42.000.000 | 28.750 | ROA y Fee = 11,5 / 41 ≈ 0,2804878%; diferencia 0 pp |
| A + B + Brokerage de otro custodio | 42.000.000 / 43.000.000 / 44.000.000 | 28.750 | Ratio sobre el total; comparador Fee global no aplicable |

A incluye dos movimientos idénticos de USD 5.000 más USD 3.750: ambos se suman,
sin replicar sus fotos AUM. El agregado Advisory difiere del promedio simple de
ratios/tasas 0,35%. La lectura autenticada sintética devuelve el mismo resultado.
No se insertan referencias artificiales en GMA.

La suite previa complementaria comprueba filtros/vigencias y REF con igual
población, fuentes disjuntas, negativos, cero, ausencias, trimestre abierto, límites
0,40/0,60 precisos, tasas faltantes/obsoletas y roles. No se identificó un defecto
de cálculo que justificara cambiar el runtime en esta fase.

## Diagnóstico real de solo lectura

Ejecutado [audit-quarterly-metrics.sql](../scripts/audit-quarterly-metrics.sql)
contra la misma base GMA auditada: 18.800 fotos AUM, 17.893 movimientos Revenue y
2.624 referencias de tasa. Una consulta/snapshot produce 64 cohortes: 16 trimestres
2023–2026 × Advisory, Brokerage, sin_clasificar y otra_clasificacion. Incluye el mes
previo solo para detectar cuentas ausentes, sin sumarlo al trimestre. Selecciona
última versión de tasa por cuenta/trimestre y respeta invalidaciones.

El resultado exporta únicamente período/servicio, conteos, estados y booleanos.
Identidades, originales y montos reales permanecen en la base. Se confrontan sumas
de los totales mensuales de la matriz con sumas directas independientes por fuente.
Los controles AUM y Revenue son verdaderos en las **64/64 cohortes**. Son controles
de conservación, no una certificación económica ni prueba de sesión remota lector.

**30 cohortes tienen cobertura incompleta y 34 no tienen hechos del trimestre;
ninguna es calculable como grupo completo.** T3 2026 carece de septiembre y T4
carece de hechos; `no_data` precede a `open_quarter`. Último mes publicado: agosto.
No hay cohortes reales Brokerage ni otra_clasificacion con hechos.

| 2026 / servicio | Cuentas observadas | AUM completo | Revenue completo | Comparables con Fee |
| --- | ---: | ---: | ---: | ---: |
| T1 Advisory | 161 | 150 | 48 | 47 |
| T2 Advisory | 161 | 151 | 47 | 46 |
| T3 Advisory | 162 | 0 | 0 | 0 |
| T1 sin clasificar | 433 | 391 | 118 | No aplica |
| T2 sin clasificar | 451 | 379 | 113 | No aplica |
| T3 sin clasificar | 411 | 0 | 0 | No aplica |

Las cuentas comparables exigen ambos conjuntos mensuales completos, suma AUM
positiva, fotos no negativas y tasa para exposición positiva. En T1 Advisory,
33 quedan matemáticamente por debajo de su referencia, 0 iguales y 14 por encima;
en T2 son 33/0/13. Se compara `1200 × R` con `100 × W`, sin exportar ratios o montos.
No son pérdidas, deuda, comisiones impagas ni rendimiento: queda por acreditar
la comparabilidad económica de Payout broker y cada referencia.

Ninguna cohorte Advisory completa permite ponderar el Fee: `fee_weightable=false`
y el control de límites de tasa devuelve null en todas, **no un check aprobado**.
La ponderación está validada con los casos sintéticos; excluir cuentas faltantes
para obtener un número de grupo alteraría la población y no se hizo.

La función remota anterior `quarterly_roa_report` conserva la huella de cuerpo
`d02cfcc7826fa943fdbf89340f5c394a`, coincidente con la migración local aplicada del
20/11. La variante `_ref` de Fase 5 no existe allí: sus pruebas son locales. Este
diagnóstico independiente sobre fuentes no se presenta como ejecución remota de
esa nueva RPC ni como comparación de interfaz remota antes/después.

## Límites y siguiente etapa

No hay cambios financieros antes/después: se valida el motor y se conserva la base.
No se sustituyen faltantes por cero ni se clasifican cuentas por descarte. Falta
acreditar universo esperado, altas/bajas, ceros de actividad, servicio/vigencias y
correspondencia económica de Payout broker con cada Fee mediante fuentes privadas.
No se certifica una importación real ni una sesión remota por rol.

Reproducción: `npm run test:db` crea y elimina un clúster sintético; el SQL de
auditoría debe ejecutarse con acceso administrativo de solo lectura únicamente
contra el destino GMA verificado. Contiene horizonte 2023–2026 explícito: ampliarlo
al auditar otros períodos. No requiere rollback porque no escribe. Para retirar
la verificación local basta retirar su invocación del runner; no toca migraciones.

Próximo paso solicitado por separado: Fase 7, prevenir inconsistencias en las
importaciones con staging/revisión existentes, sin modificar producción.
