import { SearchSelect } from "./search-select";
import { ReferenceFilters } from "./reference-filters";
import Link from "next/link";
import { Badge, Button, Table } from "@radix-ui/themes";
import { Select } from "./ui/select";
import type { RoaMetrics, RoaReport } from "@/lib/roa/contracts";
import { FEE_STATUS, ROA_FILTERS, ROA_STATUS, roaHref } from "@/lib/roa/presentation";
import { DIMENSIONS, exact, percent, usd } from "@/lib/queries/presentation";
import type { Report } from "@/lib/queries/contracts";
import { feeReason } from "@/lib/queries/availability";

export function RoaFilters({ params, options, references }: { params: URLSearchParams; options?: Report["options"]; references?: Report["reference_options"] }) {
  return <section className="panel report-filters roa-filters" aria-label="Filtros de rentabilidad">
    <form action="/rentabilidad" className="import-form">
      <label htmlFor="roa-year">Año<input id="roa-year" name="anio" type="number" min="1900" max="9998" required defaultValue={params.get("anio") ?? ""} /></label>
      <label htmlFor="roa-quarter">Trimestre del detalle<Select id="roa-quarter" aria-label="Trimestre" name="trimestre" required defaultValue={params.get("trimestre") ?? ""}>
        <option value="">Seleccionar trimestre</option>{[1, 2, 3, 4].map(q => <option key={q} value={q}>T{q} · {q === 1 ? "Ene–Mar" : q === 2 ? "Abr–Jun" : q === 3 ? "Jul–Sep" : "Oct–Dic"}</option>)}
      </Select></label>
      {Object.entries(ROA_FILTERS).map(([key, label]) => <SearchSelect key={`${key}-${params.get(key) ?? ""}`} name={key} label={label} options={options?.[key] ?? []} selected={params.get(key) ?? ""} />)}
      <ReferenceFilters params={params} references={references} />
      <label htmlFor="roa-service">Servicio<Select id="roa-service" aria-label="Servicio" name="servicio" defaultValue={params.get("servicio") ?? ""}>
        <option value="">Todos · incluye sin clasificar</option><option value="Advisory">Advisory</option><option value="Brokerage">Brokerage</option><option value="sin_clasificar">Sin clasificar</option>
      </Select></label>
      <label htmlFor="roa-group">Desglose<Select id="roa-group" aria-label="Desglose" name="agrupar" defaultValue={params.get("agrupar") ?? "account"}>
        {Object.entries(DIMENSIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </Select></label>
      <div className="report-actions"><Button type="submit" highContrast>Aplicar filtros</Button><Link href="/rentabilidad">Limpiar filtros</Link></div>
    </form>
    <p id="roa-filter-help">Comparación T1–T4 del año elegido. El trimestre selecciona el detalle y sus opciones completas con búsqueda. Todos los filtros se combinan; vacío incluye sin asignar.</p>
  </section>;
}

export function RoaClassification({ metric }: { metric: RoaMetrics }) {
  return <Badge highContrast color={metric.classification === "Bajo" ? "red" : metric.classification === "OK" ? "amber" : metric.classification === "Muy bien" ? "green" : "gray"} variant="soft">
    {metric.classification ?? "N/D"} · {ROA_STATUS[metric.calculation_status]}
  </Badge>;
}
export function RoaCoverageFacts({ metric: m }: { metric: RoaMetrics }) {
  return <>
    <p>{m.accounts} cuentas · {m.account_months} cuenta-meses incluidos. AUM: {m.aum_values}/{m.aum_rows} filas con importe; Revenue: {m.revenue_values}/{m.revenue_rows}.</p>
    <p>Sin foto AUM: {m.missing_aum_account_months}; sin Revenue: {m.missing_revenue_account_months}; con importe nulo AUM/Revenue: {m.null_aum_account_months}/{m.null_revenue_account_months} cuenta-meses.</p>
    <p>Sin comercial/equipo/cliente: {m.unassigned_advisor_account_months}/{m.unassigned_team_account_months}/{m.unassigned_client_account_months} cuenta-meses. Permanecen en el conjunto sin esos filtros.</p>
    <p>Suma de fotos conocidas: {usd(m.aum_known_sum_usd)} · divisor fijo {m.aum_average_divisor}. {m.has_negative_aum ? "Incluye fotos negativas." : ""}</p>
  </>;
}
export function RoaMetricTable({ rows, params, report }: { rows: RoaMetrics[]; params?: URLSearchParams; report?: RoaReport }) {
  return <div className="table-scroll roa-table" role="region" tabIndex={0} aria-label={report ? "Desglose ROA, importes exactos y cobertura" : "Comparación ROA por servicio y cobertura"}>
    <Table.Root className="data-table"><Table.Header><Table.Row>
      {["Grupo", "AUM promedio · USD", "Revenue trimestral · USD", "ROA anualizado", "Tasa anual publicada", "Fee ponderado por AUM", "Diferencia · pp", "Cobertura y motivos"].map(label => <Table.ColumnHeaderCell key={label}>{label}</Table.ColumnHeaderCell>)}
    </Table.Row></Table.Header><Table.Body>{rows.map((m, i) => <Table.Row key={`${i}-${m.key}`}>
      <Table.RowHeaderCell>{report?.group_by === "account" && params && i > 0 ? <Link href={roaHref(params, { cuenta: m.key, agrupar: "account" }) + "#meses"}>{m.label} · ver tres meses</Link> : m.label === "sin_clasificar" ? "Sin clasificar" : m.label}</Table.RowHeaderCell>
      <Table.Cell className="money">{usd(m.aum_average_usd)}</Table.Cell><Table.Cell className="money">{usd(m.revenue_quarter_usd)}</Table.Cell>
      <Table.Cell>{m.roa_percent === null ? "N/D" : `${exact(m.roa_percent)} %`}<span className="roa-cell-note"><RoaClassification metric={m} /></span></Table.Cell>
      <Table.Cell>{percent(m.advisory_reference_percent)}{m.advisory_reference_percent != null && <small className="roa-cell-note">Vinculada al trimestre</small>}</Table.Cell>
      <Table.Cell>{m.advisory_fee_percent === null ? <>N/D<small className="roa-cell-note">{feeReason(m)}</small></> : `${exact(m.advisory_fee_percent)} %`}</Table.Cell><Table.Cell>{m.advisory_difference_pp === null ? "N/D" : `${exact(m.advisory_difference_pp)} pp`}</Table.Cell>
      <Table.Cell><details><summary aria-label={`Ver cobertura de ${m.label}`}>Ver cobertura</summary><RoaCoverageFacts metric={m} /><p>Tasas vinculadas: {m.advisory_rate_accounts ?? "N/D"} de {m.advisory_accounts ?? "N/D"} cuentas Advisory. La tasa individual se muestra sin requerir AUM; la ponderación requiere fotos completas.</p><p>{FEE_STATUS[m.advisory_fee_status]}. Sin tasa/obsoleta: {m.missing_rate_account_months}/{m.obsolete_rate_account_months} cuenta-meses.</p><p>Exposición Advisory: {usd(m.advisory_aum_month_sum_usd)}; con tasa: {usd(m.rate_covered_aum_month_sum_usd)}. ROA: {percent(m.roa_percent)} presentado; la clasificación proviene del cálculo exacto.</p></details></Table.Cell>
    </Table.Row>)}</Table.Body></Table.Root>
  </div>;
}
