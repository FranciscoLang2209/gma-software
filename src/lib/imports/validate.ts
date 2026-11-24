import {
  HEADERS,
  LIMITS,
  type Book,
  type Issue,
  type Options,
  type PreparedRow,
  type Report,
  type SourceReview,
  type RawRow,
  type Cell,
  validateSourceReview,
} from "./contracts.ts";
import { decimal, sumDecimals } from "./decimal.ts";
import { sha256 } from "./read.ts";
import { textSearchKey, importPeriod } from "../data/normalization.ts";
import { identifierIssues } from "./identifiers.ts";
const issue = (code: string, message: string, column?: string): Issue => ({
  code,
  message,
  ...(column ? { column } : {}),
});

export function prepareHeaders(row: RawRow | undefined, expected: readonly string[]): { headers: Report["headers"]; errors: Issue[] } {
  const errors: Issue[] = [];
  const used = new Set<string>();
  const headers = (row?.cells ?? []).map((cell, position) => {
    const original = cell.value;
    const key = textSearchKey(original ?? "");
    if (key && used.has(key))
      errors.push(
        issue(
          "header_collision",
          `Dos columnas se corresponden con el header ${original}.`,
          String(position + 1),
        ),
      );
    if (key) used.add(key);
    if (
      cell.formula !== undefined ||
      !["s", "str", "inlineStr", "text", "empty"].includes(cell.kind)
    )
      errors.push(
        issue(
          "header_type",
          "Los headers deben ser texto literal, sin fórmulas.",
          String(position + 1),
        ),
      );
    return {
      position: position + 1,
      original,
      canonical: expected.find((h) => textSearchKey(h) === key) ?? null,
    };
  });
  for (const h of expected)
    if (!headers.some((x) => x.canonical === h))
      errors.push(issue("missing_column", `Falta la columna ${h}.`, h));
  return { headers, errors: errors.map((e) => ({ ...e, row: row?.number ?? 1 })) };
}

export function periodFromCells(month: Cell, year: Cell) {
  if ([month, year].some((c) => !["n", "s", "str", "inlineStr", "text"].includes(c.kind))) return null;
  return importPeriod(month.value ?? "", year.value ?? "");
}

