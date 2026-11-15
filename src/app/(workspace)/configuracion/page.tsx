import Link from "next/link";
import type { Metadata } from "next";
import { requireAccess } from "@/lib/auth/access";
import { PageHeader } from "@/components/page-header";
import { ModelManager } from "@/components/model-manager";
import { ENTITIES, type Entity, type Catalog } from "@/lib/model/contracts";
import type { Search } from "@/lib/queries/presentation";
import { UUID } from "@/lib/imports/contracts";
export const metadata: Metadata = { title: "Configuración" };
export default async function SettingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase, role } = await requireAccess();
  const search = await searchParams;
  const entity = search.entidad ?? "clients", offset = search.offset ?? "0", editingId = search.editar;
  if (typeof entity !== "string" || !Object.hasOwn(ENTITIES, entity) || typeof offset !== "string" || !/^\d{1,7}$/.test(offset) || Number(offset) > 1000000 || Number(offset) % 25 || (editingId !== undefined && (typeof editingId !== "string" || !UUID.test(editingId))) || Object.keys(search).some((k) => !["entidad", "offset", "editar"].includes(k)))
    return <section className="panel report-section" role="alert"><p>Parámetros de catálogo inválidos.</p><Link href="/configuracion">Reiniciar catálogo</Link></section>;
  const { data, error } = await supabase.rpc("manage_model", { operation: "list", entity, page_offset: Number(offset), target_id: editingId ?? null });
  return <><PageHeader eyebrow="MODELO DEL NEGOCIO" title="Configuración" description="Catálogos y vigencias con historia conservada. Solo administradores modifican." />
    {error || !data ? <section className="panel report-section" role="alert"><p>No se pudo consultar el modelo. Reintentá más tarde.</p></section> : <ModelManager key={`${entity}/${editingId ?? "new"}/${offset}`} entity={entity as Entity} catalog={data as Catalog} admin={role === "admin"} editingId={editingId as string | undefined} />}</>;
}
