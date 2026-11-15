import { UUID } from "../imports/contracts.ts";
export const ENTITIES = { clients: "Clientes", custodians: "Custodios", teams: "Equipos", advisors: "Comerciales", memberships: "Membresías", assignments: "Asignaciones", accounts: "Clasificación de cuentas" } as const;
export type Entity = keyof typeof ENTITIES;
export type ModelRow = { id: string; name?: string; code?: string; active?: boolean; client_id?: string | null; custodian_id?: string; service?: string;
  account_id?: string; advisor_id?: string; group_id?: string; valid_from?: string; valid_to?: string | null; is_primary?: boolean };
export type Attribution = { account_id: string; period: string; aum_usd: string | null; revenue_usd: string | null; advisor: string | null; team: string | null; client: string | null; service: string };
export type Preview = { review_id: string; before: ModelRow | null; after: ModelRow; reason: string; changes: { before: Attribution; after: Attribution }[] };
export type Catalog = { selected?: ModelRow | null; options?: Record<string, { id: string; label: string }[]>; audit_count?: number; rows: ModelRow[]; row_count: number; offset: number; limit: number;
  audit?: { id: string; actor_id: string; occurred_at: string; action: string; entity_id: string; reason: string | null; before_data: unknown; after_data: unknown }[] };
export function parseModelRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Solicitud inválida.");
  const b = body as Record<string, unknown>;
  if (b.operation === "save" && typeof b.review_id === "string" && UUID.test(b.review_id) && Object.keys(b).every((k) => ["operation", "review_id"].includes(k)))
    return { operation: "save", review_id: b.review_id };
  if (b.operation !== "preview" || typeof b.entity !== "string" || !Object.hasOwn(ENTITIES, b.entity) ||
    (b.target_id !== null && b.target_id !== undefined && (typeof b.target_id !== "string" || !UUID.test(b.target_id))) ||
    typeof b.reason !== "string" || b.reason.trim().length < 3 || b.reason.length > 2000 ||
    !b.input || typeof b.input !== "object" || Array.isArray(b.input) ||
    Object.keys(b).some((k) => !["operation", "entity", "target_id", "input", "reason"].includes(k))) throw new Error("Solicitud inválida: revisá entidad, UUID y motivo.");
  return { operation: "preview", entity: b.entity, target_id: b.target_id ?? null, input: b.input, reason: b.reason.trim() };
}