export function prepare(book: Book, o: Options, sourceReview?: SourceReview): Report {
  const review = validateSourceReview(sourceReview);
  const sheet = book.sheets.find((s) => s.name === o.sheet);
  if (!sheet) throw new Error("Elegí una hoja existente.");
  const expected = HEADERS[o.source];
  const { headers, errors } = prepareHeaders(sheet.rows[0], expected);
  const warnings: Issue[] = [issue("identifier_history", "Los ceros ya perdidos en un archivo de texto no pueden detectarse ni reconstruirse. Revisá los identificadores contra su fuente.")];
  const rows: PreparedRow[] = [];
  const values: string[] = [],
    fingerprints = new Set<string>(),
    accounts = new Set<string>();
  const keys = new Map<string, PreparedRow[]>();
  let duplicateRows = 0,
    missingValues = 0;
  const index = (key: string, row: PreparedRow) =>
    keys.set(key, [...(keys.get(key) ?? []), row]);
  for (const raw of sheet.rows.slice(1)) {
    if (
      raw.cells.every(
        (c) => (c.value === null || c.value === "") && c.formula === undefined,
      )
    )
      continue;
    const rowErrors: Issue[] = [],
      rowWarnings: Issue[] = [];
    const row: PreparedRow = {
      sheet_name: sheet.name,
      row_number: raw.number,
      original_cells: Object.fromEntries(
        raw.cells.map((c, i) => [String(i + 1), c.value]),
      ),
      cell_metadata: {
        cells: raw.cells,
        account: null,
        amount: null,
        period: o.period,
        fingerprint: sha256(JSON.stringify(raw.cells.map((c) => c.value))),
        warnings: rowWarnings,
      },
      status: "valid",
      errors: rowErrors,
    };
    const get = (header: string) =>
      raw.cells[headers.findIndex((h) => h.canonical === header)] ?? {
        value: null,
        kind: "empty",
      };
    const text = (header: string) => get(header).value;
    const criticalColumns = o.source === "revenue" ? ["CUSTODIO", "MES", "AÑO", "ACCOUNT", "Payout broker"] : [...HEADERS[o.source]];
    for (let i = 0; i < raw.cells.length; i++) {
      const cell = raw.cells[i],
        col = headers[i]?.canonical ?? headers[i]?.original ?? String(i + 1);
      if (cell.formula !== undefined) {
        if (
          !cell.cached ||
          cell.value === null ||
          cell.value === "" ||
          cell.kind === "e"
        )
          (o.source === "revenue" && review?.metadataErrorsAsWarnings && headers[i]?.canonical && !criticalColumns.includes(col) ? rowWarnings : rowErrors).push(
            issue(
              "formula_no_result",
              "Fórmula sin resultado utilizable: recalculá y guardá desde Excel o exportá sus valores. No se usa cero.",
              col,
            ),
          );
        else
          rowWarnings.push(
            issue(
              "cached_formula",
              "Se conserva el resultado guardado; su vigencia requiere revisión en Excel.",
              col,
            ),
          );
      } else if (cell.kind === "e")
        (o.source === "revenue" && review?.metadataErrorsAsWarnings && headers[i]?.canonical && !criticalColumns.includes(col) ? rowWarnings : rowErrors).push(
          issue(
            "excel_error",
            "La celda contiene un error de Excel; corregilo y recalculá.",
            col,
          ),
        );
      if (i >= headers.length && cell.value)
        rowErrors.push(issue("extra_cell", "Hay una celda sin header.", col));
    }
    const identifiers =
      o.source === "aum"
        ? ["Holding Account Number", "Account Number bd_REV"]
        : o.source === "fa"
          ? ["ACC # Addepar", "ACCOUNT"]
          : ["ACCOUNT"];
    for (const h of identifiers) {
      const checked = identifierIssues(get(h), h, review?.numericIdentifiersAsWritten);
      rowErrors.push(...checked.errors);
      rowWarnings.push(...checked.warnings);
    }
    const account = text(identifiers[0]);
    row.cell_metadata.account = account;
    if (account?.trim()) accounts.add(account);
    if (o.source !== "fa") {
      const period = periodFromCells(get(o.source === "aum" ? "mes" : "MES"), get(o.source === "aum" ? "año" : "AÑO"));
      if (period === null || period !== o.period)
        rowErrors.push(
          issue(
            "period_mismatch",
            "Mes/año ausente, inválido o diferente del período elegido.",
            o.source === "aum" ? "mes / año" : "MES / AÑO",
          ),
        );
      const h = o.source === "aum" ? "Value (USD)" : "Payout broker";
      const cell = get(h);
      if (!cell.value?.trim()) {
        missingValues++;
        (o.source === "revenue" && review?.missingRevenueAsUnknown ? rowWarnings : rowErrors).push(
          issue(
            "missing_amount",
            "Importe ausente; se conserva como faltante.",
            h,
          ),
        );
      } else {
        try {
          if (!["n", "s", "str", "inlineStr", "text"].includes(cell.kind))
            throw new Error("Tipo de celda inválido para un importe.");
          row.cell_metadata.amount = decimal(
            cell.value,
            o.numericFormat,
            cell.kind === "n",
          );
          values.push(row.cell_metadata.amount);
        } catch (e) {
          rowErrors.push(issue("invalid_amount", (e as Error).message, h));
        }
      }
    }
    if (
      o.source === "revenue" &&
      textSearchKey(text("CUSTODIO") ?? "") !== textSearchKey(o.custodianCode)
    )
      rowErrors.push(
        issue(
          "scope_mismatch",
          "CUSTODIO no coincide con el código del alcance elegido; no se filtran ni descartan filas.",
        ),
      );
    if (o.source === "aum")
      for (const h of identifiers) if (text(h)) index(h + "\0" + text(h), row);
    if (o.source === "fa")
      for (const h of identifiers) if (text(h)) index(h + "\0" + text(h), row);
    if (fingerprints.has(row.cell_metadata.fingerprint)) {
      duplicateRows++;
      rowWarnings.push(
        issue(
          "repeated_row",
          "Contenido repetido conservado íntegramente; la huella es solo diagnóstica.",
        ),
      );
    }
    fingerprints.add(row.cell_metadata.fingerprint);
    if (Buffer.byteLength(JSON.stringify(row)) > LIMITS.chunkBytes)
      throw new Error(
        "Una fila preparada supera 1 MiB serializado. Reducí el contenido de sus celdas antes de importar.",
      );
    rows.push(row);
  }
  if (!rows.length)
    errors.push(
      issue(
        "empty_file",
        "No hay filas de datos. Un archivo vacío no confirma cero ni autoriza reemplazos.",
      ),
    );
  for (const group of keys.values()) {
    if (group.length < 2) continue;
    if (o.source === "aum")
      for (const row of group)
        row.errors.push(
          issue(
            "aum_duplicate",
            "Más de una fila para la misma referencia de cuenta y período. Conflicto; no se suman como AUM publicable.",
          ),
        );
    if (o.source === "fa") {
      const signatures = new Set(
        group.map((row) =>
          JSON.stringify(
            expected.map((h) =>
              h === "OLD Owner Name payout"
                ? null
                : row.original_cells[
                    String(headers.findIndex((x) => x.canonical === h) + 1)
                  ],
            ),
          ),
        ),
      );
      if (signatures.size > 1)
        for (const row of group)
          row.errors.push(
            issue(
              "fa_contradiction",
              "La referencia tiene equivalencias contradictorias o asignaciones ambiguas. Requiere resolución explícita.",
            ),
          );
    }
  }
  if (o.source === "fa")
    warnings.push(
      issue(
        "fa_pending",
        "FA no acredita custodio ni vigencia. El alcance es declarado por el usuario; comercial, equivalencias y fechas quedan pendientes. OLD Owner no genera historia.",
      ),
    );
  for (const row of rows) row.status = row.errors.length ? "error" : "valid";
  return {
    rows,
    headers,
    errors,
    warnings,
    distinctAccounts: accounts.size,
    total: sumDecimals(values),
    valueCount: values.length,
    missingValues,
    duplicateRows,
    blockingErrors:
      errors.length + rows.reduce((n, r) => n + r.errors.length, 0),
  };
}
