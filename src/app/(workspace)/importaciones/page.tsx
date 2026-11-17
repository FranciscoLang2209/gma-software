import { requireAccess } from "@/lib/auth/access";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ImportModes } from "@/components/import-modes";
export const metadata: Metadata = { title: "Importaciones" };
export default async function ImportsPage({ searchParams }: { searchParams: Promise<{ carga?: string }> }) {
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
  return (
    <>
      <PageHeader
        eyebrow="ORIGEN Y TRAZABILIDAD"
        title="Importaciones"
        description="Preparación privada de AUM, Revenue y FA. Los archivos y sus filas no aparecen en el dashboard."
      />
      <ImportModes
        initialHistoricalId={(await searchParams).carga}
        custodians={custodians.data ?? []}
        batches={batches.data ?? []}
      />
    </>
  );
}
