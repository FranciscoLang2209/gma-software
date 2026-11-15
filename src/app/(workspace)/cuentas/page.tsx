import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AccountScreen } from "@/components/account-screen";
import type { Search } from "@/lib/queries/presentation";
import Loading from "@/app/loading";
export const metadata: Metadata = { title: "Cuentas" };
export default async function AccountsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  return <><PageHeader eyebrow="RELACIONES Y COBERTURA" title="Cuentas" description="Identidad, datos publicados y atribución histórica por cuenta." />
    <Suspense key={JSON.stringify(search)} fallback={<Loading />}><AccountScreen search={search} /></Suspense></>;
}
