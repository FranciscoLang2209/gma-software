export const COMMISSION_STATUSES: Record<string, string> = {
  matched: "Matched · Conciliada", variance: "Variance · Diferencia", pending: "Pending · Revisión",
  missing_expected: "Sin base verificable", missing_actual: "Sin cobro comparable",
};
export const BASES: Record<string, string> = { gross: "Bruto", net: "Neto", representative_payout: "Payout representante" };
export const VIEWS: Record<string, string> = { resumen: "Resumen", representantes: "Por representante", cuentas: "Por cuenta", conciliaciones: "Conciliaciones" };
export const COMMISSION_FILTERS = ["year", "quarter", "broker", "account_id", "owner", "fee_type", "status", "basis", "min_absolute_variance", "min_absolute_percentage"] as const;
export type CommissionRow = {
  [key: string]: unknown;
  obligation_id?: string; expected_id?: string; reconciliation_id?: string; entry_id?: string;
  account_id: string; account: string | null; holder: string | null; broker: string | null; owner: string | null;
  quarter: string; cutoff: string | null; basis: string | null; status: string;
  balance: string | null; annual_rate: string | null; expected_quarterly: string | null;
  actual_received: string | null; variance: string | null; variance_percentage: string | null; verified?: boolean;
  source_file: string | null; source_sheet: string | null; source_row: string | null;
  evidence: string | null; expected_input: Record<string, unknown> | null;
  classification_id: string | null; classification_input: Record<string, unknown> | null;
  reconciliation_input: Record<string, unknown> | null;
};
export type CommissionGroup = {
  basis: string | null; owner: string | null; quarter: string | null; records: number; accounts: number;
  reconciled_accounts: number; pending: number; comparable: number; verified: number;
  balance: string | null; expected: string | null; comparable_expected: string | null;
  actual: string | null; variance: string | null; variance_percentage: string | null;
};
export type CommissionDashboard = { rows: CommissionRow[]; summary: CommissionGroup[]; owners: CommissionGroup[]; quarters: CommissionGroup[]; row_count: number; revision: string };

export function commissionFilters(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(COMMISSION_FILTERS.flatMap(key => typeof params[key] === "string" && params[key] !== "" ? [[key, params[key]]] : []));
}
export function commissionHref(params: Record<string, string | string[] | undefined>, changes: Record<string, string | null> = {}, path = "/comisiones") {
  const query = new URLSearchParams();
  for (const key of [...COMMISSION_FILTERS, "vista", "sort", "direction", "page", "detalle"]) {
    if (typeof params[key] === "string" && params[key]) query.set(key, params[key]);
  }
  for (const [key, value] of Object.entries(changes)) { if (value === null) query.delete(key); else query.set(key, value); }
  return `${path}?${query}`;
}

// Comparar decimales canónicos sin reducirlos a precisión binaria.
export function compareDecimal(left: string, right: string) {
  const [a, af = ""] = left.split("."); const [b, bf = ""] = right.split(".");
  const scale = Math.max(af.length, bf.length);
  const units = (whole: string, fraction: string) => BigInt(whole.replace("-", "") + fraction.padEnd(scale, "0")) * (whole.startsWith("-") ? -1n : 1n);
  const x = units(a, af), y = units(b, bf);
  return x < y ? -1 : x > y ? 1 : 0;
}
const numeric = new Set(["balance", "expected", "comparable_expected", "actual", "variance", "variance_percentage", "annual_rate", "expected_quarterly", "actual_received", "accounts", "pending"]);
export function commissionSort<T extends object>(rows: T[], key: string, descending: boolean) {
  return [...rows].sort((a, b) => {
    const x = (a as Record<string, unknown>)[key], y = (b as Record<string, unknown>)[key];
    // Los faltantes siempre al final, también al ordenar descendente.
    if (x == null) return y == null ? 0 : 1;
    if (y == null) return -1;
    const order = numeric.has(key) ? compareDecimal(String(x), String(y)) : String(x).localeCompare(String(y), "es");
    return descending ? -order : order;
  });
}
export function commissionCsv(report: CommissionDashboard, view: string, filters: Record<string, string>) {
  const detail = ["quarter", "basis", "broker", "account", "account_id", "holder", "owner", "cutoff", "balance", "annual_rate", "annual_rate_original", "expected_quarterly", "verified", "actual_received", "variance", "variance_percentage", "status", "obligation_id", "expected_id", "entry_id", "classification_id", "reconciliation_id", "source_file", "source_sheet", "source_row", "source_import_id", "source_hash", "evidence", "receipt_evidence", "reviewed_by", "reviewed_at"];
  const grouped = ["quarter", "owner", "basis", "accounts", "balance", "expected", "comparable_expected", "actual", "variance", "variance_percentage", "records", "verified", "comparable", "pending"];
  const rows = view === "representantes" ? report.owners : view === "resumen" ? report.quarters : report.rows;
  const columns = view === "representantes" || view === "resumen" ? grouped : detail;
  const cell = (value: unknown, key = "") => {
    let text = value == null ? "N/D" : typeof value === "object" ? JSON.stringify(value) : String(value);
    const isDecimal = numeric.has(key) && /^-?\d+(\.\d+)?$/.test(text);
    if (!isDecimal && /^(\s*[=+\-@]|[\t\r\n])/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const line = (values: unknown[], keys: string[] = []) => values.map((v, i) => cell(v, keys[i])).join(",");
  return "\uFEFF" + [line(["revisión", report.revision, "USD", "decimales canónicos; N/D nunca cero"]),
    line(["filtros", JSON.stringify(filters)]),
    line(["criterio", "Esperado verificado; actual/diferencias sólo conciliados. Porcentaje sobre esperado comparable. Balance N/D con varias fotos o componentes repetidos. Owner es referencia literal revisada, no identidad inferida."]),
    line(columns), ...rows.map(row => line(columns.map(key => key === "expected_quarterly" && (row as CommissionRow).verified !== true ? null : (row as unknown as Record<string, unknown>)[key]), columns)),
    // Los resúmenes también incluyen la evidencia que permite reconstruirlos.
    ...(columns === grouped ? [line(["detalle y procedencia"]), line(detail), ...report.rows.map(row => line(detail.map(key => key === "expected_quarterly" && row.verified !== true ? null : row[key]), detail))] : []),
  ].join("\r\n") + "\r\n";
}
