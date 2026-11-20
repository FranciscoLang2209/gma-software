# Auditoría final de Rentabilidad / ROA — 2026-11-20

Alcance: cálculo, API, interfaz, tasas Advisory, permisos y exportación de ROA;
regresión de Resumen, Análisis comercial, Cuentas y Comisiones. Carga prevista:
aplicación interna con pocos usuarios concurrentes. Se revisaron los contratos,
los llamadores, la migración ROA, las proyecciones agregadas, autorización SSR,
RLS/grants, publicación/invalidez de tasas y pruebas conectadas. No es una auditoría
independiente de todos los importadores o dependencias del repositorio.

## Resultado y corrección

No se identificaron defectos financieros o de autorización en los escenarios
ejecutados. Se corrigió un defecto menor de presentación: una página sin filas
mostraba «desde 1» (o un offset fuera del conjunto). Ahora informa «sin filas en
esta página», conservando el total y la navegación. La prueba HTTP exige ese estado.

No se modificaron SQL financiero, migraciones, roles, dependencias ni lockfile.
Se agregaron regresiones SQL y HTTP; no se aplicaron migraciones remotas, no se
publicaron datos reales, no se hizo push ni se solicitó un despliegue.

## Matriz financiera y de seguridad ejecutada

Todos los importes y usuarios de estas pruebas son **SINTÉTICOS**. PostgreSQL real
17.12 en clústeres temporales privados; las pruebas HTTP usan Next real con
transporte Auth/PostgREST/Storage sintético explícito. No prueban esos servicios
remotos ni una sesión de usuario real.

| Caso | Resultado comprobado |
| --- | --- |
| Tres fotos y múltiples movimientos | 100.000 / 120.000 / 140.000 → promedio 120.000; Revenue 25 + 25 + 40 + 60 = 150; ROA anualizado 0,50%. Dos movimientos idénticos legítimos y múltiples aliases no multiplican AUM ni se deduplican. |
| Umbral 0,40% | Exactamente 0,40% = OK; ajustes de Revenue de ±0,0000000000000000000000001 USD alrededor de la base de prueba distinguen Bajo/OK mediante productos cruzados, aun cuando la división pueda redondear. |
| Umbral 0,60% | Exactamente 0,60% = OK; casos inmediatamente inferior y superior = OK/Muy bien. No clasifica con el valor de presentación redondeado. |
| Agregaciones | Cuenta, servicio, custodio, equipo, comercial y cliente concilian sumas con el total. ROA global 0,19% para cuentas con ratios 1% y 0,1%: recalcula sobre bases, no promedia porcentajes. Totales iguales en distintas páginas. |
| Vigencias | Equipo al cierre mensual, prioridad FA publicada y asignación manual principal; cambio explícito de comercial en marzo reparte 220.000/90 entre enero-febrero y 140.000/60 en marzo. Total 360.000/150 intacto; sin membresía no inventa equipo. |
| Foto intermedia ausente | Enero/marzo 100.000, febrero ausente → subtotal conocido 200.000, divisor contractual 3, promedio/ROA/categoría N/D, un cuenta-mes sin foto. No arrastra enero ni divide entre dos. |
| Una sola fuente | Solo Revenue permanece en el universo y no genera ratio; solo AUM no convierte ausencia de Revenue en cero. Cuenta observada solo el mes anterior permanece visible con trimestre sin datos y tres ausencias por fuente. |
| Nulos, cero y negativos | Importes nulos conservados; AUM promedio cero/negativo sin división ni categoría. Revenue explícito cero sí produce ROA cero con base positiva; ajuste negativo da ROA negativo. Fotos negativas se conservan y señalan. |
| Calendario | Trimestre de tres meses exactos; futuro/abierto sin ROA ni categoría, incluso con tres fotos anticipadas. Año y trimestre explícitos, sin traducir rangos de Resumen. |
| Tasas heterogéneas | 0,5% y 1% ponderadas por exposición mensual: Fee porcentual = 1.080.000 / 1.260.000. Diferencia en pp = (450 × 1.200 − 1.080.000) / 1.260.000, con una sola división. |
| Tasas no verificadas/incompletas | Fuente no verificada rechazada aunque se aporte evidencia adicional. Un evento verificado de Comisiones no se publica automáticamente como tasa ROA. Cobertura parcial de tasas deja Fee/diferencia N/D. Sin arrastre de tasas a otro trimestre. |
| Correcciones de tasas | Corrección invalida la referencia y la revisión en la misma transacción; reintento viejo no la reactiva. Nueva publicación revisada recupera comparación. Versiones inmutables, revisión obsoleta rechazada e idempotencia bajo concurrencia. |
| Servicios mixtos | Fee global N/D; comparador Advisory en su subconjunto. Clasificación de cliente/servicio actual, sin afirmar historia inexistente; cobertura sin clasificar visible antes del filtro. |
| RLS y roles | Admin/reader habilitados leen la misma proyección publicada. Reader no publica tasas ni accede a versiones/evidencia u originales; metadatos de usuario con role=admin no elevan privilegios. Anónimo, perfil deshabilitado y sesión vencida rechazados. |
| Funciones y almacenamiento | Wrappers invoker, ejecutor NOLOGIN/NOBYPASSRLS, search_path vacío, RLS forzado, sin EXECUTE anon/service_role ni CREATE residual. Originales privados; publicación por admin y mismo origen. Operador de migraciones sin SUPERUSER y restauración desde cero comprobados. |
| Errores/revisiones | Filtros inválidos/repetidos rechazados; páginas requieren revisión y cambios publicados la invalidan. Timeout e indisponibilidad sin payload SQL privado ni sustitución por demo. Preparación no altera reportes publicados. |
| Capacidad local | 800 cuentas × tres meses; promedio 80.000.000, Revenue 240.000, ROA 1,2%, primera/última página coherentes bajo presupuesto SQL local de 8 s. No representa latencia ni volumen real remoto. |

