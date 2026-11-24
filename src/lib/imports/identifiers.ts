import { inspectAccountIdentifier } from "../data/normalization.ts";
import type { Cell, Issue } from "./contracts.ts";

// El consentimiento sólo admite el número literal; nunca recupera ceros o dígitos.
export function identifierIssues(cell: Cell, column: string, numericAsWritten = false) {
  const errors: Issue[] = [], warnings: Issue[] = [];
  const add = (code: string, message: string): Issue => ({ code, message, column });
  if (!cell.value?.trim()) {
    errors.push(add("empty_identifier", "Identificador vacío."));
    return { errors, warnings };
  }
  const inspected = inspectAccountIdentifier(cell.value);
  if (cell.formula !== undefined || !["s", "str", "inlineStr", "text"].includes(cell.kind) || inspected.scientific) {
    const accepted = numericAsWritten && cell.kind === "n" && cell.formula === undefined && /^(0|[1-9]\d{0,14})$/.test(cell.value);
    (accepted ? warnings : errors).push(add(
      accepted ? "numeric_identifier_reviewed" : "identifier_loss",
      accepted ? "Número de cuenta aceptado expresamente tal como está escrito, dentro de su custodio. Original conservado; no se agregan ceros."
        : "Cuenta numérica, científica o calculada: puede haber perdido ceros o precisión. Recuperá el texto original; no se inventan ceros.",
    ));
  }
  if (inspected.edgeWhitespace || inspected.invisibleCharacters)
    warnings.push(add("identifier_format_review", "Cuenta con espacios en los extremos o caracteres invisibles. Revisá el literal y sus correspondencias; no se recorta, limpia ni une automáticamente."));
  return { errors, warnings };
}
