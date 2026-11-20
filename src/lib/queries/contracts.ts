export const GROUPS = ["account", "custodian", "team", "advisor", "client", "service"] as const;
export type Group = (typeof GROUPS)[number];
export type ReportParameters = {
  month_from: string;
  month_to: string;
  custodian: string | null;
  team: string | null;
  advisor: string | null;
  client: string | null;
  account: string | null;
  service_filter: string | null;
  group_by: Group;
  page_size: number;
  page_offset: number;
  expected_revision: string | null;
};
export type Metrics = {
  key: string;
  label: string;
  aum_share_percent?: string | null;
  revenue_share_percent?: string | null;
  aum_usd: string | null;
  revenue_usd: string | null;
  aum_rows: number;
  aum_values: number;
  revenue_rows: number;
  revenue_values: number;
  accounts_with_aum: number;
  clients_with_aum: number;
  aum_accounts_without_client: number;
  accounts_with_revenue: number;
  aum_missing_accounts: number;
  revenue_missing_account_months: number;
  aum_accounts_without_advisor: number;
  revenue_accounts_without_advisor: number;
  aum_accounts_without_team: number;
  revenue_accounts_without_team: number;
  aum_without_advisor_usd: string | null;
  revenue_without_advisor_usd: string | null;
};
export type Report = {
  reference_classification?: {
    snapshot_id: string; published_at: string; basis: "REF_snapshot_without_historical_validity";
    dimension: "client" | "advisor" | "team"; observed_accounts: number; matched_accounts: number;
    accounts_without_client_label: number; accounts_without_advisor_label: number; accounts_without_team_label: number;
    aum_client_labels: number; group_count: number;
    groups: { label: string | null; accounts: number; aum_usd: string | null; revenue_usd: string | null;
      aum_rows: number; aum_values: number; revenue_rows: number; revenue_values: number }[];
  } | null;
  published_at?: string | null;
  options?: Record<string, { id: string; label: string }[]>;
  revision: string;
  period: { from: string; to: string; aum_closing_month: string };
  filters: Record<string, string | null>;
  attribution: "month_end";
  coverage_basis: string;
  total: Metrics;
  months: (Partial<Metrics> & {
    period: string;
    previous_period: string;
    aum_change_usd: string | null;
    aum_change_percent: string | null;
    revenue_change_usd: string | null;
    revenue_change_percent: string | null;
  })[];
  coverage: { period: string; custodian_id: string; source: "aum" | "revenue"; published: boolean }[];
  group_by: Group;
  row_count: number;
  offset: number;
  limit: number;
  rows: Metrics[];
};

export function parseReportParameters(params: URLSearchParams): { parameters: ReportParameters; format: "json" | "csv" | "csv-completo" } {
  const allowed = ["desde", "hasta", "custodio", "equipo", "comercial", "cliente", "cuenta", "servicio", "agrupar", "limite", "offset", "revision", "formato"];
  for (const key of params.keys()) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1)
      throw new Error("Filtro desconocido o repetido.");
  }
  const month = (name: string) => {
    const value = params.get(name);
    if (!value || !/^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/.test(value) || value > "9998-12")
      throw new Error("Indicá desde y hasta como AAAA-MM, entre 1900 y 9998.");
    return `${value}-01`;
  };
  const from = month("desde"), to = month("hasta");
  const monthNumber = (v: string) => Number(v.slice(0, 4)) * 12 + Number(v.slice(5, 7));
  if (to < from || monthNumber(to) - monthNumber(from) >= 120)
    throw new Error("El rango debe estar ordenado y abarcar hasta 120 meses.");
  const uuid = (name: string) => {
    const value = params.get(name);
    if (value !== null && !/^[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value))
      throw new Error("Los filtros de entidades deben ser UUID.");
    return value;
  };
  const integer = (name: string, fallback: number, min: number, max: number) => {
    const raw = params.get(name);
    if (raw === null) return fallback;
    if (!/^\d{1,7}$/.test(raw) || Number(raw) < min || Number(raw) > max)
      throw new Error("Paginación fuera de los límites permitidos.");
    return Number(raw);
  };
  const group = params.get("agrupar") ?? "account";
  if (!GROUPS.includes(group as Group)) throw new Error("Desglose no permitido.");
  const format = params.get("formato") ?? "json";
  if (format !== "json" && format !== "csv" && format !== "csv-completo") throw new Error("Formato no permitido.");
  const service = params.get("servicio"), revision = params.get("revision");
  if (service !== null && (!service.trim() || service.length > 200)) throw new Error("Servicio inválido.");
  if (revision !== null && !/^[a-f\d]{32}$/.test(revision)) throw new Error("Revisión inválida.");
  const offset = integer("offset", 0, 0, 1000000);
  if (format === "csv-completo" && offset !== 0) throw new Error("La exportación completa comienza en la primera fila.");
  if (offset > 0 && revision === null) throw new Error("Las páginas siguientes requieren la revisión del primer resultado.");
  return {
    parameters: {
      month_from: from, month_to: to, custodian: uuid("custodio"), team: uuid("equipo"),
      advisor: uuid("comercial"), client: uuid("cliente"), account: uuid("cuenta"), service_filter: service,
      group_by: group as Group, page_size: integer("limite", 100, 1, 250), page_offset: offset, expected_revision: revision,
    },
    format,
  };
}

