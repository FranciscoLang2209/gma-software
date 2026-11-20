import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RoaScreen } from "@/components/roa-screen";
import type { Search } from "@/lib/queries/presentation";
import Loading from "@/app/loading";

export const metadata: Metadata = { title: "Rentabilidad / ROA" };
export default async function RoaPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  return <>
    <PageHeader eyebrow="ROA TRIMESTRAL" title="Rentabilidad / ROA" description="AUM promedio, Revenue trimestral y ROA anualizado sobre datos publicados en USD." />
    <Suspense key={JSON.stringify(search)} fallback={<Loading />}><RoaScreen search={search} /></Suspense>
  </>;
}
