# App Papá — Producto

> Actualización vigente de comisiones (2026-11-17): ver [commissions.md](commissions.md).
> El nuevo pedido autoriza motor trimestral Balance × tasa anual /4 y conciliación
> local revisada. Supera para este motor las restricciones de sólo planificación
> y la fórmula ACT/365 anteriores; el helper aislado previo se conserva sin integrar.

Estado: definición funcional vigente; circuito local sintético hasta etapa 9 y entorno de prueba remoto de etapa 10 con Supabase/Preview verificados parcialmente. Sin datos de negocio; SMTP/invitación y puesta en uso pendientes. Ver `operations.md`. Actualizado: 2026-11-15.

## Objetivo y usuarios

Analizar internamente el negocio de inversiones del dueño y su socio, con acceso para unas pocas personas. Explicar AUM, Revenue y distribución comercial a partir de tres fuentes Excel, con cifras conciliables y trazabilidad hasta su origen.

MVP propuesto: administrador y lector con lectura global de datos publicados; administrador con importación, edición, publicación y correcciones. Acceso por invitación, sin registro público. Lectura global no incluye para lectores las filas en preparación, los archivos fuente ni los payloads originales.

## Alcance del MVP

- **Resumen:** AUM al cierre, Revenue del rango, variaciones comparables, cuentas/clientes con datos y evolución mensual separada por fuente.
- **Análisis comercial:** desgloses y rankings por custodio, equipo, comercial y cliente; mantener visibles los datos sin asignación.
- **Cuentas:** búsqueda, filtros, paginación y detalle con identificadores, series mensuales, Revenue y procedencia; respetar permisos sobre originales.
- **Importaciones y correspondencias:** preparación, vista previa, validación, resolución explícita de cuentas, conciliación, publicación y corrección versionada.
- **Configuración:** administración mínima de custodios, clientes, equipos, comerciales, membresías, asignaciones y servicios.
- **Exportación simple:** resumen filtrado y tabla comercial con las mismas definiciones, filtros y permisos que la consulta.

Filtros previstos: período/rango, custodio, equipo, comercial, cliente, cuenta y servicio. Interfaz en español, USD explícito, diseño sobrio, accesible y adaptable; uso principal en escritorio. Carga, vacío, faltantes y error deben ser estados distintos.

No incluye liquidación de advisory —incluida una estimación automática del 0,5%—, pagos, cobros, bancos, integración directa con Addepar/custodios, conversiones de moneda, precios externos, rendimiento de cartera ni beneficio neto. Tampoco ratio Revenue/AUM hasta acordar bases y periodicidad.

## Contratos de entrada

Headers transcritos de la guía suministrada; esto confirma el esquema documental, no los tipos ni el formato de los archivos reales. Se conservarán todos los valores originales, archivo, hoja y número de fila. Los tipos, separadores, fórmulas y demás particularidades requieren muestras antes de validar el importador.

### AUM — 6 columnas

1. `Top Level Holding Account`
2. `Holding Account Number`
3. `Account Number bd_REV`
4. `Value (USD)`
5. `mes`
6. `año`

Foto mensual de activos en USD por cuenta. No interpretar `Top Level Holding Account` como jerarquía ni agregar subtotales sin confirmar su significado. Los dos números de cuenta son referencias para equivalencias explícitas; su relación y namespace no se presuponen.

### Revenue — 29 columnas

1. `CUSTODIO`
2. `MES`
3. `AÑO`
4. `ACCOUNT`
5. `NAME`
6. `Advisor Name`
7. `ADV NAME SEC`
8. `Rel. 2nd`
9. `Nacho GMA`
10. `IP`
11. `IP PAYMENT`
12. `PAGO OK`
13. `B/S`
14. `ASSET`
15. `QUANTITY`
16. `DESCRIPTION`
17. `CUSIP`
18. `PRICE`
19. `TICKET`
20. `TICKET (O)`
21. `SERVICE CHARGE`
22. `GROSS`
23. `TOTAL`
24. `Payout broker`
25. `Payout Medina base`
26. `Final payout Medina %`
27. `Payout Medina`
28. `% Payout REP`
29. `NET Payout REP`

Varias filas por cuenta y mes, incluidas filas idénticas, pueden ser legítimas. Métrica principal: suma de `Payout broker`, siempre USD. No sustituirla por `GROSS`, `TOTAL`, `NET Payout REP` u otro campo. No asumir unidad, tipo ni significado del resto por su nombre: preservar originales hasta validarlos. `PAGO OK` no significa cobranza confirmada sin definición del negocio.

### FA — 7 columnas

1. `ACC # Addepar`
2. `ACCOUNT`
3. `Owner Name payout`
4. `Grupo`
5. `OLD Owner Name payout`
6. `Client`
7. `Broker`

Relaciona referencias de cuenta, cliente y referencias comerciales. `Grupo` es un equipo que agrupa comerciales. Falta confirmar si `Broker`, `Owner Name payout` u otra referencia identifica exactamente al comercial. No inferir custodio, equivalencia o vigencia a partir de nombres. `OLD Owner Name payout` se conserva, pero no constituye por sí solo una asignación histórica fechada.

