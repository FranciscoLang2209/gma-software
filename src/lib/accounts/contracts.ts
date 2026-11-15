import type { Report } from "../queries/contracts.ts";
import { screenParameters, type Search } from "../queries/presentation.ts";

export type AccountRow = {
  id: string; custodian_id: string; custodian: string; client_id: string | null; client: string | null;
  identifier: string; identifier_source: string | null; identifier_namespace: string | null;
  advisor_id: string | null; advisor: string | null; team_id: string | null; team: string | null;
  service: string; active: boolean; assignment_changed: boolean;
  aum_usd: string | null; revenue_usd: string | null; aum_rows: number; aum_values: number; revenue_rows: number; revenue_values: number;
};
export type Directory = { revision: string; report: Report; rows: AccountRow[]; row_count: number; offset: number; limit: number };
export type Provenance = { batch_id: string; import_row_id: string; version: number; published_at: string; published_by: string };
export type AccountDetail = {
  revision: string; account: AccountRow; report: Report;
  identifiers: { source: string; namespace: string; value_original: string; custodian_id: string; source_row_id: string | null }[];
  months: { account_id: string; period: string; advisor: string | null; team: string | null; aum_usd: string | null; revenue_usd: string | null;
    aum_rows: number; aum_values: number; revenue_rows: number; revenue_values: number; matches_filters: boolean }[];
  aum: (Provenance & { period: string; amount_usd: string | null })[];
  assignments: { id: string; advisor_id: string | null; advisor: string | null; valid_from: string; valid_to: string | null; source: string; batch_id: string | null; source_row_id: string | null }[];
  memberships: { id: string; advisor_id: string; advisor: string; group_id: string; team: string; valid_from: string; valid_to: string | null }[];
  records: (Provenance & { id: string; period: string; amount_usd: string | null;
    original: { cells: Record<string, string | null>; headers?: {position:number;original:string|null;canonical:string|null}[] | null; file: string; sheet: string; row: number } | null })[];
  record_count: number; offset: number; limit: number;
};
export function accountParameters(search: Search) {
  const { buscar, orden, ...filters } = search;
  if (Array.isArray(buscar) || Array.isArray(orden) || (buscar?.length ?? 0) > 200 ||
    (orden && !["identifier", "client", "aum", "revenue"].includes(orden))) throw new Error("Búsqueda u orden inválidos.");
  const parsed = screenParameters(filters, false);
  if (parsed.parameters.group_by !== "account") throw new Error("El directorio se agrupa por cuenta.");
  const { month_from, month_to, custodian, team, advisor, client, account, service_filter, page_size, page_offset, expected_revision } = parsed.parameters;
  const parameters = { month_from, month_to, custodian, team, advisor, client, account, service_filter, page_size, page_offset, expected_revision };
  const searchText = buscar ?? "", sortBy = orden || "identifier";
  parsed.params.set("buscar", searchText); parsed.params.set("orden", sortBy);
  return { params: parsed.params, parameters: { ...parameters, search_text: searchText, sort_by: sortBy } };
}
export function accountHref(path: string, params: URLSearchParams, changes: Record<string, string | null> = {}) {
  const next = new URLSearchParams(params);
  next.delete("revision"); next.delete("offset"); next.delete("agrupar");
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) next.delete(key); else next.set(key, value);
  }
  return `${path}?${next}`;
}
