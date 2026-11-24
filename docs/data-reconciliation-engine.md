# Fase 3 — motor local de propuestas

2026-11-24. Implementado `reconcileAccounts` en
`src/lib/data/reconciliation.ts`. Función pura, sin conexión a Supabase, filesystem,
reloj, números aleatorios, cálculos financieros ni operaciones de escritura.
No se integra todavía al importador ni altera manifiestos/versiones del parser.

## Contrato

Recibe registros proyectados y un catálogo explícito/revisado. Cada registro lleva
ID de fila, referencias externas literales (fuente, namespace, custodio, original),
cuenta previamente relacionada o null, nombre opcional y procedencia: importación,
SHA-256 del archivo, nombre de archivo, hoja, fila y usuario importador.

El catálogo contiene revisión, autor de la propuesta, cuentas/custodios, identificadores
ya acreditados con evidencia y aliases con estado, autor de aprobación y evidencia.
El adaptador futuro debe obtenerlos del servidor autorizado: el motor local no
acredita que un JSON aportado por un cliente sea un catálogo confiable ni comprueba
permisos o vigencia de sesión. `actorId` identifica al proponente, no le otorga permisos.

Cada propuesta devuelve:

- versión de reglas `account_reconciliation_v1`, revisión del catálogo y proponente;
- copia independiente del registro original proyectado y procedencia;
- cuenta anterior, destino propuesto o null, estado, regla y motivo;
- candidatos ordenados por UUID y evidencias de identificadores/aliases usados,
  con referencia, destino, motivo y autor de aprobación cuando corresponde.

La copia no reemplaza el Excel privado ni las 29 columnas de Revenue conservadas
por el pipeline. No se pasan montos al motor: relacionar no permite modificarlos.

## Reglas y estados

| Estado | Regla | Comportamiento |
| --- | --- | --- |
| `matched` | `exact_scoped` | Todas las referencias tienen coincidencia literal acreditada, con el mismo UUID, por fuente/namespace/custodio |
| `auto-resolved` | `approved_alias` | Todas tienen respaldo y al menos una usa una equivalencia aprobada con evidencia y aprobador; solo propone el destino |
| `needs review` | `review_candidates` | Hay referencias sin respaldo, falta custodio o existen sugerencias por búsqueda; destino null |
| `unmatched` | `no_match` | Sin coincidencia acreditada ni sugerencias; destino null |
| `conflict` | `contradictory_identity` | Varios destinos acreditados, custodios contradictorios o relación previa incompatible/inexistente; destino null |

La normalización automática de cuentas de Fase 2 es identidad literal: no existe
contrato que habilite quitar espacios, ceros, signos o invisibles. Por eso una
coincidencia tras trim/minúsculas **solo sugiere** y no produce auto-resolved.
La representación textual de un UUID sí se compara sin diferencias de caso.

Las sugerencias de identificadores respetan fuente y namespace; con custodio conocido
no proponen cuentas de otro custodio. Si falta custodio pueden mostrar varios
candidatos, pero nunca resuelven. Los nombres solo sugieren por clave textual de
búsqueda dentro del custodio conocido, aunque haya un único candidato. No se usa
distancia difusa como evidencia financiera ni se crea una identidad por nombre.
Una diferencia con zero-width characters no se elimina automáticamente.

Exactos y aliases se contrastan juntos: una coincidencia exacta no oculta un alias
aprobado contradictorio ni viceversa. Pending/revoked no resuelven. Si una fila
contiene dos referencias, reconocer una no acredita la otra; se requiere consenso
de todas. El motor no crea automáticamente la equivalencia que falta.

Catálogos con destinos huérfanos, custodios incorrectos, IDs duplicados, referencias
inválidas o evidencia faltante se rechazan. También se rechaza procedencia inválida
o IDs de registro repetidos; no se entrega un resultado parcial del lote. Varias
filas Revenue idénticas en coordenadas/IDs distintos se mantienen como propuestas
independientes, sin deduplicarlas.

## Idempotencia, trazabilidad y reversibilidad

Mismas entradas y revisión producen las mismas propuestas. Ordenar de otra forma
las cuentas/identificadores del catálogo no altera el resultado. No se mutan entradas;
los índices exacto y de búsqueda se construyen una vez por llamada, sin estado global.

La trazabilidad en esta fase es el resultado estructurado. **No es aún un evento
persistido en audit_events ni una resolución publicada.** La revisión y versión de
reglas permiten que la siguiente fase compare el contexto de una propuesta con el
estado actual antes de aplicarla. La integridad de esa revisión depende del adaptador
que la genere; no se interpreta una cadena enviada por cliente como prueba de frescura.

Revertir una propuesta local equivale a descartarla: ninguna FK cambió y la relación
anterior queda en el resultado. No se implementó ni probó rollback de datos remotos;
la escritura futura debe preservar historia, usar transacciones y recuperación versionada.

## Integración posterior y límites

El motor es una biblioteca local con pruebas, no una API/pantalla habilitada ni una
reparación de los datos existentes. No se ejecutó contra originales ni catálogos
reales. Los dos pares de cuentas por espacios siguen pendientes; no se les asignó
ningún destino. No se relacionaron clientes, comerciales ni equipos por nombres.

Fase 4 debe proyectar datos autorizados del servidor, generar un dry-run privado
por registro/alcance y verificar la revisión/relación anterior dentro de la transacción.
Además debe detectar colisiones AUM cuenta/mes antes de aplicar varias propuestas,
preservar movimientos Revenue y comparar sumas exactas por fuente/período/custodio.
Una propuesta individual no prueba que una fusión sea publicable. La aprobación
específica del dueño se requiere antes de modificar producción.

Verificación nueva: 67 unitarias, lint y tsc aislado correctos. Los siete casos del
motor cubren estados, límites de identidad, aliases, referencias múltiples, conflictos,
procedencia, repetición e inmutabilidad. Sin pruebas remotas ni afirmación de build
válido; limitaciones vigentes en [data-quality-validation.md](data-quality-validation.md).