## Exportación y semántica existente

ROA **no tiene exportación CSV** en el contrato vigente. Se comprobó que
`formato=csv` y `formato=csv-completo` son rechazados con 400 JSON, sin adjunto.
La UI lo declara. No se habilitó una descarga incompleta ni se reutilizó el CSV de
Resumen con otro denominador. Es una capacidad pendiente, no un check de CSV ROA
exitoso.

Las regresiones SQL verifican que la definición y los resultados de
`aggregate_report` no cambian por consultar ROA o publicar tasas. Con las mismas
fotos, Resumen conserva cierre 140.000 y Revenue 150, mientras ROA usa promedio
120.000. El recorrido HTTP comprueba Resumen/ranking/cuenta/CSV con cierre 120 y
Revenue 22, corrección acotada y 253 cuentas en exportación completa. La suite de
Auth verifica exportación ante cambios de revisión, fallo a mitad de descarga,
revocación, límite, fórmulas inertes y ausencia de resultados parciales.
Comisiones conserva sus vistas, fórmula, publicación, revisión y CSV propios.

## Verificaciones y evidencia

Entorno: Node 24.22.3, npm existente en `/tmp/gma-npm`, PostgreSQL 17.12 existente
en `/tmp/gma-pg17`. Se usó el Node del runtime local para cargar SWC: el Node
embebido de ChatGPT rechazó inicialmente la biblioteca nativa. No se instalaron
dependencias ni se alteró configuración del proyecto para resolver ese problema.

| Comando | Resultado y log local |
| --- | --- |
| `npm test` | 49/49; `/tmp/gma-audit-unit.log`. Las nuevas aserciones financieras están en SQL, no suman tests Node. |
| `npm run lint` | Sin warnings; `/tmp/gma-audit-lint.log`. |
| `npm run typecheck` | Typegen y tsc correctos; `/tmp/gma-audit-types.log`. Build final vuelve a comprobar TypeScript tras el ajuste de UI. |
| `npm run build` | Build de producción local correcto; `/tmp/gma-audit-build.log`. No despliega. |
| `npm run test:db` | Suite completa ampliada, capacidad, concurrencia, operador administrado y restauración correctos; `/tmp/gma-audit-db.log`. |
| `npm run test:auth:http` | Correcto; proveedor HTTP sintético, no Supabase remoto; `/tmp/gma-audit-auth.log`. |
| `npm run test:dashboard -- --serve` | Recorrido integral correcto, incluidas las nuevas aserciones de CSV rechazado y página vacía; `/tmp/gma-audit-http.log`. |
| Chrome / Playwright / axe externos al repo | Admin/reader a 1440/768/390 px; filtros, teclado, paginación/revisión, vacío/error, sin errores JS ni overflow global; `/tmp/gma-audit-browser.log`. |
| Chrome con fixture calculable | Admin/reader a 1440/390 px, dos trimestres, tres gráficos, AUM 100.000 / Revenue 150 / ROA 0,60% / Fee 0,50% / diferencia 0,10 pp; mixto global 0,14% con Fee global N/D; `/tmp/gma-audit-calculable.log`. |

Se inspeccionaron capturas sintéticas de escritorio y móvil en
`/tmp/gma-audit-ui`. Axe no detectó infracciones en diez escenarios; sí dejó
resultados `incomplete` de contraste en contenido recortado de tablas desplazables
(13–26 nodos en estados incompletos; 34–47 en calculables). No equivale a certificar
accesibilidad. Las tablas tienen desplazamiento propio y alternativa textual para
gráficos; no se consideró ese desplazamiento un desbordamiento global.
Al cerrar se detuvieron los servidores y se eliminaron los clústeres sintéticos;
el log HTTP confirma la limpieza. Se conservan únicamente logs y capturas locales.

Revisión de seguridad contrastada con documentación oficial de
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y
[funciones](https://supabase.com/docs/guides/database/functions), además del
[changelog](https://supabase.com/changelog.md). No se actualizaron integraciones.
Los avisos remotos previamente registrados en validation.md no se volvieron a
consultar ni se declaran resueltos por esta auditoría local.

## Riesgos y aceptación manual

El cálculo sigue siendo provisional sobre cobertura observada. Faltan confirmar
la población esperada, altas/bajas y meses sin movimientos; la presencia de filas
no certifica completitud. Payout broker y su periodización requieren conciliación
económica por servicio. Cada tasa Advisory exige acreditar comparabilidad y vigencia
trimestral. Cliente y servicio carecen de historia modelada. La evolución usa
revisiones independientes por trimestre.

No se conciliaron Excel privados ni se verificaron roles autenticados contra
Supabase/Vercel remotos. No se certifican accesibilidad manual, Safari/Firefox,
lector de pantalla o carga real. Los avisos previos de seguridad/rendimiento del
entorno remoto conservan su estado documentado.

**Apta para una prueba manual exploratoria con usuarios invitados**, manteniendo
visibles las advertencias provisionales. No habilita resultados económicos
certificados ni aceptación de una exportación ROA inexistente. La aceptación debe
recorrer admin y lector, trimestre explícito, ambos umbrales, tres meses por cuenta,
cambio de equipo/comercial, faltantes y comparador Advisory en conjunto mixto;
contrastar luego un trimestre con fuentes privadas y criterios económicos acordados.
Solicitar despliegue de prueba por separado si hace falta publicar esta corrección.
