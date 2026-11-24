import { UUID } from "../imports/contracts.ts";

export const REFERENCE_PARAMETERS = ["ref_snapshot", "ref_cliente", "ref_comercial", "ref_equipo"] as const;
export const REFERENCE_FIELDS = { ref_cliente: "Cliente REF", ref_comercial: "Comercial REF", ref_equipo: "Equipo REF" } as const;
export type ReferenceFilters = { snapshot: string; client?: string; advisor?: string; team?: string };
export type ReferenceOptions = { snapshot: string; options: Record<string, { id: string; label: string }[]> };
export function parseReferenceFilters(params: URLSearchParams): ReferenceFilters | undefined {
  const active = REFERENCE_PARAMETERS.some(key => params.has(key));
  if (!active) return undefined;
  const snapshot = params.get("ref_snapshot");
  if (!snapshot || !UUID.test(snapshot)) throw new Error("La selección REF requiere una foto publicada válida.");
  const result: ReferenceFilters = { snapshot };
  for (const [key, field] of [["ref_cliente", "client"], ["ref_comercial", "advisor"], ["ref_equipo", "team"]] as const) {
    const value = params.get(key);
    if (value === null) continue;
    if (value !== "sin_referencia" && !/^[1-9][0-9]{0,8}$/.test(value)) throw new Error("Selección REF inválida.");
    result[field] = value;
  }
  return result;
}
export function clearReferenceFilters() {
  return Object.fromEntries(REFERENCE_PARAMETERS.map(key => [key, null]));
}
