# Rediseño UI/UX — etapas 1 y 2

Fecha: 2026-11-16, Buenos Aires. Rama: `codex/ui-ux-dashboard`.
Alcance: sistema visual, navegación compartida y Resumen ejecutivo. Sin despliegue.

## Diagnóstico y plan ejecutado

La interfaz anterior tenía una base útil: Radix Themes, Recharts, filtros GET con
identificadores por URL, formatos decimales exactos, exportación y cobertura.
Sin embargo, siete KPIs tenían igual jerarquía; el formulario mostraba todos los
selectores; exportación, notas técnicas y cifras competían por atención. Navegación
numerada y paleta verde sin una identidad institucional consistente.

Se inspeccionaron shell, rutas, reportes, cuentas, preparación de importaciones,
resolución y gestión del modelo. Se decidió mantener sus componentes y contratos.
Primero se implementó la base visual y navegación; después, únicamente la composición
del Resumen. Las otras rutas reciben estilos compartidos; no se reorganizó su flujo.

## Sistema visual

- Fondo gris claro, superficies blancas, navy `#173952`, bordes suaves y sombras mínimas.
- Inter Variable local 5.3.0, con respaldo system-ui; sin petición de fuentes a terceros.
- Lucide React 1.73.0, imports estáticos, iconos decorativos ocultos al árbol accesible.
  Peers consultados en npm: React 16.5–19; React 19.3.1 instalado compatible.
- Radix Themes 3.3.0: Theme, Button, Badge, Table y Skeleton reutilizados.
  Recharts 3.10.1 conservado, sin migración a Tailwind/shadcn ni paquetes redundantes.
- Tokens semánticos de positivo, negativo, advertencia y faltante. Las variaciones
  se presentan neutrales: un aumento de AUM no acredita rendimiento favorable.
- Navegación con iconos, selección activa, contexto privado y rol; móvil en dos columnas.
  Breadcrumb de sección, enlace de salto, foco visible y movimiento reducido.
- `MetricCard`: título, período, valor exacto y nota; dos tamaños jerárquicos.
- Tarjetas de gráficos con escalas independientes, tooltip del decimal original,
  tabla/lista textual expandible y estado vacío sin series simuladas.
- Tablas con encabezados sobrios, números tabulares, importes completos y scroll local.

