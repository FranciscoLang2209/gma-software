import type { Metadata } from "next";
import { requireAccess } from "@/lib/auth/access";
import { PageHeader } from "@/components/page-header";
import { ImportResolution } from "@/components/import-resolution";
export const metadata: Metadata = { title: "Correspondencias" };
export default async function CorrespondencesPage({ searchParams }: { searchParams: Promise<{ lote?: string; pagina?: string }> }) {
  const { supabase } = await requireAccess(true);
  const [batches, custodians, accounts, advisors, aliases] = await Promise.all([
    supabase.from("admin_import_batches").select("id,source,period,status,custodian_id,file_name_original").order("created_at", { ascending: false }).limit(50),
    supabase.from("admin_custodians").select("id,code,name").order("name").limit(200),
    supabase.from("admin_accounts").select("id,custodian_id").order("created_at", { ascending: false }).limit(200),
    supabase.from("admin_commercial_advisors").select("id,name").order("name").limit(200),
    supabase.from("admin_account_identifiers").select("account_id,source,namespace,value_original,custodian_id,evidence").eq("resolution_status", "resolved").order("created_at", { ascending: false }).limit(200),
  ]);
  if ([batches, custodians, accounts, advisors, aliases].some((r) => r.error)) throw new Error("No se pudieron consultar las correspondencias.");
  const params = await searchParams;
  const initialPage = /^\d{1,3}$/.test(params.pagina ?? "") && Number(params.pagina) <= 200 ? Number(params.pagina) : 0;
  return <>
    <PageHeader eyebrow="IDENTIDAD Y PUBLICACIÓN" title="Correspondencias" description="Resolución explícita con evidencia. Revisión y publicación por fuente, mes completo y custodio; los originales se conservan." />
    <ImportResolution batches={batches.data ?? []} custodians={custodians.data ?? []} accounts={accounts.data ?? []} advisors={advisors.data ?? []} aliases={aliases.data ?? []} initialId={params.lote ?? ""} initialPage={initialPage} />
  </>;
}
