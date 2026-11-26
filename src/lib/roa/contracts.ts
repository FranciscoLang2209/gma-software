import { REFERENCE_PARAMETERS, parseReferenceFilters, type ReferenceFilters, type ReferenceOptions } from "../queries/references.ts";
import { UUID } from "../imports/contracts.ts";
import { GROUPS, type Group } from "../queries/contracts.ts";

export const ROA_SERVICES = ["Advisory", "Brokerage", "sin_clasificar"] as const;
export type RoaParameters = {
  reference_filters?: ReferenceFilters;
  report_year: number; report_quarter: number;
  custodian: string | null; team: string | null; advisor: string | null;
  client: string | null; account: string | null; service_filter: string | null;
  group_by: Group; page_size: number; page_offset: number; expected_revision: string | null;
};
export type RoaMetrics = {
  key: string; label: string; accounts: number; account_months: number;
  aum_known_sum_usd: string | null; aum_average_divisor: 3; aum_average_usd: string | null;
  revenue_quarter_usd: string | null; roa_numerator: string | null; roa_denominator: string | null;
  roa_percent: string | null; classification: "Bajo" | "OK" | "Muy bien" | null;
  calculation_status: "calculable" | "incomplete" | "zero_aum" | "negative_aum" | "no_data" | "open_quarter";
  aum_rows: number; aum_values: number; revenue_rows: number; revenue_values: number;
  missing_aum_account_months: number; missing_revenue_account_months: number;
  null_aum_account_months: number; null_revenue_account_months: number;
  unassigned_advisor_account_months: number; unassigned_team_account_months: number; unassigned_client_account_months: number;
  has_negative_aum: boolean; advisory_fee_percent: string | null; advisory_difference_pp: string | null;
  advisory_reference_percent: string | null; advisory_accounts: number; advisory_rate_accounts: number;
  advisory_rate_version_id: string | null;
  advisory_fee_numerator: string | null; advisory_fee_denominator: string | null; advisory_difference_numerator: string | null;
  advisory_fee_status: "not_applicable" | "verified_reference" | "obsolete" | "insufficient_coverage";
  advisory_aum_month_sum_usd: string | null; rate_covered_aum_month_sum_usd: string | null;
  missing_rate_account_months: number; obsolete_rate_account_months: number;
};
export type RoaReport = {
  availability?: import("../queries/availability.ts").Availability;
  reference_filters?: ReferenceFilters | Record<string, never>;
  reference_options?: ReferenceOptions | null;
  revision: string; formula_version: "quarterly_roa_v1";
  period: { year: number; quarter: number; from: string; to: string; closed: boolean };
  filters: Record<string, string | null>; attribution: "month_end";
  dimension_basis: "current_client_and_service_without_history";
  revenue_basis: string; assessment_basis: "observed_only_provisional"; coverage_basis: string;
  published_at: string | null; total: RoaMetrics; rows: RoaMetrics[]; services: RoaMetrics[];
  group_by: Group; row_count: number; offset: number; limit: number;
  months: {
    period: string; aum_known_usd: string | null; revenue_known_usd: string | null;
    included_account_months: number; missing_aum_account_months: number; missing_revenue_account_months: number;
    aum_rows: number | null; aum_values: number | null; revenue_rows: number | null; revenue_values: number | null;
  }[];
  coverage: { period: string; custodian_id: string; source: "aum" | "revenue"; published: boolean }[];
  service_coverage_before_filter: {
    accounts: number; unclassified_accounts: number;
    unclassified_aum_month_sum_usd: string | null; unclassified_revenue_usd: string | null;
  };
};

export function parseRoaParameters(params: URLSearchParams): RoaParameters {
  const allowed = ["anio", "trimestre", "custodio", "equipo", "comercial", "cliente", "cuenta", "servicio", "agrupar", "limite", "offset", "revision", ...REFERENCE_PARAMETERS];
  for (const key of params.keys()) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1) throw new Error("Filtro desconocido o repetido.");
  }
  const integer = (key: string, min: number, max: number, fallback?: number) => {
    const raw = params.get(key);
    if (raw === null && fallback !== undefined) return fallback;
    if (raw === null || !/^\d{1,7}$/.test(raw) || Number(raw) < min || Number(raw) > max)
      throw new Error("Año, trimestre o paginación fuera de los límites permitidos.");
    return Number(raw);
  };
  const uuid = (key: string) => {
    const value = params.get(key);
    if (value !== null && !UUID.test(value)) throw new Error("Los filtros de entidades deben ser UUID.");
    return value;
  };
  const service = params.get("servicio");
  if (service !== null && !ROA_SERVICES.includes(service as typeof ROA_SERVICES[number])) throw new Error("Servicio no permitido.");
  const group = params.get("agrupar") ?? "account";
  if (!GROUPS.includes(group as Group)) throw new Error("Desglose no permitido.");
  const revision = params.get("revision");
  if (revision !== null && !/^[a-f\d]{32}$/.test(revision)) throw new Error("Revisión inválida.");
  const offset = integer("offset", 0, 1000000, 0);
  if (offset > 0 && revision === null) throw new Error("Las páginas siguientes requieren revisión.");
  const references = parseReferenceFilters(params);
  return {
    ...(references ? { reference_filters: references } : {}),
    report_year: integer("anio", 1900, 9998), report_quarter: integer("trimestre", 1, 4),
    custodian: uuid("custodio"), team: uuid("equipo"), advisor: uuid("comercial"), client: uuid("cliente"), account: uuid("cuenta"),
    service_filter: service, group_by: group as Group, page_size: integer("limite", 1, 250, 25), page_offset: offset, expected_revision: revision,
  };
}

export type RoaRatePublication = { request_id: string; source_event_id: string; expected_rate_id: string | null; evidence: string };
export function parseRoaRatePublication(value: unknown): RoaRatePublication {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Publicación inválida.");
  const input = value as Record<string, unknown>;
  const keys = ["request_id", "source_event_id", "expected_rate_id", "evidence"];
  if (Object.keys(input).length !== keys.length || Object.keys(input).some(key => !keys.includes(key))
    || typeof input.request_id !== "string" || !UUID.test(input.request_id)
    || typeof input.source_event_id !== "string" || !UUID.test(input.source_event_id)
    || (input.expected_rate_id !== null && (typeof input.expected_rate_id !== "string" || !UUID.test(input.expected_rate_id)))
    || typeof input.evidence !== "string" || !input.evidence.trim() || [...input.evidence].length > 10000)
    throw new Error("Se requieren UUID, versión anterior explícita y evidencia de comparabilidad.");
  return input as RoaRatePublication;
}