## Identidad, métricas y cobertura

- Cuenta con UUID interno; identificadores externos como texto conservando ceros y valores originales. Equivalencias explícitas por fuente y namespace/custodio. No unir por nombre de cliente ni asumir que números de distintos custodios identifican la misma cuenta.
- AUM vigente: una fila consolidada publicada por cuenta y mes. Duplicado = conflicto, sin suma automática.
- Revenue vigente: múltiples filas por cuenta/mes; admitir ajustes negativos y no deduplicar por contenido.
- Antes de relacionar fuentes, agregar cada una por cuenta y período. Conservar cuentas solo-AUM, solo-Revenue y sin asignación comercial en totales y desgloses.
- Para un rango, AUM corresponde exclusivamente al último mes seleccionado; Revenue es la suma del rango. Si falta el mes de cierre o alguna cuenta, mostrar cobertura incompleta; no arrastrar el último saldo conocido.
- Ausencia y cero son distintos. Montos y porcentajes requieren precisión decimal exacta y convenciones explícitas, conservando el original.
- Variación de AUM no es rendimiento y Revenue no es ganancia neta. Propuesta de comparación: mes calendario anterior comparable; porcentaje N/D si falta la base o es cero.
- Cliente, comercial y equipo son entidades distintas; asignaciones y membresías requieren vigencias sin solapamiento. La política MVP solicitada en etapa 5 atribuye según la asignación vigente al último día de cada mes; exige fechas explícitas y conserva como sin asignar los meses sin cobertura.

Ejemplo sintético de aceptación ejecutado en etapa 6: cuenta A con AUM 100 y Revenue 2, 3 y 5 en un mes debe dar AUM 100 y Revenue 10. Con un segundo mes de AUM 120 y Revenue 12, el rango de ambos meses debe dar AUM 120 y Revenue 22. Verificado en PostgreSQL temporal; no acredita conciliación con archivos reales.

## Importación y correcciones

Flujo previsto: fuente/hoja/período/alcance → preparación y validación → correspondencias → conciliación → publicación explícita. Preparados y fallidos no afectan cifras publicadas. Errores bloqueantes impiden publicación parcial en el MVP.

Publicación atómica e idempotente, incluso ante reintentos y concurrencia. Una corrección reemplaza únicamente la versión activa del alcance revisado, conserva la anterior recuperable y deja auditoría. No permitir alcances activos superpuestos que dupliquen Revenue; no considerar el hash de archivo una deduplicación suficiente. Custodios ausentes y archivos vacíos no autorizan reemplazos implícitos.

Archivos fuente privados, originales y procedencia preservados. Cambios financieros mediante importación versionada; no edición de importes desde el dashboard. Las decisiones todavía abiertas están en `decisions.md`.

## Criterios para considerar listo el MVP

- Un administrador puede importar las tres fuentes, entender conflictos, conciliar, publicar y corregir sin duplicar ni alterar otros alcances.
- Un período real concilia globalmente y por custodio con los Excel originales; cada cifra se explica hasta su procedencia.
- AUM no se multiplica por el detalle de Revenue; totales, desgloses, cuentas y exportación coinciden con iguales filtros.
- Faltantes y asignaciones desconocidas son visibles, sin ceros ni historia inventados.
- Invitaciones y permisos funcionan en servidor, base, consultas y archivos privados, con pruebas por rol.
- El circuito se verifica en el destino autorizado y el dueño tiene instrucciones de operación y recuperación.

Estos criterios son futuros; la etapa 0 solo establece documentación.


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

## AUM histórico local — 2026-11-17

Implementado sobre el importador existente: modo histórico XLSX/CSV con mes/año
por fila, una hoja/custodio declarado por archivo, vista previa mensual,
correspondencias explícitas y publicación conjunta atómica de todos sus períodos.
Original único y manifiesto inmutables, versiones previas conservadas, errores
sin enrutamiento bloqueantes y preparación reanudable. Límites y segmentación por
meses completos en [imports.md](imports.md). Ninguna omisión certifica cero y una
foto parcial no sustituye otra completa sin revisión/confirmación del alcance.
El cierre del último mes continúa siendo el AUM del rango. Implementación y
pruebas sintéticas locales; migración sin aplicar remotamente, sin muestras
financieras reales ni nueva funcionalidad de comisiones.


## Advisory: ampliación acotada — 2026-11-17

La solicitud posterior permite diseñar expectativas auditables y conciliación con
Revenue, sin liquidación/pagos. Regla confirmada: Assets Billed On × tasa anual ×
días reales/365; se descarta dividir por cuatro. Solo se implementa un helper bruto
exacto aislado, sin módulo visible ni publicación. Final/prorrateo siguen bloqueados
por las definiciones pendientes del plan; no reemplazar base de facturación por
AUM ni saldo Excel sin acreditación. No extender condiciones actuales al pasado.
