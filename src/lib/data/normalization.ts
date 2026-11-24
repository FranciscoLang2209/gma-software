// Para búsqueda de etiquetas (cliente/comercial/equipo/servicio/tipo de comisión)
// y comparación de headers/códigos conocidos; nunca acredita identidad o aliases.
export function textSearchKey(original: string) {
  return original.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

// El literal sigue siendo la clave; los indicadores son solo para revisión.
export function inspectAccountIdentifier(original: string) {
  return {
    original,
    key: original,
    edgeWhitespace: original !== original.trim(),
    invisibleCharacters: /[\u0000-\u001f\u007f-\u009f\u00a0\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/u.test(original),
    scientific: /^[+-]?\d+(?:[.,]\d+)?[eE][+-]?\d+$/.test(original.trim()),
  };
}

// Fecha ISO literal: no interpretar fechas locales ambiguas ni usar zona horaria.
export function isoDate(original: string): string | null {
  if (original.length !== 10 || !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(original)) return null;
  const [year, month, day] = original.split("-").map(Number);
  if (year < 1 || year > 9998) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1] ? original : null;
}

export function importPeriod(monthOriginal: string, yearOriginal: string): string | null {
  const month = monthOriginal.trim(), year = yearOriginal.trim();
  if (!/^(0?[1-9]|1[0-2])$/.test(month) || !/^\d{4}$/.test(year)
    || Number(year) < 1900 || Number(year) > 2200) return null;
  return isoDate(`${year}-${month.padStart(2, "0")}-01`);
}

export function isImportPeriod(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-01$/.test(value)
    && importPeriod(value.slice(5, 7), value.slice(0, 4)) === value;
}
