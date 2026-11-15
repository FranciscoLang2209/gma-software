import { createHash } from "node:crypto";
import path from "node:path";
import readExcelFile from "read-excel-file/node";
import { parse } from "csv-parse/sync";
import { Unzip, UnzipInflate } from "fflate";
import { Parser } from "saxen";
import {
  LIMITS,
  type Book,
  type Cell,
  type RawRow,
  type Options,
} from "./contracts.ts";

export const sha256 = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");
export function checkFile(name: string, size: number) {
  if (!/\.(xlsx|csv)$/i.test(name))
    throw new Error(
      "Formato no admitido. Abrí el archivo en Excel y guardá una copia .xlsx sin macros o CSV UTF-8; .xls, .xlsm y .xlsb no se procesan.",
    );
  if (name.length > 200 || !size || size > LIMITS.bytes)
    throw new Error(
      "El archivo debe tener contenido y no superar 2 MiB. Dividilo en archivos con alcance explícito.",
    );
}
function xml(
  content: string,
  open: (tag: string, attrs: Record<string, string>) => void,
  close: (tag: string) => void = () => {},
  text: (s: string) => void = () => {},
) {
  if (/<!DOCTYPE|<!ENTITY/i.test(content))
    throw new Error("XML con entidades o DTD no admitido.");
  const parser = new Parser();
  parser.on("error", () => {
    throw new Error("XML inválido en el libro.");
  });
  parser.on("warn", () => {
    throw new Error("XML ambiguo en el libro.");
  });
  parser.on("openTag", (name, get, decode) =>
    open(
      name.split(":").at(-1)!,
      Object.fromEntries(Object.entries(get()).map(([k, v]) => [k, decode(v)])),
    ),
  );
  parser.on("closeTag", (name) => close(name.split(":").at(-1)!));
  parser.on("text", (s, decode) => text(decode(s)));
  parser.parse(content);
}
function unzip(bytes: Uint8Array) {
  const files: Record<string, string> = Object.create(null);
  let expanded = 0,
    entries = 0;
  let failure: Error | undefined;
  const unzipper = new Unzip((file) => {
    if (
      ++entries > 200 ||
      file.name.includes("..") ||
      file.name.startsWith("/") ||
      file.name.includes("\\")
    )
      throw new Error("Estructura ZIP no admitida.");
    if (/vbaProject|macrosheets/i.test(file.name))
      throw new Error(
        "Libro con macros no admitido; guardá una copia .xlsx sin macros.",
      );
    const chunks: Uint8Array[] = [];
    file.ondata = (error, data, final) => {
      if (error)
        throw failure ?? new Error("No se pudo descomprimir el libro.");
      expanded += data.length;
      if (expanded > LIMITS.expanded) {
        failure = new Error(
          "El libro supera 12 MiB descomprimidos. Dividilo antes de importar.",
        );
        throw failure;
      }
      chunks.push(data);
      if (final) {
        if (Object.hasOwn(files, file.name))
          throw new Error("Entradas ZIP duplicadas.");
        files[file.name] = /\.(xml|rels)$/i.test(file.name)
          ? new TextDecoder("utf-8", { fatal: true }).decode(
              Buffer.concat(chunks),
            )
          : "";
      }
    };
    file.start();
  });
  unzipper.register(UnzipInflate);
  // Fragmentos pequeños acotan la expansión antes de cada control de tamaño real.
  for (let i = 0; i < bytes.length; i += 1024)
    unzipper.push(bytes.subarray(i, i + 1024), i + 1024 >= bytes.length);
  if (!files["xl/workbook.xml"] || !files["xl/_rels/workbook.xml.rels"])
    throw new Error(
      "Se requiere un libro .xlsx válido; convertí el archivo desde Excel.",
    );
  return files;
}
function coordinates(ref: string) {
  const match = /^([A-Z]{1,3})([1-9]\d*)$/.exec(ref);
  if (!match) throw new Error("Coordenada de celda inválida.");
  const column = [...match[1]].reduce(
    (n, c) => n * 26 + c.charCodeAt(0) - 64,
    0,
  );
  const row = Number(match[2]);
  if (column > LIMITS.columns || row > LIMITS.rows + 1)
    throw new Error(
      "Máximo 5.000 filas de datos y 64 columnas por hoja, incluyendo celdas vacías formateadas.",
    );
  return { row, column };
}
function metadata(content: string) {
  const cells = new Map<string, Cell>();
  let ref = "",
    current: Cell | undefined,
    tag = "";
  xml(
    content,
    (name, attrs) => {
      tag = name;
      if (name === "row" && attrs.r && Number(attrs.r) > LIMITS.rows + 1)
        throw new Error("La hoja supera 5.000 filas.");
      if (name === "mergeCell")
        throw new Error(
          "Celdas combinadas no admitidas: descombinalas y completá cada fila antes de importar.",
        );
      if (name === "c") {
        ref = attrs.r;
        coordinates(ref);
        if (cells.has(ref)) throw new Error("Celda duplicada en el libro.");
        current = { value: null, kind: attrs.t ?? "n", style: attrs.s };
        cells.set(ref, current);
      }
      if (current && name === "f") current.formula = "";
      if (current && name === "v") current.cached = true;
    },
    (name) => {
      if (name === "c") current = undefined;
      tag = "";
    },
    (value) => {
      if (!current) return;
      if (tag === "f") current.formula = (current.formula ?? "") + value;
      if (tag === "v") current.value = (current.value ?? "") + value;
    },
  );
  return cells;
}
export async function readBook(
  bytes: Uint8Array,
  filename: string,
  delimiter: Options["delimiter"],
): Promise<Book> {
  checkFile(filename, bytes.length);
  if (/\.csv$/i.test(filename)) {
    let content: string;
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error("CSV no UTF-8: exportalo como CSV UTF-8 desde Excel.");
    }
    if (content.includes("\0"))
      throw new Error(
        "CSV binario o UTF-16 no admitido; exportalo como CSV UTF-8.",
      );
    let records: { record: string[]; info: { lines: number } }[];
    try {
      records = parse(content, {
        bom: true,
        delimiter,
        cast: false,
        info: true,
        to: LIMITS.rows + 2,
        relax_column_count: true,
        max_record_size: LIMITS.cell * LIMITS.columns,
      }) as unknown as typeof records;
    } catch {
      throw new Error(
        "CSV inválido: revisá delimitador, comillas y longitud de registros.",
      );
    }
    if (records.length > LIMITS.rows + 1)
      throw new Error("CSV supera 5.000 filas de datos.");
    let nextLine = 1;
    const rows = records.map(({ record, info }) => {
      const row = {
        number: nextLine,
        cells: record.map((value) => ({ value, kind: "text" })),
      };
      nextLine = info.lines + 1;
      if (
        row.cells.length > LIMITS.columns ||
        row.cells.some((c) => c.value.length > LIMITS.cell)
      )
        throw new Error("Máximo 64 columnas y 4.096 caracteres por celda.");
      return row;
    });
    return { sheets: [{ name: "CSV", rows }] };
  }
  if (
    bytes[0] !== 0x50 ||
    bytes[1] !== 0x4b ||
    bytes[2] !== 3 ||
    bytes[3] !== 4
  )
    throw new Error(
      "El archivo no es un .xlsx válido. Abrilo en Excel y guardá una copia .xlsx sin contraseña ni macros, o CSV UTF-8.",
    );
  let files: Record<string, string>;
  try {
    files = unzip(bytes);
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("Libro ZIP inválido.");
  }
  if (/macroEnabled|vbaProject/i.test(files["[Content_Types].xml"] ?? ""))
    throw new Error(
      "Libro con macros no admitido; convertí a .xlsx sin macros.",
    );
  if (Object.values(files).some((s) => /<!DOCTYPE|<!ENTITY/i.test(s)))
    throw new Error("XML con entidades o DTD no admitido.");
  const relations = new Map<string, string>();
  xml(files["xl/_rels/workbook.xml.rels"], (tag, a) => {
    if (tag === "Relationship" && /\/worksheet$/.test(a.Type)) {
      if (a.TargetMode === "External")
        throw new Error("Hojas externas no admitidas.");
      const target = a.Target.startsWith("/")
        ? a.Target.slice(1)
        : path.posix.normalize("xl/" + a.Target);
      relations.set(a.Id, target);
    }
  });
  const sheets: { name: string; cells: Map<string, Cell> }[] = [];
  xml(files["xl/workbook.xml"], (tag, a) => {
    if (tag !== "sheet") return;
    const target = relations.get(a["r:id"]);
    if (!target || !files[target])
      throw new Error("Hoja no disponible en el libro.");
    if (
      sheets.some((s) => s.name === a.name) ||
      !a.name ||
      a.name.length > 100 ||
      sheets.length >= LIMITS.sheets
    )
      throw new Error("Máximo 10 hojas con nombres distintos.");
    sheets.push({ name: a.name, cells: metadata(files[target]) });
  });
  if (!sheets.length) throw new Error("El libro no contiene hojas de datos.");
  let parsed;
  try {
    parsed = await readExcelFile(Buffer.from(bytes), {
      trim: false,
      parseNumber: (value) => ({ rawNumber: value }),
    });
  } catch {
    throw new Error(
      "No se pudo leer el libro. Recalculá y guardá una copia .xlsx desde Excel o exportá CSV UTF-8.",
    );
  }
  return {
    sheets: sheets.map((sheet) => {
      const data = parsed.find((s) => s.sheet === sheet.name)?.data;
      if (!data) throw new Error("Hoja ilegible.");
      const rows: RawRow[] = [];
      const widths = new Map<number, number>();
      let lastRow = data.length;
      for (const ref of sheet.cells.keys()) {
        const { row, column } = coordinates(ref);
        lastRow = Math.max(lastRow, row);
        widths.set(row, Math.max(widths.get(row) ?? 0, column));
      }
      for (let r = 1; r <= lastRow; r++) {
        const row: RawRow = { number: r, cells: [] };
        const lastColumn = Math.max(
          data[r - 1]?.length ?? 0,
          widths.get(r) ?? 0,
        );
        for (let c = 0; c < lastColumn; c++) {
          let col = c + 1,
            letters = "";
          while (col) {
            letters = String.fromCharCode(65 + ((col - 1) % 26)) + letters;
            col = Math.floor((col - 1) / 26);
          }
          const meta = sheet.cells.get(letters + r);
          const value = data[r - 1]?.[c];
          const cell: Cell = {
            ...meta,
            kind: value instanceof Date ? "d" : (meta?.kind ?? "empty"),
            value:
              meta && ["n", "b", "d", "e", "str"].includes(meta.kind)
                ? meta.value
                : value == null
                  ? null
                  : typeof value === "object" && "rawNumber" in value
                    ? value.rawNumber
                    : value instanceof Date
                      ? value.toISOString()
                      : String(value),
          };
          if (
            (cell.value?.length ?? 0) > LIMITS.cell ||
            (cell.formula?.length ?? 0) > LIMITS.cell
          )
            throw new Error("Una celda supera 4.096 caracteres.");
          row.cells.push(cell);
        }
        rows.push(row);
      }
      return { name: sheet.name, rows };
    }),
  };
}
