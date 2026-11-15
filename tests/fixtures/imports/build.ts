// SOLO DATOS SINTÉTICOS. Constructor mínimo para probar también tipos y caché de fórmulas.
import { zipSync, strToU8 } from "fflate";
import { HEADERS, type Source } from "../../../src/lib/imports/contracts.ts";
export type TestCell =
  string | { n: string } | { formula: string; cached?: string; type?: string };
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
export function xlsx(
  sheets: { name: string; rows: TestCell[][] }[],
  extra: Record<string, Uint8Array> = {},
) {
  const files: Record<string, Uint8Array> = {
    "_rels/.rels": strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    "[Content_Types].xml": strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>',
    ),
    "xl/workbook.xml": strToU8(
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${escape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`,
    ),
  };
  files["[Content_Types].xml"] = strToU8(
    new TextDecoder()
      .decode(files["[Content_Types].xml"])
      .replace(
        "</Types>",
        sheets
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join("") + "</Types>",
      ),
  );
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${s.rows
        .map(
          (r, ri) =>
            `<row r="${ri + 1}">${r
              .map((v, ci) => {
                const c =
                  ci < 26
                    ? String.fromCharCode(65 + ci)
                    : "A" + String.fromCharCode(65 + ci - 26);
                const ref = c + (ri + 1);
                return typeof v === "string"
                  ? `<c r="${ref}" t="inlineStr"><is><t>${escape(v)}</t></is></c>`
                  : "n" in v
                    ? `<c r="${ref}"><v>${escape(v.n)}</v></c>`
                    : `<c r="${ref}" t="${v.type ?? "n"}"><f>${escape(v.formula)}</f>${v.cached === undefined ? "" : `<v>${escape(v.cached)}</v>`}</c>`;
              })
              .join("")}</row>`,
        )
        .join("")}</sheetData></worksheet>`,
    );
  });
  return zipSync({ ...files, ...extra });
}
export const csv = (source: Source, rows: string[][], separator = ",") =>
  Buffer.from(
    [HEADERS[source], ...rows]
      .map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(separator))
      .join("\r\n"),
  );
export function revenueRow(
  account: string,
  amount: string,
  custodian = "SYN-A",
) {
  const fields: Record<string, string> = {
    CUSTODIO: custodian,
    MES: "1",
    AÑO: "2026",
    ACCOUNT: account,
    NAME: "Cliente SINTETICO",
    "Payout broker": amount,
  };
  return HEADERS.revenue.map((h) => fields[h] ?? "");
}
