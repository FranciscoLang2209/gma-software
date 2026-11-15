export const HEADERS = {
  aum: [
    "Top Level Holding Account",
    "Holding Account Number",
    "Account Number bd_REV",
    "Value (USD)",
    "mes",
    "año",
  ],
  revenue: [
    "CUSTODIO",
    "MES",
    "AÑO",
    "ACCOUNT",
    "NAME",
    "Advisor Name",
    "ADV NAME SEC",
    "Rel. 2nd",
    "Nacho GMA",
    "IP",
    "IP PAYMENT",
    "PAGO OK",
    "B/S",
    "ASSET",
    "QUANTITY",
    "DESCRIPTION",
    "CUSIP",
    "PRICE",
    "TICKET",
    "TICKET (O)",
    "SERVICE CHARGE",
    "GROSS",
    "TOTAL",
    "Payout broker",
    "Payout Medina base",
    "Final payout Medina %",
    "Payout Medina",
    "% Payout REP",
    "NET Payout REP",
  ],
  fa: [
    "ACC # Addepar",
    "ACCOUNT",
    "Owner Name payout",
    "Grupo",
    "OLD Owner Name payout",
    "Client",
    "Broker",
  ],
} as const;
export type Source = keyof typeof HEADERS;
export type NumericFormat = "undefined" | "dot" | "comma";
export const LIMITS = {
  bytes: 2 * 1024 * 1024,
  expanded: 12 * 1024 * 1024,
  rows: 5000,
  columns: 64,
  sheets: 10,
  cell: 4096,
  chunk: 250,
  chunkBytes: 1024 * 1024,
} as const;
export type Options = {
  source: Source;
  period: string;
  custodianId: string;
  custodianCode: string;
  sheet: string;
  numericFormat: NumericFormat;
  delimiter: "," | ";" | "\t";
};
export type Cell = {
  value: string | null;
  kind: string;
  formula?: string;
  cached?: boolean;
  style?: string;
};
export type RawRow = { number: number; cells: Cell[] };
export type Book = { sheets: { name: string; rows: RawRow[] }[] };
export type Issue = { code: string; column?: string; message: string };
export type PreparedRow = {
  sheet_name: string;
  row_number: number;
  original_cells: Record<string, string | null>;
  cell_metadata: {
    cells: Cell[];
    account: string | null;
    amount: string | null;
    period: string;
    fingerprint: string;
    warnings: Issue[];
  };
  status: "valid" | "error";
  errors: Issue[];
};
export type Report = {
  rows: PreparedRow[];
  headers: {
    position: number;
    original: string | null;
    canonical: string | null;
  }[];
  errors: Issue[];
  warnings: Issue[];
  distinctAccounts: number;
  total: string | null;
  valueCount: number;
  missingValues: number;
  duplicateRows: number;
  blockingErrors: number;
};
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateOptions(value: unknown): Options {
  const o = value as Options;
  if (
    !o ||
    !(o.source === "aum" || o.source === "revenue" || o.source === "fa") ||
    !/^\d{4}-(0[1-9]|1[0-2])-01$/.test(o.period) ||
    Number(o.period.slice(0, 4)) < 1900 ||
    Number(o.period.slice(0, 4)) > 2200 ||
    !UUID.test(o.custodianId) ||
    typeof o.custodianCode !== "string" ||
    !o.custodianCode.trim() ||
    o.custodianCode.length > 100 ||
    typeof o.sheet !== "string" ||
    o.sheet.length > 100 ||
    !["undefined", "dot", "comma"].includes(o.numericFormat) ||
    ![",", ";", "\t"].includes(o.delimiter)
  )
    throw new Error("Revisá fuente, hoja, período, custodio y formatos.");
  return {
    source: o.source,
    period: o.period,
    custodianId: o.custodianId,
    custodianCode: o.custodianCode,
    sheet: o.sheet,
    numericFormat: o.numericFormat,
    delimiter: o.delimiter,
  };
}
