import { UUID } from "@/lib/imports/contracts";
import { boundedBody, importAccess, reply } from "@/lib/imports/server";
export const runtime = "nodejs";
async function manage(request: Request, params: Promise<{ id: string }>) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  const { id } = await params;
  if (!UUID.test(id)) return reply({ error: "Identificador inválido." }, 400);
  let operation: string, input: Record<string, unknown>;
  try {
    if (request.method === "GET") {
      operation = "inspect";
      input = { page: Number(new URL(request.url).searchParams.get("page") ?? 0) };
    } else {
      const body = JSON.parse((await boundedBody(request, 16384)).toString("utf8"));
      operation = body.operation;
      input = body.input;
      if (!["resolve", "review", "publish"].includes(operation) || !input || typeof input !== "object" || Array.isArray(input))
        throw new Error("Solicitud inválida.");
    }
  } catch {
    return reply({ error: "Solicitud inválida." }, 400);
  }
  const { data, error } = await supabase.rpc("manage_import", { target_id: id, operation, input });
  if (error) {
    const message = error.message ?? "";
    const messages: [string, string][] = [
      ["Active version changed", "Cambió la versión activa. Recargá y revisá nuevamente antes de publicar."],
      ["Reference already belongs", "Conflicto: una referencia ya pertenece a otra cuenta. Revisá las correspondencias acreditadas y corregí el archivo si corresponde."],
      ["FA validity overlaps", "La vigencia FA se superpone con otra asignación activa. Corregí explícitamente las fechas antes de publicar."],
      ["Resolve every row", "Falta resolver alguna fila. No se publica parcialmente."],
      ["Confirm complete", "Confirmá el mes completo y el custodio que reemplaza esta versión."],
      ["Confirm commercial", "Elegí la columna comercial y una vigencia explícita válida."],
      ["Chosen commercial", "Hay un comercial asignado cuya columna elegida está vacía. Revisá esa fila."],
      ["Reviewed validity", "La vigencia revisada está congelada. Creá una nueva versión para cambiarla."],
      ["duplicate key", "Conflicto: varias filas resuelven a la misma cuenta AUM o FA. No se sumaron ni publicaron; corregí el origen."],
      ["Review token", "Primero revisá la conciliación y el alcance completo."],
      ["Nonempty import", "La importación debe tener filas y estar libre de errores bloqueantes."],
      ["File and candidate", "No coinciden las filas, importes o cobertura del archivo con los datos preparados."],
    ];
    return reply({ error: messages.find(([match]) => message.includes(match))?.[1] ?? "No se confirmó la operación. Se conservaron los datos publicados. Recargá para verificar el estado antes de reintentar." }, error.code === "42501" ? 403 : 409);
  }
  return reply(data);
}
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return manage(request, params); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return manage(request, params); }
