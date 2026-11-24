import { requireAccess } from "@/lib/auth/access";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ImportModes } from "@/components/import-modes";
import { UUID } from "@/lib/imports/contracts";
export const metadata: Metadata = { title: "Importaciones" };
export default async function ImportsPage({ searchParams }: { searchParams: Promise<{ carga?: string; modo?: string; archivo?: string }> }) {
  const { supabase } = await requireAccess(true);
  const [custodians, batches] = await Promise.all([
    supabase
      .from("admin_custodians")
      .select("id,code,name")
      .order("name")
      .limit(200),
    supabase
      .from("admin_import_batches")
      .select("id,source,period,status,custodian_id,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (custodians.error || batches.error)
    throw new Error("No se pudieron consultar las importaciones.");
  const params = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="ORIGEN Y TRAZABILIDAD"
        title="Importaciones"
        description="Preparación privada de AUM, Revenue, FA y Master Owners. Los archivos y sus filas no aparecen en el dashboard."
      />
      <ImportModes
        initialHistoricalId={params.carga}
        initialMode={params.modo === "master" ? "master" : "monthly"}
        initialMasterId={UUID.test(params.archivo ?? "") ? params.archivo : undefined}
        custodians={custodians.data ?? []}
        batches={batches.data ?? []}
      />
    </>
  );
}
