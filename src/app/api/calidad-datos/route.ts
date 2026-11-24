import { importAccess,boundedBody,reply } from "@/lib/imports/server";
import { parseQualityFilters,parseQualityAction } from "@/lib/quality/contracts";
import { queryQuality,qualityFailure } from "@/lib/quality/server";
export const runtime="nodejs";
export async function GET(request:Request) {
 const client=await importAccess(request); if (client instanceof Response) return client;
 let filters; try {filters=parseQualityFilters(new URL(request.url).searchParams);} catch(e) {return reply({error:(e as Error).message},400);}
 const {data,error}=await queryQuality(client,filters);
 if (error || !data) {const f=qualityFailure(error?.code);return reply({error:f.message},f.status);}
 return reply(data);
}
export async function POST(request:Request) {
 const client=await importAccess(request); if (client instanceof Response) return client;
 let parameters;try {parameters=parseQualityAction(JSON.parse((await boundedBody(request,8192)).toString("utf8")));} catch(e) {return reply({error:e instanceof Error?e.message:"Solicitud inválida."},400);}
 const {data,error}=await client.rpc("quality_apply_alias",parameters);
 if (error || !data) {
  if (error?.code==="P0001" || error?.code==="P0002") return reply({error:"No se aplicó la equivalencia. Acreditá primero el ACCOUNT exacto en Correspondencias y revisá que el lote Revenue siga editable, sin errores ni destinos contradictorios."},409);
  const f=qualityFailure(error?.code);return reply({error:f.message},f.status);
 }
 return reply(data);
}
