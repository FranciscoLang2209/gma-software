import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ReportScreen } from "@/components/report-screen";
import type { Search } from "@/lib/queries/presentation";
import Loading from "@/app/loading";

export default async function SummaryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  return <>
    <PageHeader eyebrow="PANORAMA GENERAL" title="Resumen" description="AUM al cierre y Revenue del rango, con cifras que se pueden explicar." />
    <Suspense key={JSON.stringify(search)} fallback={<Loading />}><ReportScreen search={search} /></Suspense>
  </>;
}
