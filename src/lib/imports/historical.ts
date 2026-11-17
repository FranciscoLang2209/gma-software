import type { Book, Options, RawRow, Report } from "./contracts.ts";
import { prepare } from "./validate.ts";

export type HistoricalOptions = Omit<Options, "period">;
export function prepareHistorical(book: Book, options: HistoricalOptions) {
  if (options.source !== "aum") throw new Error("La historia admite únicamente AUM.");
  const sheet = book.sheets.find((s) => s.name === options.sheet);
  if (!sheet) throw new Error("Elegí una hoja existente.");
  // El validador existente acredita los headers y conserva posiciones originales.
  const headerReport = prepare({ sheets: [{ ...sheet, rows: sheet.rows.slice(0, 1) }] }, { ...options, period: "1900-01-01" });
  const index = (name: string) => headerReport.headers.findIndex((h) => h.canonical === name);
  const groups = new Map<string, RawRow[]>();
  const unroutable: RawRow[] = [];
  let blankRows = 0;
  for (const row of sheet.rows.slice(1)) {
    if (row.cells.every((c) => !c.value && c.formula === undefined)) { blankRows++; continue; }
    const month = row.cells[index("mes")]?.value?.trim();
    const year = row.cells[index("año")]?.value?.trim();
    if (!month || !/^(0?[1-9]|1[0-2])$/.test(month) || !year || !/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2200) {
      unroutable.push(row); continue;
    }
    const period = `${year}-${month.padStart(2, "0")}-01`;
    const group = groups.get(period) ?? [];
    group.push(row); groups.set(period, group);
  }
  const partitions = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([period, rows]) => {
    const report = prepare({ sheets: [{ ...sheet, rows: [sheet.rows[0], ...rows] }] }, { ...options, period });
    return { period, report };
  });
  const errors = headerReport.errors.filter((e) => e.code !== "empty_file");
  if (!partitions.length) errors.push({ code: "empty_history", message: "No hay períodos válidos. No se certifica ningún mes como cero." });
  const manifest = {
    parserVersion: 2,
    sheet: sheet.name,
    excludedSheets: book.sheets.filter((s) => s !== sheet).map((s) => s.name),
    blankRows,
    errors,
    unroutable: unroutable.map((r) => ({ sheet: sheet.name, row: r.number, cells: r.cells, errors: [{ code: "invalid_period", message: "Mes/año ausente o inválido; bloquea toda la carga." }] })),
    partitions: partitions.map(({ period, report }) => ({
      period,
      coordinates: report.rows.map((r) => ({ sheet: r.sheet_name, row: r.row_number, fingerprint: r.cell_metadata.fingerprint })),
      summary: reportSummary(report, book),
    })),
  };
  return { partitions, manifest };
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
