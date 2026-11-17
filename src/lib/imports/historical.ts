import { HEADERS, validateSourceReview, type SourceReview, type Book, type Issue, type Options, type RawRow, type Report } from "./contracts.ts";
import { prepare } from "./validate.ts";

export type Custodian = { id: string; code: string; name?: string };
export type ReferenceFile = {
  fileName: string; fileHash: string; fileSize: number; sheet: string; headerRow: number;
  pairs: { holding: string; account: string; custodianCode: string; row: number }[];
  errors: Issue[];
};
export type HistoricalOptions = Omit<Options, "period"> & {
  multiCustodian?: boolean; headerRow?: number; excludedRows?: number[]; exclusionReason?: string;
  custodians?: Custodian[]; references?: ReferenceFile;
  sourceReview?: SourceReview;
};
const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
export function historicalHeader(sheet: Book["sheets"][number], source: Options["source"], explicit = 0) {
  if (!Number.isInteger(explicit) || explicit < 0 || explicit > 100) throw new Error("Fila de encabezados inválida (1 a 100, o vacío para detectar).");
  const candidates = sheet.rows.filter((r) => explicit ? r.number === explicit : r.number <= 20).filter((row) =>
    HEADERS[source].every((h) => row.cells.some((c) => normalize(c.value ?? "") === normalize(h))));
  if (candidates.length !== 1) throw new Error("No se detectó un encabezado único. Indicá su fila y verificá las columnas requeridas.");
  return candidates[0];
}
export function referencePairs(book: Book, sheetName: string) {
  const sheet = book.sheets.find((s) => s.name === sheetName);
  if (!sheet) throw new Error("Elegí la hoja de REF.");
  const header = historicalHeader(sheet, "fa");
  const cell = (r: RawRow, name: string) => r.cells[header.cells.findIndex((c) => normalize(c.value ?? "") === normalize(name))];
  const pairs: ReferenceFile["pairs"] = [], errors: Issue[] = [];
  for (const r of sheet.rows.filter((r) => r.number > header.number)) {
    if (r.cells.every((c) => !c.value && c.formula === undefined)) continue;
    const fields = ["ACC # Addepar", "ACCOUNT", "Broker"].map((h) => cell(r, h));
    if (fields.some((c) => !c?.value?.trim() || c.kind === "e" || c.formula !== undefined)) {
      errors.push({ code: "reference_fields", message: `REF fila ${r.number}: faltan referencias literales de cuenta/custodio.` }); continue;
    }
    pairs.push({ holding: fields[0].value!, account: fields[1].value!, custodianCode: fields[2].value!, row: r.number });
  }
  return { sheet: sheet.name, headerRow: header.number, pairs, errors };
}
export function prepareHistorical(book: Book, options: HistoricalOptions) {
  const sourceReview = validateSourceReview(options.sourceReview);
  if (options.source !== "aum" && !(options.multiCustodian && options.source === "revenue")) throw new Error("La historia admite AUM, o Revenue con varios custodios.");
  const sheet = book.sheets.find((s) => s.name === options.sheet);
  if (!sheet) throw new Error("Elegí una hoja existente.");
  const header = options.multiCustodian ? historicalHeader(sheet, options.source, options.headerRow) : sheet.rows[0];
  const headerReport = prepare({ sheets: [{ ...sheet, rows: [header] }] }, { ...options, period: "1900-01-01" });
  const index = (name: string) => headerReport.headers.findIndex((h) => h.canonical === name);
  const value = (r: RawRow, name: string) => r.cells[index(name)]?.value ?? "";
  const errors = headerReport.errors.filter((e) => e.code !== "empty_file");
  if (options.multiCustodian && options.source === "aum") {
    if (!options.references) errors.push({ code: "references_required", message: "Adjuntá REF para identificar cada custodio de AUM." });
    else errors.push(...options.references.errors);
  }
  const excluded = new Set(options.excludedRows ?? []);
  if ([...excluded].some((n) => !Number.isInteger(n) || n <= header.number || !sheet.rows.some((r) => r.number === n)) || (excluded.size && (!options.multiCustodian || (options.exclusionReason?.trim().length ?? 0) < 3)))
    throw new Error("Revisá las filas excluidas y registrá un motivo. No se permite excluir encabezados o filas inexistentes.");
  const financialFields = options.source === "aum" ? HEADERS.aum.filter((h) => h !== "Top Level Holding Account") : HEADERS.revenue.filter((h) => h !== "CUSTODIO");
  if (sheet.rows.some((r) => excluded.has(r.number) && financialFields.some((h) => value(r, h).trim())))
    throw new Error("No se permite excluir filas con cuenta, período o importe. Corregí los datos y conservá el alcance completo.");
  const groups = new Map<string, { period: string; custodian: Custodian; rows: RawRow[] }>();
  const unroutable: { row: RawRow; message: string }[] = [];
  const references = new Map<string, ReferenceFile["pairs"]>();
  for (const p of options.references?.pairs ?? []) {
    const key = JSON.stringify([p.holding, p.account]); references.set(key, [...(references.get(key) ?? []), p]);
  }
  let blankRows = 0;
  for (const row of sheet.rows.filter((r) => r.number > header.number)) {
    if (excluded.has(row.number)) continue;
    if (row.cells.every((c) => !c.value && c.formula === undefined)) { blankRows++; continue; }
    const month = value(row, options.source === "aum" ? "mes" : "MES").trim();
    const year = value(row, options.source === "aum" ? "año" : "AÑO").trim();
    if (!/^(0?[1-9]|1[0-2])$/.test(month) || !/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2200) {
      unroutable.push({ row, message: "Mes/año ausente o inválido; revisá la fila, no se descarta automáticamente." }); continue;
    }
    let custodian: Custodian = { id: options.custodianId, code: options.custodianCode };
    if (options.multiCustodian) {
      let code = value(row, "CUSTODIO");
      if (options.source === "aum") {
        const matches = references.get(JSON.stringify([value(row, "Holding Account Number"), value(row, "Account Number bd_REV")])) ?? [];
        const codes = new Set(matches.map((p) => normalize(p.custodianCode)));
        if (codes.size !== 1) { unroutable.push({ row, message: "Par de cuentas sin custodio único en REF. No se une por nombre ni por un solo número." }); continue; }
        code = matches[0].custodianCode;
      }
      const matches = (options.custodians ?? []).filter((c) => normalize(c.code) === normalize(code));
      if (matches.length !== 1) { unroutable.push({ row, message: `Custodio «${code || "vacío"}» sin un registro único en Configuración. Registralo y volvé a analizar.` }); continue; }
      custodian = matches[0];
    }
    const period = `${year}-${month.padStart(2, "0")}-01`, key = `${period}/${custodian.id}`;
    const group = groups.get(key) ?? { period, custodian, rows: [] };
    group.rows.push(row); groups.set(key, group);
  }
  const partitions = [...groups.values()].sort((a, b) => a.period.localeCompare(b.period) || a.custodian.id.localeCompare(b.custodian.id)).map(({ period, custodian, rows }) => ({
    period, custodianId: custodian.id, custodianCode: custodian.code,
    report: prepare({ sheets: [{ ...sheet, rows: [header, ...rows] }] }, { ...options, period, custodianId: custodian.id, custodianCode: custodian.code }, sourceReview),
  }));
  if (partitions.length > 1024 || partitions.some((p) => p.report.rows.length > 5000)) throw new Error("Máximo 1.024 alcances y 5.000 filas por mes/custodio. Dividí por alcances completos.");
  if (!partitions.length) errors.push({ code: "empty_history", message: "No hay alcances válidos. No se certifica ningún mes como cero." });
  const manifest = {
    ...(sourceReview ? { sourceReview, exceptionSummary: summarizeExceptions(partitions) } : {}),
    parserVersion: options.multiCustodian ? 3 : 2,
    sheet: sheet.name, headerRow: header.number,
    preamble: sheet.rows.filter((r) => r.number < header.number),
    excludedRows: sheet.rows.filter((r) => excluded.has(r.number)), exclusionReason: options.exclusionReason ?? null,
    excludedSheets: book.sheets.filter((s) => s !== sheet).map((s) => s.name), blankRows, errors,
    unroutable: unroutable.map(({ row: r, message }) => ({ sheet: sheet.name, row: r.number, cells: r.cells, errors: [{ code: "unroutable_row", message }] })),
    partitions: partitions.map(({ period, custodianId, custodianCode, report }) => ({
      period, custodianId, custodianCode,
      coordinates: report.rows.map((r) => ({ sheet: r.sheet_name, row: r.row_number, fingerprint: r.cell_metadata.fingerprint })),
      summary: reportSummary(report, book),
    })),
  };
  return { partitions, manifest };
}
function summarizeExceptions(partitions: { custodianId: string; report: Report }[]) {
  const groups = new Map<string, { severity: "error" | "warning"; code: string; column: string; message: string; count: number; accounts: Set<string>; rows: number[] }>();
  for (const p of partitions) for (const row of p.report.rows) for (const severity of ["error", "warning"] as const) {
    for (const issue of severity === "error" ? row.errors : row.cell_metadata.warnings) {
      const key = JSON.stringify([severity, issue.code, issue.column]);
      const group = groups.get(key) ?? { severity, code: issue.code, column: issue.column ?? "", message: issue.message, count: 0, accounts: new Set<string>(), rows: [] };
      group.count++; group.accounts.add(JSON.stringify([p.custodianId, row.cell_metadata.account]));
      if (group.rows.length < 25) group.rows.push(row.row_number);
      groups.set(key, group);
    }
  }
  return [...groups.values()].map(({ accounts, ...group }) => ({ ...group, accounts: accounts.size }));
}
export function reportSummary(report: Report, book: Book) {
  return {
    rowCount: report.rows.length, blockingErrors: report.blockingErrors,
    total: report.total, valueCount: report.valueCount, missingValues: report.missingValues,
    distinctAccounts: report.distinctAccounts, duplicateRows: report.duplicateRows,
    duplicateAccounts: report.rows.filter((r) => r.errors.some((e) => e.code === "aum_duplicate")).length,
    errors: report.errors, warnings: report.warnings, headers: report.headers,
    sheets: book.sheets.map((s) => s.name),
  };
}
