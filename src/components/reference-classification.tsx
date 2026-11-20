import Link from "next/link";
import { Table } from "@radix-ui/themes";
import type { Report } from "@/lib/queries/contracts";
import { dateLabel, monthLabel, reportHref, usd } from "@/lib/queries/presentation";

export function ReferenceClassification({ report, params }: { report: Report; params: URLSearchParams }) {
  const ref = report.reference_classification;
  if (!ref) return null;
  const dimensions = { client: "Cliente", advisor: "Comercial", team: "Equipo" };
  return <section className="panel report-section" id="clasificacion-ref">
    <h2>Clasificación según REF</h2>
    <p>Foto de referencias sin vigencia histórica. Publicada {dateLabel(ref.published_at)}. Vinculadas {ref.matched_accounts} de {ref.observed_accounts} cuentas con registros bajo estos filtros.</p>
    <p>Cliente: Client. Comercial: Owner Name payout, también referencia de beneficiario. Equipo: Grupo. Agrupamos etiquetas literales del archivo; no acreditan identidades de personas ni quién atendía la cuenta en cada mes.</p>
    <p>Sin etiqueta de cliente: {ref.accounts_without_client_label} cuentas. Sin comercial: {ref.accounts_without_advisor_label}. Sin equipo: {ref.accounts_without_team_label}. Las cuentas sin REF conservan sus importes en “Sin referencia”.</p>
    <nav className="report-tabs" aria-label="Etiquetas de REF">{Object.entries(dimensions).map(([key, label]) => <Link key={key} aria-current={ref.dimension === key ? "page" : undefined} href={reportHref("/analisis-comercial", params, { agrupar: key }) + "#clasificacion-ref"}>{label}</Link>)}</nav>
    <p>AUM al cierre de {monthLabel(report.period.to)} · Revenue {monthLabel(report.period.from)}–{monthLabel(report.period.to)}. Importes exactos, sujetos a cobertura. Los filtros comerciales superiores siguen usando las asignaciones con vigencia.</p>
    <details><summary>Ver importes por etiqueta de {dimensions[ref.dimension].toLowerCase()}</summary>
      <div className="table-scroll" role="region" aria-label="Importes por referencia de REF" tabIndex={0}>
        <Table.Root className="data-table"><Table.Header><Table.Row>
          {["Etiqueta de REF", "Cuentas", "AUM al cierre · USD", "Revenue del rango · USD", "Cobertura de importes"].map((label) => <Table.ColumnHeaderCell key={label}>{label}</Table.ColumnHeaderCell>)}
        </Table.Row></Table.Header><Table.Body>{ref.groups.map((g) => <Table.Row key={JSON.stringify(g.label)}>
          <Table.RowHeaderCell>{g.label ?? "Sin referencia"}</Table.RowHeaderCell><Table.Cell>{g.accounts}</Table.Cell>
          <Table.Cell className="money">{usd(g.aum_usd)}</Table.Cell><Table.Cell className="money">{usd(g.revenue_usd)}</Table.Cell>
          <Table.Cell>AUM {g.aum_values}/{g.aum_rows} · Revenue {g.revenue_values}/{g.revenue_rows}</Table.Cell>
        </Table.Row>)}</Table.Body></Table.Root>
      </div>
      {!ref.groups.length && <p>Sin registros financieros bajo estos filtros.</p>}
      {ref.group_count > ref.groups.length && <p>Se muestran {ref.groups.length} de {ref.group_count} etiquetas. Acotá cuenta, custodio o período para ver las restantes. El CSV informa la misma limitación.</p>}
    </details>
  </section>;
}
