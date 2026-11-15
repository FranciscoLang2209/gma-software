import type { NumericFormat } from "./contracts.ts";

// Los importes nunca pasan por Number; el límite evita entradas desproporcionadas.
export function decimal(
  value: string,
  format: NumericFormat,
  native = false,
): string {
  let s = value.trim();
  if (s.length > 120 || !s)
    throw new Error("Importe ausente o demasiado extenso.");
  if (native && /^[+-]?\d+(?:\.\d+)?[eE][+-]?\d{1,3}$/.test(s)) {
    const [mantissa, exponent] = s.toLowerCase().split("e");
    const negative = mantissa.startsWith("-");
    const [whole, fraction = ""] = mantissa.replace(/^[+-]/, "").split(".");
    const position = whole.length + Number(exponent);
    const digits = whole + fraction;
    s =
      (negative ? "-" : "") +
      (position <= 0
        ? "0." + "0".repeat(-position) + digits
        : position >= digits.length
          ? digits + "0".repeat(position - digits.length)
          : digits.slice(0, position) + "." + digits.slice(position));
  }
  if (!native && format === "undefined" && /[.,]/.test(s))
    throw new Error(
      "Formato decimal ambiguo: elegí punto o coma decimal antes de convertir.",
    );
  if (!native && format !== "undefined") {
    const decimalMark = format === "dot" ? "." : ",";
    const group = format === "dot" ? "," : ".";
    const escaped = group === "." ? "\\." : ",";
    if (s.includes(group)) {
      if (
        !new RegExp(
          `^[+-]?\\d{1,3}(?:${escaped}\\d{3})+(?:\\${decimalMark}\\d+)?$`,
        ).test(s)
      )
        throw new Error(
          "Agrupación de miles inválida para la convención elegida.",
        );
      s = s.split(group).join("");
    }
    if (decimalMark === ",") s = s.replace(",", ".");
  }
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(s))
    throw new Error("Importe inválido; usá un número sin moneda ni fórmula.");
  const [whole, fraction = ""] = s.replace(/^[+-]/, "").split(".");
  if (whole.length > 60 || fraction.length > 30)
    throw new Error(
      "Máximo 60 dígitos enteros y 30 decimales; no se redondea.",
    );
  const normalized =
    whole.replace(/^0+(?=\d)/, "") +
    (fraction.replace(/0+$/, "") ? "." + fraction.replace(/0+$/, "") : "");
  return s.startsWith("-") && /[1-9]/.test(normalized)
    ? "-" + normalized
    : normalized;
}
export function sumDecimals(values: string[]): string | null {
  if (!values.length) return null;
  const scale = Math.max(...values.map((v) => (v.split(".")[1] ?? "").length));
  const sum = values.reduce((total, v) => {
    const [w, f = ""] = v.replace("-", "").split(".");
    return (
      total + BigInt(w + f.padEnd(scale, "0")) * (v.startsWith("-") ? -1n : 1n)
    );
  }, 0n);
  const digits = (sum < 0n ? -sum : sum).toString().padStart(scale + 1, "0");
  const fraction = scale ? digits.slice(-scale).replace(/0+$/, "") : "";
  return (
    (sum < 0n ? "-" : "") +
    (scale ? digits.slice(0, -scale) : digits) +
    (fraction ? "." + fraction : "")
  );
}
