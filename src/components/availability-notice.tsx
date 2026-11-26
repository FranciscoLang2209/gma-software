import Link from "next/link";
import type { DataNotice } from "@/lib/queries/availability";
import type { Availability } from "@/lib/queries/availability";
import { ENTITY_FILTERS, reportHref } from "@/lib/queries/presentation";
import { clearReferenceFilters } from "@/lib/queries/references";
import { roaHref } from "@/lib/roa/presentation";
export function DataNoticeView({notice,availability,params,path,admin=false}:{notice:DataNotice|null;availability?:Availability;params:URLSearchParams;path:string;admin?:boolean}) {
 if(!notice)return null;
 const changes={...Object.fromEntries(Object.keys(ENTITY_FILTERS).map(key=>[key,null])),...clearReferenceFilters(),...(params.has("agrupar")?{agrupar:params.get("agrupar")}: {})};
 const reset=path==="/rentabilidad"?roaHref(params,changes):reportHref(path,params,changes);
 return <section className="panel report-section" role="status"><h2>{notice.title}</h2><p>{notice.message}</p>
  {notice.code==="no_matches"&&availability&&(availability.accounts_without_client>0||availability.unclassified_accounts>0)&&<p>Antes de filtros, en este período: {availability.accounts_without_client} cuentas con datos publicados sin cliente canónico y {availability.unclassified_accounts} sin servicio clasificado. Estas relaciones pendientes pueden dejarlas fuera de la selección; las etiquetas REF no acreditan esas relaciones.</p>}
  <div className="report-actions">{notice.code==="no_matches"&&<Link href={reset}>Quitar filtros y conservar el período</Link>}{["incomplete","insufficient"].includes(notice.code)&&<a href="#cobertura">Revisar cobertura y faltantes</a>}{admin&&<Link href="/calidad-datos">Revisar relaciones y fuentes pendientes</Link>}</div>
 </section>;
}
