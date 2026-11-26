import type { Report } from "./contracts.ts";
import type { RoaMetrics, RoaReport } from "../roa/contracts.ts";

export type Availability = { period_rows:number; accounts_without_client:number; unclassified_accounts:number };
export type DataNotice = { code:"no_period"|"no_matches"|"incomplete"|"insufficient"|"unverified"; title:string; message:string };
export function emptyNotice(availability:Pick<Availability,"period_rows">|undefined, subject="AUM y Revenue"):DataNotice {
 if(!availability) return {code:"unverified",title:"Disponibilidad del período sin verificar",message:"La consulta no informó la disponibilidad general. Reintentá la consulta; este resultado no confirma ausencia de registros."};
 return availability.period_rows===0
  ? {code:"no_period",title:"No existen registros publicados para este período",message:`No hay registros de ${subject} en el período, antes de aplicar los filtros. Elegí otro período o consultá al administrador por las fuentes pendientes. Los importes permanecen N/D.`}
  : {code:"no_matches",title:"Los registros del período no cumplen estos filtros",message:`Hay registros publicados de ${subject} en el período. La combinación seleccionada no incluye ninguno; quitá filtros manteniendo las fechas. Una ausencia no equivale a cero.`};
}
export function reportNotice(report:Report):DataNotice|null {
 const hasRecords=report.months.some(m=>(m.aum_rows??0)>0||(m.revenue_rows??0)>0);
 if(!hasRecords)return emptyNotice(report.availability);
 const t=report.total;
 if(t.aum_rows>t.aum_values||t.revenue_rows>t.revenue_values)return {code:"insufficient",title:"Hay registros sin importe: la información es insuficiente",message:"Las sumas incluyen sólo importes conocidos y pueden ser parciales. Revisá los registros sin valor; N/D no significa cero."};
 if(!t.aum_rows||!t.revenue_rows||t.aum_missing_accounts||t.revenue_missing_account_months||report.coverage.some(c=>!c.published))return {code:"incomplete",title:"El período tiene cobertura incompleta",message:"Faltan fotos AUM, movimientos Revenue o publicaciones del universo observado. Se muestran los importes conocidos, sin arrastrar saldos ni completar con ceros. Revisá la cobertura por mes."};
 return null;
}
export function roaNotice(report:RoaReport):DataNotice|null {
 const status=report.total.calculation_status;
 if(status==="no_data")return emptyNotice(report.availability);
 if(status==="calculable")return null;
 const reasons={incomplete:"Faltan fotos mensuales, registros Revenue o importes. Se necesitan las tres fotos y los flujos del trimestre para calcular el ROA.",open_quarter:"El trimestre todavía está abierto. El ROA y su clasificación permanecen N/D hasta su cierre.",zero_aum:"El AUM promedio es cero: no permite dividir para calcular el ROA. Los importes conocidos se conservan.",negative_aum:"Hay una base AUM negativa. Se conserva el ajuste y el ROA permanece N/D; revisá la cobertura y los originales con el administrador."};
 return {code:status==="incomplete"?"incomplete":"insufficient",title:status==="incomplete"?"El trimestre tiene cobertura incompleta":"No hay una base suficiente para calcular el ROA",message:reasons[status]};
}
export function feeReason(metric:RoaMetrics) {
 if(metric.advisory_fee_status==="not_applicable")return metric.advisory_accounts>0?"Conjunto mixto: consultá Advisory por separado para comparar el Fee.":"Sin población Advisory para esta comparación.";
 if(metric.advisory_fee_status==="obsolete")return "La referencia quedó obsoleta y requiere revisión.";
 if(metric.advisory_fee_status==="verified_reference")return "Referencia ponderada comparable.";
 if(metric.calculation_status==="open_quarter")return "Trimestre abierto: la ponderación permanece N/D hasta el cierre.";
 return metric.missing_rate_account_months>0?"Faltan tasas publicadas aplicables; no se estima el Fee.":"Faltan fotos AUM completas o una base positiva para ponderar el Fee.";
}
