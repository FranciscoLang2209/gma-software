import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AccountScreen } from "@/components/account-screen";
import type { Search } from "@/lib/queries/presentation";
import Loading from "@/app/loading";
export const metadata: Metadata = { title: "Detalle de cuenta" };
export default async function AccountPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  return <><PageHeader eyebrow="IDENTIDAD Y PROCEDENCIA" title="Detalle de cuenta" description="Cifras publicadas, registros y asignaciones con vigencia explícita." />
    <Suspense key={id + JSON.stringify(search)} fallback={<Loading />}><AccountScreen search={search} id={id} /></Suspense></>;
}