Referencias consultadas como inspiración, sin copiar una plantilla:
[Tremor](https://www.tremor.so/), [shadcn Charts](https://ui.shadcn.com/docs/components/base/chart)
y [Lucide React](https://lucide.dev/guide/react).

## Resumen ejecutivo

Encabezado → período/exportación → filtros compactos → AUM y Revenue principales →
cuentas, clientes y variación mensual de Revenue → evolución por fuente → acceso
al análisis por custodio → detalle paginado → cobertura/trazabilidad expandible.
La variación mensual de AUM se conserva dentro de su KPI principal.

Fechas y custodio quedan visibles; equipo, comercial, cliente, cuenta y servicio
están en «Más filtros», abierto si hay filtros adicionales aplicados. Todos los
controles se envían por GET incluso cuando el panel está cerrado. Cambiar vistas,
exportar y abrir análisis conserva filtros por ID y reinicia paginación como antes.

El reporte de Resumen agrupa por cuenta por defecto. No se agregan páginas parciales
en el cliente para fabricar una distribución por custodio: el acceso a Análisis
comercial usa la consulta existente con `agrupar=custodian`. Si el reporte actual
ya está agrupado por custodio, muestra sus gráficos indicando «página visible».

No se añadieron métricas, cálculos financieros, consultas ni fallbacks. AUM usa el
último mes, Revenue el rango, N/D conserva ausencia; exportación mantiene revisión
y cobertura. El error de consulta retorna antes de renderizar KPIs.

## Archivos afectados

| Área | Archivos |
| --- | --- |
| Base | `src/app/globals.css`, `src/app/layout.tsx`, `src/app/icon.svg`, `src/app/loading.tsx` |
| Shell y encabezados | `src/app/(workspace)/layout.tsx`, `src/components/navigation.tsx`, `src/components/page-header.tsx` |
| Resumen | `src/app/(workspace)/page.tsx`, `src/components/summary-overview.tsx`, `src/components/metric-card.tsx`, `src/components/report-screen.tsx` |
| Reportes compartidos | `src/components/report-view.tsx`, `src/components/report-chart.tsx` |
| Dependencias | `package.json`, `package-lock.json`: solo Inter y Lucide; versiones previas conservadas |

## Plan propuesto para las demás secciones — sin implementar

1. Análisis comercial: priorizar ranking y selector de dimensión, luego distribución
   y detalle; indicar siempre si el gráfico cubre una página parcial.
2. Cuentas: búsqueda y filtros en cabecera, directorio de importes legibles y detalle
   con historia mensual, identidad y procedencia en bloques separados.
3. Importaciones: presentar preparación, validación, conciliación y publicación como
   pasos explícitos, manteniendo errores bloqueantes y publicación revisada.
4. Correspondencias: poner conflicto, evidencia y resolución juntos; conservar
   identidad por namespace/custodio y trazabilidad de cada cambio.
5. Configuración: agrupar catálogos y vigencias, conservando revisión previa y permisos.

Revisar estas dos primeras etapas antes de autorizar nuevas secciones.
Evidencia y límites: [validation.md](validation.md), último registro UI/UX.

## Continuación autorizada — etapas 3 a 7, 2026-11-16

El dueño aprobó las etapas 1 y 2 y solicitó subirlas a `main` y continuar las
secciones siguientes. Commit `2475ab14be828b3c9323700aceeb4de53645d9f8` publicado en
`main`, verificado con `git ls-remote`; GitHub informa estado Vercel `success`.
Esto reemplaza el pendiente de escritura Git de los registros anteriores.
No acredita una sesión real ni una conciliación financiera del despliegue.

La continuación se implementa en `codex/ui-ux-sections`; todavía no se publica
este segundo conjunto. Numeración de esta continuación:

| Etapa | Resultado |
| --- | --- |
| 3 · Análisis comercial | Filtros compactos, exportación, selector de seis dimensiones, dos KPIs globales y gráficos horizontales por grupo. Ranking completo en tabla y cobertura expandible. |
| 4 · Cuentas | Búsqueda destacada, conteo filtrado y tabla; detalle con navegación por secciones, KPIs, gráficos, historia mensual, vigencias y procedencia. Volver conserva filtros y búsqueda. |
| 5 · Importaciones | Etapas visibles, ayuda de formatos expandible, estados semánticos, historial legible y acceso a correspondencias. Conserva carga, pausa, reanudación, validación y originales privados. |
| 6 · Correspondencias | Etapas, estado del lote y filas, identidad/destino/evidencia, conciliación destacada y bloque de confirmación de publicación. Mismos controles y operaciones. |
| 7 · Configuración | Navegación de catálogos, catálogo y editor separados, motivo, revisión antes/después y auditoría expandible. El lector sigue sin editor. |

### Componentes y límites

Se añaden `CommercialOverview`, `CoverageDisclosure`, `WorkflowSteps` y `StatusBadge`.
Se reutilizan `MetricCard`, `ReportFilters`, `ReportTable`, `ReportChart` y las
operaciones existentes. Cambios de composición en `account-screen.tsx`,
`import-preparation.tsx`, `import-resolution.tsx` y `model-manager.tsx`; estilos en
`globals.css`. Sin dependencias nuevas, sin modificar `src/lib`, API, SQL ni acceso.

Los gráficos comerciales muestran hasta ocho grupos de la página visible en el
orden del desglose, siempre identificado. No se recalculan totales, participaciones
ni rankings sobre una página parcial; la tabla conserva todos sus grupos y
paginación. Revenue usa el mismo orden del desglose, sin presentarlo como un
ranking propio de Revenue. Los tooltips muestran el decimal original; solo la
geometría del gráfico usa Number. Los gráficos del detalle de cuenta provienen del
reporte filtrado existente; la tabla mensual conserva las filas de contexto fuera
del filtro comercial. Los pasos son indicadores de estado, no controles que salten
validaciones. Ante un estado desconocido no se inventa una etapa actual.

Próximo paso: revisar esta continuación y, si se solicita, incorporarla a `main`.
No ampliar a métricas financieras, usuarios, integraciones ni cambios de acceso.