// NULL es N/D; los importes se serializan sin conversión binaria ni prefijos de texto.
export function reportCsv(report: Report): string {
  const filterNames: Record<string, string> = { custodian: "custodio", team: "equipo", advisor: "comercial", client: "cliente", account: "cuenta", service: "servicio" };
  const cell = (value: string | number | boolean | null | undefined, numeric = false) => {
    let text = value == null ? "N/D" : String(value);
    if (!numeric && /^(?:[\s\u0000-\u001f]*[=+\-@＝＋－＠]|[\t\r\n])/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const row = (values: (string | number | boolean | null | undefined)[], numeric: number[] = []) =>
    values.map((value, i) => cell(value, numeric.includes(i))).join(",");
  const metricRow = (kind: string, m: Metrics) => row([kind, m.key, m.label, m.aum_usd, m.revenue_usd,
    m.aum_rows, m.aum_values, m.revenue_rows, m.revenue_values, m.accounts_with_aum, m.clients_with_aum,
    m.accounts_with_revenue, m.aum_missing_accounts, m.revenue_missing_account_months,
    m.aum_accounts_without_advisor, m.revenue_accounts_without_advisor,
    m.aum_accounts_without_client, m.aum_accounts_without_team, m.revenue_accounts_without_team,
    m.aum_without_advisor_usd, m.revenue_without_advisor_usd, m.aum_share_percent, m.revenue_share_percent], [3, 4, 19, 20, 21, 22]);
  const lines = [
    row(["desde", report.period.from, "hasta", report.period.to, "cierre_AUM", report.period.aum_closing_month]),
    row(["revision", report.revision, "desglose", report.group_by, "offset", report.offset, "filas_totales", report.row_count, "filas_exportadas", report.rows.length]),
    row(["publicado_en", report.published_at, "moneda", "USD", "decimales", "Punto decimal, sin separador de miles; importar sin convertir a precisión reducida."]),
    ...Object.entries(report.filters).map(([key, value]) => row(["filtro", filterNames[key] ?? key, value ?? "Todos", report.options?.[filterNames[key] ?? key]?.find((o) => o.id === value)?.label])),
    row(["definiciones", "AUM: foto exclusivamente del último mes seleccionado, sin sumar meses ni arrastrar saldos. Revenue: SUM(Payout broker) en USD del rango inclusivo; no es ganancia neta. Atribución al cierre de cada mes dentro de vigencias [desde,hasta)."]),
    row(["definiciones", "N/D: información ausente, nunca cero. Importes conocidos sujetos a cobertura; faltantes y sin asignar permanecen en los totales. Cliente y servicio usan la clasificación actual sin historia modelada."]),
    row(["definiciones", "Cuentas con AUM/Revenue: con registros, incluso cero o importe ausente. Clientes con AUM: distintos conocidos al cierre. Conteos distintos no aditivos entre grupos. Filas y valores indican registros totales y con importe."]),
    row(["definiciones", "Variaciones contra el mes calendario anterior con población comparable e importes presentes; no son rendimiento. Porcentaje N/D si falta base o es cero. Participaciones sobre el conjunto filtrado, N/D con negativos, importes ausentes o total no positivo."]),
    row(["definiciones", "Cobertura: universo observado del rango y mes anterior; cobertura esperada sin confirmar. Publicado no acredita completitud. Textos protegidos con apóstrofo; importes numéricos sin alterar."]),
    row(["cobertura", report.coverage_basis]),
    row(["tipo", "clave", "etiqueta", "AUM_USD", "Revenue_USD", "filas_AUM", "valores_AUM", "filas_Revenue", "valores_Revenue", "cuentas_con_AUM", "clientes_con_AUM", "cuentas_con_Revenue", "cuentas_sin_AUM", "cuenta_meses_sin_Revenue", "cuentas_AUM_sin_comercial", "cuentas_Revenue_sin_comercial", "cuentas_AUM_sin_cliente", "cuentas_AUM_sin_equipo", "cuentas_Revenue_sin_equipo", "AUM_sin_comercial_USD", "Revenue_sin_comercial_USD", "participacion_AUM_porcentaje", "participacion_Revenue_porcentaje"]),
    metricRow("total", report.total),
    ...report.rows.map((m) => metricRow("fila", m)),
    row(["mes", "AUM_USD", "Revenue_USD", "variacion_AUM_USD", "variacion_AUM_porcentaje", "variacion_Revenue_USD", "variacion_Revenue_porcentaje"]),
    ...report.months.map((m) => row([m.period, m.aum_usd, m.revenue_usd, m.aum_change_usd, m.aum_change_percent, m.revenue_change_usd, m.revenue_change_percent], [1, 2, 3, 4, 5, 6])),
    row(["mes_cobertura", "custodio", "fuente", "publicado"]),
    ...report.coverage.map((c) => row([c.period, c.custodian_id, c.source, c.published])),
    ...(report.reference_classification ? [
      row(["clasificacion_REF", report.reference_classification.snapshot_id, report.reference_classification.published_at,
        "Snapshot sin vigencia histórica. Agrupa etiquetas literales de origen, no identidades de personas o clientes."]),
      row(["REF_cuentas_observadas", report.reference_classification.observed_accounts, "REF_cuentas_vinculadas", report.reference_classification.matched_accounts]),
      row(["REF_dimension", report.reference_classification.dimension, "grupos_totales", report.reference_classification.group_count, "grupos_exportados", report.reference_classification.groups.length]),
      row(["REF_etiqueta", "cuentas", "AUM_cierre_USD", "Revenue_rango_USD", "filas_AUM", "importes_AUM", "filas_Revenue", "importes_Revenue"]),
      ...report.reference_classification.groups.map((g) => row([g.label ?? "Sin referencia", g.accounts, g.aum_usd, g.revenue_usd, g.aum_rows, g.aum_values, g.revenue_rows, g.revenue_values], [2, 3])),
    ] : []),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
