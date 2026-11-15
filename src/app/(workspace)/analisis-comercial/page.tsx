import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ReportScreen } from "@/components/report-screen";
import type { Search } from "@/lib/queries/presentation";
import Loading from "@/app/loading";

export const metadata: Metadata = { title: "Análisis comercial" };
export default async function CommercialPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  return <>
    <PageHeader eyebrow="DISTRIBUCIÓN DEL NEGOCIO" title="Análisis comercial" description="Distribución por custodio y rankings por equipo, comercial y cliente." />
    <Suspense key={JSON.stringify(search)} fallback={<Loading />}><ReportScreen search={search} commercial /></Suspense>
  </>;
}
