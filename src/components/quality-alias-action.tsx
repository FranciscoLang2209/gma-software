"use client";
import { useRef,useState,type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@radix-ui/themes";
import type { AliasPreview } from "@/lib/quality/contracts";
export function QualityAliasAction({batchId,rowId,resetHref}:{batchId:string;rowId:string;resetHref:string}) {
 const [preview,setPreview]=useState<AliasPreview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const inFlight=useRef(false);
 async function run(event:FormEvent<HTMLFormElement>,apply=false) {
  event.preventDefault(); if(inFlight.current)return; inFlight.current=true;setBusy(true);setError("");
  const form=new FormData(event.currentTarget);
  try {
   const response=await fetch("/api/calidad-datos",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({batch_id:batchId,row_id:rowId,evidence:apply?preview!.evidence:form.get("evidence"),...(apply?{revision:preview!.revision,confirm:form.has("confirm")}:{})})});
   const data=await response.json();if(!response.ok)throw new Error(data.error??"No se confirmó la resolución.");setPreview(data);
  }catch(e){setError((e as Error).message);}finally{inFlight.current=false;setBusy(false);}
 }
 return <details><summary>Aplicar una equivalencia acreditada a este ACCOUNT</summary>
  <p>Solo filas con el mismo ACCOUNT literal de este lote Revenue y custodio. Primero acreditá la equivalencia individual en Correspondencias. No publica ni modifica importes.</p>
  <form className="import-form" onSubmit={e=>void run(e)} onChange={()=>setPreview(null)}>
   <label>Evidencia para todas las filas<textarea name="evidence" minLength={10} maxLength={2000} required disabled={busy||preview?.status==="applied"} /></label>
   <Button disabled={busy||preview?.status==="applied"}>Preparar vista previa</Button>
  </form>
  {error&&<p role="alert">{error}</p>}
  {preview&&<div className="publish-confirmation">
   <p>ACCOUNT literal: <code>{JSON.stringify(preview.literal)}</code>. Custodio: {preview.custodian_id}. Mes: {preview.period}.</p>
   <p>Destino acreditado: <code>{preview.account_id}</code>. Se resolverán {preview.count} filas. Primeras filas: {preview.sample_rows.join(", ")}.</p>
   <p>Anterior: {preview.already_resolved} filas resueltas y {preview.pending} pendientes; {preview.evidence_changes} resoluciones requieren actualizar evidencia/actor. Posterior: las {preview.count} filas con el destino acreditado y esta evidencia. Un destino contradictorio bloquea todo el conjunto.</p>
   {preview.status==="preview"?<form className="import-form" onSubmit={e=>void run(e,true)}>
    <label><input type="checkbox" name="confirm" required disabled={busy}/> Revisé literal, custodio, destino y todas las filas del alcance. Confirmo aplicar esta equivalencia con la evidencia indicada.</label>
    <Button disabled={busy}>Confirmar equivalencia en el lote</Button>
   </form>:<p role="status">Correspondencias guardadas con auditoría. Los publicados no cambiaron. <Link href={resetHref}>Actualizar diagnóstico</Link></p>}
  </div>}
 </details>;
}
