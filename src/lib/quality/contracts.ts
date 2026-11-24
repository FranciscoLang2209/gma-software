import { UUID } from "../imports/contracts.ts";
import { isImportPeriod } from "../data/normalization.ts";

export const QUALITY_SOURCES = { aum:"AUM", revenue:"Revenue", fa:"FA", ref:"REF actual", master:"Snapshots Master", commissions:"Comisiones", accounts:"Cuentas", manual:"Identificadores manuales", unknown:"Fuente sin identificar" } as const;
export const QUALITY_ISSUES = { unresolved:"Sin correspondencia", blocking_error:"Error bloqueante", warning:"Advertencia de importación", orphan_account:"Cuenta inexistente", orphan_source:"Origen inexistente", custodian_conflict:"Custodio contradictorio", missing_client:"Sin cliente canónico", missing_custodian:"Sin custodio", missing_amount:"Importe ausente", missing_rate:"Tasa pendiente", missing_source:"Fuente de importación sin identificar", identifier_format:"Formato de cuenta para revisar", identity_conflict:"Posible conflicto de identidad", period_incomplete:"Cobertura mensual incompleta" } as const;
export const QUALITY_STAGES = { published:"Hechos publicados activos", preparation:"Filas en preparación", routing:"Filas sin alcance válido", upload:"Cargas históricas", catalog:"Catálogo actual", identifier:"Identificadores", reference:"Referencias / snapshots", coverage:"Diagnóstico de cobertura" } as const;
export type QualityFilters = { from?:string; to?:string; source?:keyof typeof QUALITY_SOURCES; issue?:keyof typeof QUALITY_ISSUES; custodian?:string; mode:"issues"|"imports"|"audit"; offset:number; revision?:string };
export function parseQualityFilters(params: URLSearchParams): QualityFilters {
 const allowed = ["desde","hasta","fuente","problema","custodio","vista","offset","revision"];
 if ([...params.keys()].some(k=>!allowed.includes(k) || params.getAll(k).length!==1)) throw new Error("Revisá los filtros: hay parámetros desconocidos o repetidos.");
 const result: QualityFilters = { mode:"issues", offset:0 };
 for (const [url,key] of [["desde","from"],["hasta","to"]] as const) {
  const value=params.get(url);
  if (value) { if (!/^\d{4}-\d{2}$/.test(value) || !isImportPeriod(value+"-01")) throw new Error("Elegí meses válidos entre 1900 y 2200."); result[key]=value+"-01"; }
 }
 if (result.from && result.to && result.from>result.to) throw new Error("El mes inicial debe ser anterior o igual al final.");
 const source=params.get("fuente"),issue=params.get("problema"),custodian=params.get("custodio"),mode=params.get("vista"),offset=params.get("offset"),revision=params.get("revision");
 if (source) { if (!Object.hasOwn(QUALITY_SOURCES,source)) throw new Error("Fuente inválida."); result.source=source as QualityFilters["source"]; }
 if (issue) { if (!Object.hasOwn(QUALITY_ISSUES,issue)) throw new Error("Tipo de problema inválido."); result.issue=issue as QualityFilters["issue"]; }
 if (custodian) { if (custodian!=="sin_custodio" && !UUID.test(custodian)) throw new Error("Custodio inválido."); result.custodian=custodian; }
 if (mode) { if (!["issues","imports","audit"].includes(mode)) throw new Error("Vista inválida."); result.mode=mode as QualityFilters["mode"]; }
 if (offset) { if (!/^(0|[1-9]\d{0,6})$/.test(offset) || Number(offset)>1000000) throw new Error("Página inválida."); result.offset=Number(offset); }
 if (revision) { if (!/^[a-f0-9]{32}$/.test(revision)) throw new Error("Revisión inválida."); result.revision=revision; }
 if (result.offset>0 && !result.revision) throw new Error("Reiniciá la consulta para obtener una revisión.");
 return result;
}
export function qualityHref(filters:QualityFilters,changes:Partial<QualityFilters>={}) {
 const f={...filters,...changes},p=new URLSearchParams();
 for (const [key,url] of [["from","desde"],["to","hasta"],["source","fuente"],["issue","problema"],["custodian","custodio"],["mode","vista"],["offset","offset"],["revision","revision"]] as const) {
  const v=f[key]; if (v!==undefined && v!=="" && !(key==="offset" && v===0)) p.set(url,key==="from"||key==="to"?String(v).slice(0,7):String(v));
 }
 return "/calidad-datos"+(p.size?"?"+p:"");
}
export function parseQualityAction(value:unknown) {
 if (!value || typeof value!=="object" || Array.isArray(value)) throw new Error("Solicitud inválida.");
 const b=value as Record<string,unknown>;
 if (Object.keys(b).some(k=>!["batch_id","row_id","evidence","revision","confirm"].includes(k)) || typeof b.batch_id!=="string" || !UUID.test(b.batch_id)
 || typeof b.row_id!=="string" || !UUID.test(b.row_id) || typeof b.evidence!=="string" || b.evidence.trim().length<10 || b.evidence.length>2000
 || (b.revision!==undefined && (typeof b.revision!=="string" || !/^[a-f0-9]{32}$/.test(b.revision) || b.confirm!==true))
 || (b.revision===undefined && b.confirm!==undefined)) throw new Error("Revisá lote, fila, evidencia y confirmación de la vista previa.");
 return { batch_id:b.batch_id,row_id:b.row_id,evidence:b.evidence.trim(),expected_revision:(b.revision as string|undefined)??null };
}
export type QualityRow = { key:string; source:keyof typeof QUALITY_SOURCES; stage:keyof typeof QUALITY_STAGES; period:string|null; period_to:string|null; custodian_id:string|null; account_id:string|null; batch_id:string|null; row_id:string|null; sheet_name:string|null; row_number:number|null; status:string; codes:(keyof typeof QUALITY_ISSUES)[]; original:unknown; review_upload_id:string|null; review_page:number|null; candidates:{account_id:string;custodian_id:string;namespace:string;original:string;evidence:string}[] };
export type QualityImport = { kind:"batch"|"upload";id:string;source:string;period:string|null;custodian_id:string|null;file_name_original:string;row_count:number;blocking_error_count:number;version:number|null;upload_id:string|null;status:string;created_at:string;created_by:string;reviewed_at:string|null;reviewed_by:string|null;published_at:string|null;published_by:string|null };
export type QualityAudit = { id:string;occurred_at:string;actor_id:string|null;action:string;entity_table:string;entity_id:string;reason:string|null;before_data:string|null;after_data:string|null;batch_id:string|null;source:string|null;custodian_id:string|null;period:string|null };
export type QualityReport = { revision:string;mode:QualityFilters["mode"];offset:number;limit:number;row_count:number;summaries:{source:keyof typeof QUALITY_SOURCES;stage:keyof typeof QUALITY_STAGES;records:number;related:number;unrelated:number;not_applicable:number;related_percent:string|null}[];issue_counts:Partial<Record<keyof typeof QUALITY_ISSUES,number>>;custodians:{id:string;label:string}[];rows:(QualityRow|QualityImport|QualityAudit)[] };
export type AliasPreview = { batch_id:string;row_id:string;account_id:string;custodian_id:string;period:string;literal:string;count:number;already_resolved:number;pending:number;evidence_changes:number;revision:string;evidence:string;sample_rows:number[];status:"preview"|"applied" };
