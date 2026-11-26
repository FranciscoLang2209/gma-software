import Link from "next/link";
import type { Metadata } from "next";
import { Table,Button } from "@radix-ui/themes";
import { requireAccess } from "@/lib/auth/access";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { StatusBadge } from "@/components/status-badge";
import { QualityAliasAction } from "@/components/quality-alias-action";
import { QUALITY_SOURCES,QUALITY_STAGES,QUALITY_ISSUES,parseQualityFilters,qualityHref,type QualityFilters,type QualityRow,type QualityImport,type QualityAudit } from "@/lib/quality/contracts";
import { queryQuality,qualityFailure } from "@/lib/quality/server";
import { exact } from "@/lib/queries/presentation";
import { UUID } from "@/lib/imports/contracts";
export const metadata:Metadata={title:"Calidad de datos"};
export const dynamic="force-dynamic";
type Search=Record<string,string|string[]|undefined>;
const modes={issues:"Problemas y pendientes",imports:"Historial de importaciones",audit:"Historial de cambios"} as const;
const extraStatuses:Record<string,string>={preparing:"Preparación",active:"Activa",inactive:"Inactiva",resolved:"Correspondencia acreditada",pending:"Pendiente",observed_incomplete:"Cobertura observada incompleta",expected:"Expectativa registrada",receipt:"Cobro clasificado",reconcile:"Conciliación registrada"};
function JsonDetails({value,title="Ver originales y validaciones"}:{value:unknown;title?:string}) {return <details><summary>{title}</summary><pre>{JSON.stringify(value,null,2)}</pre></details>;}
export default async function QualityPage({searchParams}:{searchParams:Promise<Search>}) {
 const {supabase}=await requireAccess(true);
 const params=await searchParams,search=new URLSearchParams();
 for(const [k,v] of Object.entries(params)) {if(Array.isArray(v))for(const x of v)search.append(k,x);else if(v!==undefined)search.append(k,v);}
 let filters:QualityFilters;
 try{filters=parseQualityFilters(search);}catch(e){return <><PageHeader eyebrow="REVISIÓN ADMINISTRATIVA" title="Calidad de datos" description="Diagnósticos y correspondencias con evidencia."/><section className="panel report-section"><h2>Revisá los filtros</h2><p role="alert">{(e as Error).message}</p><Link href="/calidad-datos">Reiniciar consulta</Link></section></>;}
 const {data:report,error}=await queryQuality(supabase,filters);
 const reset=qualityHref(filters,{offset:0,revision:undefined});
 if(error||!report){const failure=qualityFailure(error?.code);return <><PageHeader eyebrow="REVISIÓN ADMINISTRATIVA" title="Calidad de datos" description="Solo administradores; originales y diagnósticos privados."/><section className="panel report-section"><h2>Diagnóstico no disponible</h2><p role="alert">{failure.message}</p><Link href={reset}>Reiniciar consulta</Link></section></>;}
 const custodian=(id:string|null)=>report.custodians.find(c=>c.id===id)?.label??id??"Sin custodio";
 const summaryTotal=report.summaries.reduce((n,s)=>n+s.records,0);
 return <>
  <PageHeader eyebrow="INTEGRIDAD Y TRAZABILIDAD" title="Calidad de datos" description="Diagnósticos privados por fuente, pendientes de correspondencia e historia de operaciones. Las cifras financieras publicadas no se modifican al explorar."/>
  <section className="panel report-section"><h2>Alcance del diagnóstico</h2>
   <form className="import-form" method="get" key={reset}>
    <label>Desde (mes)<DatePicker type="month" name="desde" min="1900-01" max="2200-12" defaultValue={filters.from?.slice(0,7)}/></label>
    <label>Hasta (mes)<DatePicker type="month" name="hasta" min="1900-01" max="2200-12" defaultValue={filters.to?.slice(0,7)}/></label>
    <label>Fuente<Select name="fuente" defaultValue={filters.source??""}><option value="">Todas</option>{Object.entries(QUALITY_SOURCES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select></label>
    <label>Custodio<Select name="custodio" defaultValue={filters.custodian??""}><option value="">Todos</option><option value="sin_custodio">Sin custodio</option>{report.custodians.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</Select></label>
    <label>Tipo de problema<Select name="problema" defaultValue={filters.issue??""}><option value="">Todos los problemas</option>{Object.entries(QUALITY_ISSUES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select></label>
    <input type="hidden" name="vista" value={filters.mode}/><Button type="submit">Consultar calidad</Button><Link href="/calidad-datos">Limpiar filtros</Link>
   </form>
   <p>Los meses filtran hechos y preparaciones; Master usa el rango de tasas registrado. Catálogos, identificadores, REF actual y filas sin período identificable siguen visibles. Custodio y fuente se combinan con AND. El tipo de problema filtra la cola; los controles por fuente conservan su base completa.</p>
  </section>
  <div className="metric-grid">
   <MetricCard title="Registros controlados" value={String(summaryTotal)} period="Alcance de fuente / custodio / período" note="Granos separados en la tabla. Cobertura no cuenta como un registro financiero."/>
   <MetricCard title="Sin correspondencia" value={String(report.issue_counts.unresolved??0)} period="Filas o referencias pendientes" note="Se conservan originales; no se enlazan por nombre ni similitud."/>
   <MetricCard title="Posibles conflictos" value={String(report.issue_counts.identity_conflict??0)} period="Identidad para revisión" note="No acredita duplicidad ni autoriza fusionar cuentas."/>
   <MetricCard title="Cobertura incompleta" value={String(report.issue_counts.period_incomplete??0)} period="Cuenta / mes / fuente" note="Universo observado del trimestre, sin certificar cuentas esperadas ni imputar cero."/>
  </div>
  <section className="panel report-section"><h2>Relación técnica por fuente</h2>
   <p>Una relación técnica indica cuenta/custodio/origen o resolución registrada según el grano; no certifica identidad económica. Sin cliente canónico puede coexistir con una FK válida. No se suman importes ni se deduplican movimientos.</p>
   <div className="table-scroll quality-table" tabIndex={0} role="region" aria-label="Relaciones por fuente"><Table.Root><Table.Header><Table.Row>{["Fuente / grano","Registros","Relacionados","Sin relación técnica","No aplica","Porcentaje"].map(h=><Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header><Table.Body>
    {report.summaries.map(s=><Table.Row key={s.source+"/"+s.stage}><Table.Cell>{QUALITY_SOURCES[s.source]}<br/>{QUALITY_STAGES[s.stage]}</Table.Cell><Table.Cell>{s.records}</Table.Cell><Table.Cell>{s.related}</Table.Cell><Table.Cell>{s.unrelated}</Table.Cell><Table.Cell>{s.not_applicable}</Table.Cell><Table.Cell>{s.related_percent===null?"N/D":exact(s.related_percent)+" %"}</Table.Cell></Table.Row>)}
   </Table.Body></Table.Root></div>
   {!report.summaries.length&&<p>No hay registros para este alcance.</p>}
   <details><summary>Todos los controles y sus recuentos</summary><ul>{Object.entries(QUALITY_ISSUES).map(([code,label])=><li key={code}><Link href={qualityHref(filters,{mode:"issues",issue:code as QualityFilters["issue"],offset:0,revision:undefined})}>{label}: {report.issue_counts[code as keyof typeof QUALITY_ISSUES]??0}</Link></li>)}</ul><p>Una fila puede tener varios problemas; estos recuentos no se suman como registros únicos. Las FKs obligatorias pueden dar cero huérfanos sin acreditar cobertura económica.</p></details>
  </section>
  <nav className="report-actions" aria-label="Vistas de calidad">{Object.entries(modes).map(([mode,label])=><Link key={mode} aria-current={filters.mode===mode?"page":undefined} href={qualityHref(filters,{mode:mode as QualityFilters["mode"],offset:0,revision:undefined})}>{label}</Link>)}</nav>
  <section className="panel report-section"><h2>{modes[filters.mode]}</h2>
   {filters.mode==="issues"&&<>
    <p>Se muestran {report.row_count} registros con problemas, no solo los primeros 50. Los originales son privados. La cobertura observa tres meses del trimestre de cada cuenta con hechos y no presupone continuidad fuera de ese universo.</p>
    {(report.rows as QualityRow[]).map(r=><article key={r.key} className="panel import-panel resolution-row">
     <h3>{QUALITY_SOURCES[r.source]} · {QUALITY_STAGES[r.stage]} · {r.sheet_name? r.sheet_name+" / fila "+r.row_number:r.period??"Sin período propio"}</h3>
     <p>{custodian(r.custodian_id)} · {r.period??"Sin período propio o identificable"}{r.period_to&&r.period_to!==r.period?" a "+r.period_to:""} · <StatusBadge status={r.status} label={extraStatuses[r.status]}/></p>
     <ul>{r.codes.map(code=><li key={code}>{QUALITY_ISSUES[code]}</li>)}</ul>
     {r.account_id&&<p>Cuenta interna: <code>{r.account_id}</code>. <Link href={"/cuentas/"+r.account_id}>Ver cuenta</Link></p>}
     {r.original!==null&&<JsonDetails value={r.original} title={r.source==="ref"?"Ver referencia publicada":r.source==="master"?"Ver fila y procedencia del snapshot":r.stage==="catalog"||r.stage==="identifier"?"Ver registro y evidencia":"Ver originales y validaciones"}/>}
     {!!r.candidates.length&&<details><summary>Comparar coincidencias exactas acreditadas ({r.candidates.length})</summary>{r.candidates.map(c=><p key={c.account_id+"/"+c.namespace+"/"+c.original}>Literal: <code>{JSON.stringify(c.original)}</code> · namespace {c.namespace} · {custodian(c.custodian_id)} → <code>{c.account_id}</code>. Evidencia: {c.evidence}</p>)}</details>}
     {r.batch_id&&["published","preparation"].includes(r.stage)&&<p><Link href={"/correspondencias?lote="+r.batch_id+"&pagina="+(r.review_page??0)}>Seleccionar destino y acreditar equivalencia</Link> · <a href={"/api/fuentes/"+r.batch_id}>Original privado</a></p>}
     {r.batch_id&&["routing","upload"].includes(r.stage)&&<p><Link href={"/importaciones?carga="+r.batch_id}>Revisar carga histórica y filas sin alcance</Link> · <a href={"/api/importaciones/historicas/"+r.batch_id+"?original=1"}>Original privado</a></p>}
     {r.source==="master"&&<p><Link href={"/importaciones?modo=master"+(r.review_upload_id&&UUID.test(r.review_upload_id)?"&archivo="+r.review_upload_id:"")}>Revisar Master y sus tasas</Link></p>}
     {r.source==="ref"&&<p>Snapshot publicado: para corregirlo hace falta una revisión versionada del REF con sus fuentes privadas. No se edita esta foto. {r.review_upload_id&&<a href={"/api/importaciones/historicas/"+r.review_upload_id+"?original=1&reference=1"}>Descargar REF original privado</a>}</p>}
     {r.stage==="identifier"&&<p>Compará custodio, namespace y evidencia original. Cambiar relaciones publicadas requiere el dry-run revisado y su reparación versionada; no se fusionan desde este diagnóstico.</p>}
     {r.source==="accounts"&&<p><Link href="/configuracion?entidad=accounts">Revisar cuenta con vista previa y motivo</Link></p>}
     {r.source==="commissions"&&<p><Link href="/comisiones?vista=conciliaciones">Abrir revisión de Comisiones</Link></p>}
     {r.stage==="coverage"&&<p>Falta una foto, movimiento o importe de este cuenta-mes observado. Revisá las fuentes y el alcance antes de importar; ausencia no confirma actividad cero.</p>}
     {r.stage==="preparation"&&r.source==="revenue"&&r.status==="needs_resolution"&&r.batch_id&&r.row_id&&<QualityAliasAction batchId={r.batch_id} rowId={r.row_id} resetHref={reset}/>}
    </article>)}
   </>}
   {filters.mode==="imports"&&<><p>Versiones por fuente/mes/custodio, incluidas reemplazadas. No se borra historia. El filtro de problema pertenece a la cola.</p><div className="table-scroll quality-table" tabIndex={0} role="region" aria-label="Historial completo de importaciones"><Table.Root><Table.Header><Table.Row>{["Archivo / alcance","Filas / errores","Estado / versión","Responsables y fechas","Revisar"].map(h=><Table.ColumnHeaderCell key={h}>{h}</Table.ColumnHeaderCell>)}</Table.Row></Table.Header><Table.Body>{(report.rows as QualityImport[]).map(r=><Table.Row key={r.id}>
    <Table.Cell>{r.file_name_original}<br/>{QUALITY_SOURCES[r.source as keyof typeof QUALITY_SOURCES]??"Fuente sin identificar"} · {r.period??"Varios períodos / sin alcance"}<br/>{r.kind==="upload"?"Carga histórica conjunta":custodian(r.custodian_id)}</Table.Cell><Table.Cell>{r.row_count} / {r.blocking_error_count}</Table.Cell><Table.Cell><StatusBadge status={r.status} label={extraStatuses[r.status]}/>{r.version!==null&&" · v"+r.version}</Table.Cell>
    <Table.Cell><JsonDetails title="Ver fechas y usuarios" value={{creado:r.created_at,creado_por:r.created_by,revisado:r.reviewed_at,revisado_por:r.reviewed_by,publicado:r.published_at,publicado_por:r.published_by}}/></Table.Cell>
    <Table.Cell>{r.kind==="batch"&&<Link href={"/correspondencias?lote="+r.id}>Correspondencias y comparación</Link>}{r.upload_id&&<p><Link href={"/importaciones?carga="+r.upload_id}>Carga histórica conjunta</Link></p>}<a href={r.kind==="upload"?"/api/importaciones/historicas/"+r.id+"?original=1":"/api/fuentes/"+r.id}>Original privado</a></Table.Cell>
   </Table.Row>)}</Table.Body></Table.Root></div></>}
   {filters.mode==="audit"&&<><p>Cambios registrados con usuario, fecha y estado anterior/posterior. El período corresponde a la entidad afectada cuando está disponible, no a la fecha de operación. El tipo de problema pertenece a la cola.</p>{(report.rows as QualityAudit[]).map(r=><article className="panel import-panel" key={r.id}>
    <h3>{r.action} · {r.entity_table}</h3><p>{r.occurred_at} · Usuario: {r.actor_id??"No registrado"} · Entidad: {r.entity_id}</p><p>Motivo: {r.reason??"No registrado en este evento; consultar evidencia del registro."}</p>
    <details><summary>Comparar anterior y posterior</summary><h4>Anterior</h4><pre>{r.before_data??"No registrado"}</pre><h4>Posterior</h4><pre>{r.after_data??"No registrado"}</pre></details>{r.batch_id&&<Link href={"/correspondencias?lote="+r.batch_id}>Abrir importación relacionada</Link>}
   </article>)}</>}
   {!report.rows.length&&<div role="status"><h3>{report.row_count>0?"Esta página no tiene registros":filters.mode==="issues"?filters.issue?"No se detectó el problema seleccionado en este alcance":"No se detectaron problemas en este alcance":filters.mode==="imports"?"No hay importaciones que cumplan estos filtros":"No hay cambios auditados que cumplan estos filtros"}</h3><p>Los controles por fuente se mantienen arriba. Este diagnóstico no certifica cobertura económica ni convierte las ausencias en cero.</p><Link href={qualityHref(filters,{offset:0,revision:undefined,...(filters.mode==="issues"&&filters.issue?{issue:undefined}:{source:undefined,custodian:undefined,issue:undefined})})}>{report.row_count>0?"Volver a la primera página":filters.mode==="issues"&&filters.issue?"Ver todos los problemas del alcance":"Quitar fuente y custodio conservando el período"}</Link></div>}
   <nav className="report-actions" aria-label="Paginación de calidad"><span>{report.row_count} registros · Página {Math.floor(report.offset/report.limit)+1}</span>
    {report.offset>0&&<Link href={qualityHref(filters,{offset:Math.max(0,report.offset-report.limit),revision:report.revision})}>Anterior</Link>}
    {report.offset+report.rows.length<report.row_count&&<Link href={qualityHref(filters,{offset:report.offset+report.limit,revision:report.revision})}>Siguiente</Link>}
    <Link href={reset}>Actualizar desde el inicio</Link>
   </nav>
  </section>
 </>;
}
