import { readBook, sha256 } from "./read.ts";
import { decimal } from "./decimal.ts";
import { LIMITS, type Cell, type NumericFormat } from "./contracts.ts";

export const MASTER_HEADERS = ["Broker", "ACCOUNT", "IP", "IP Des", "NAME", "Owner Name payout", "Fee type", "Adv Fee / Retro", "Status", "Gross anua USD", "Net annual USD", "Payout final REP", "Final REP"];
export type MasterRow = { row: number; cells: Record<string, string | null>; original: Cell[]; account: string; numericAccount: boolean; balance: string | null; annualRate: string | null; rateBasisPoints: string | null; issue: string | null };
export type MasterFile = { file: string; hash: string; sheet: string; balanceHeader: string; rows: MasterRow[]; subtotalRows: number[]; brokers: string[] };

// Unidad confirmada por el dueño: 50 puntos básicos = 0,005 anual. Sin Number.
export function basisPoints(value: string) {
  value = decimal(value, "dot", true);
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  const digits = (whole + fraction).padStart(fraction.length + 5, "0");
  const scale = fraction.length + 4;
  const integer = digits.slice(0, -scale).replace(/^0+(?=\d)/, "");
  const decimals = digits.slice(-scale).replace(/0+$/, "");
  return `${negative && /[1-9]/.test(digits) ? "-" : ""}${integer}${decimals ? `.${decimals}` : ""}`;
}
export async function prepareMaster(bytes: Uint8Array, filename: string, sheet: string, format: NumericFormat): Promise<MasterFile> {
  if (!/\.xlsx$/i.test(filename)) throw new Error("Master Owners requiere XLSX sin macros.");
  if (!["dot", "comma", "undefined"].includes(format)) throw new Error("Formato numérico inválido.");
  const book = await readBook(bytes, filename, ",", { ...LIMITS, mergedPreambleRows: 1 });
  const selected = sheet ? book.sheets.find(s => s.name === sheet) : book.sheets.length === 1 ? book.sheets[0] : null;
  if (!selected) throw new Error("Elegí la hoja del Master Owners.");
  const headers = selected.rows.find(r => r.number === 2)?.cells.map(c => c.value ?? "") ?? [];
  const balanceHeaders = headers.filter(h => /^Balance\b/.test(h));
  if (headers.length !== 14 || new Set(headers).size !== 14 || balanceHeaders.length !== 1 || MASTER_HEADERS.some(h => !headers.includes(h)))
    throw new Error("Se esperan las 14 columnas del Master Owners en la fila 2 y una columna Balance.");
  const balanceHeader = balanceHeaders[0], rows: MasterRow[] = [], subtotalRows: number[] = [];
  for (const r of selected.rows.filter(r => r.number > 2)) {
    if (r.cells.every(c => c.value == null && !c.formula)) continue;
    const cells = Object.fromEntries(headers.map((h, i) => [h, r.cells[i]?.value ?? null]));
    if (r.cells.length > 14 && r.cells.slice(14).some(c => c.value != null || c.formula)) throw new Error(`Fila ${r.number}: columnas adicionales con contenido.`);
    if (r.cells.slice(0, 10).every(c => c.value == null && !c.formula) && r.cells.some(c => /^SUBTOTAL\(/i.test(c.formula ?? ""))) {
      subtotalRows.push(r.number); continue;
    }
    const accountCell = r.cells[headers.indexOf("ACCOUNT")];
    if (!cells.ACCOUNT || accountCell.formula || accountCell.kind === "e") throw new Error(`Fila ${r.number}: cuenta ausente, calculada o con error.`);
    const numericAccount = accountCell.kind === "n";
    if (numericAccount && !/^\d{1,15}$/.test(cells.ACCOUNT)) throw new Error(`Fila ${r.number}: cuenta numérica ambigua; conservar como texto en Excel.`);
    const parse = (header: string) => {
      const c = r.cells[headers.indexOf(header)];
      if (c?.value == null) return null;
      if (c.kind === "e" || (c.formula && !c.cached)) throw new Error("Resultado Excel ausente o con error.");
      return decimal(c.value, format, c.kind === "n");
    };
    let balance: string | null = null, annualRate: string | null = null, rateBasisPoints: string | null = null, issue: string | null = null;
    try { balance = parse(balanceHeader); } catch { throw new Error(`Fila ${r.number}: Balance inválido; revisá formato o resultado guardado.`); }
    const rateCell = r.cells[headers.indexOf("Adv Fee / Retro")] ?? { kind: "empty", value: null };
    if (rateCell.kind === "e" || (rateCell.formula && !rateCell.cached)) throw new Error(`Fila ${r.number}: tasa con error o sin resultado guardado.`);
    try { rateBasisPoints = parse("Adv Fee / Retro"); annualRate = rateBasisPoints == null ? null : basisPoints(rateBasisPoints); }
    catch {
      if (rateCell.kind === "n" || /^[+\-\d.,\s]+$/.test(rateCell.value ?? "")) throw new Error(`Fila ${r.number}: tasa numérica inválida; revisá el formato.`);
      issue = "Condición de tasa pendiente; se conserva el original y no se publica como fee.";
    }
    if (annualRate === null) issue ??= "Sin tasa numérica; pendiente.";
    if (balance === null) issue ??= "Sin Balance; pendiente.";
    rows.push({ row: r.number, cells, original: r.cells, account: cells.ACCOUNT, numericAccount, balance, annualRate, rateBasisPoints, issue });
  }
  if (!rows.length) throw new Error("El Master Owners no contiene cuentas; no reemplaza publicaciones existentes.");
  return { file: filename, hash: sha256(bytes), sheet: selected.name, balanceHeader, rows, subtotalRows, brokers: [...new Set(rows.map(r => r.cells.Broker ?? ""))] };
}
