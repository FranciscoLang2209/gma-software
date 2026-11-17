import { commissionCsv, commissionFilters, VIEWS, type CommissionDashboard } from "@/lib/commissions/dashboard";
import { privateHeaders } from "@/lib/imports/server";
import { UUID } from "@/lib/imports/contracts";
import { boundedBody, importAccess, reply } from "@/lib/imports/server";
export const runtime = "nodejs";

// Análisis revisado exclusivo de administradores; no publica ni liquida pagos.
export async function GET(request: Request) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  try {
    const filters = Object.fromEntries(new URL(request.url).searchParams);
    if (filters.dashboard === "1" || filters.formato === "csv") {
      const view = filters.vista ?? "cuentas";
      if (!Object.hasOwn(VIEWS, view)) return reply({ error: "Vista inválida." }, 400);
      const selected = commissionFilters(filters);
      const { data, error } = await supabase.rpc("commission_dashboard", { filters: selected });
      if (error || !data) return reply({ error: "Consulta no disponible. Revisá filtros; máximo 10.000 registros." }, 400);
      const report = data as CommissionDashboard;
      if (filters.revision && filters.revision !== report.revision) return reply({ error: "Los datos cambiaron. Actualizá la pantalla antes de exportar." }, 409);
      if (filters.formato === "csv") return new Response(commissionCsv(report, view, selected), {
        headers: { ...privateHeaders, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="comisiones-${view}.csv"` },
      });
      return reply(report);
    }
    const { data, error } = await supabase.rpc("commission_report", { filters });
    return error ? reply({ error: "Filtros inválidos o consulta no disponible." }, 400) : reply(data);
  } catch {
    return reply({ error: "No se pudo consultar la conciliación." }, 503);
  }
}

export async function POST(request: Request) {
  const supabase = await importAccess(request);
  if (supabase instanceof Response) return supabase;
  try {
    const { request_id, operation, target_id, input } = JSON.parse((await boundedBody(request, 1024 * 1024)).toString("utf8"));
    if (!UUID.test(request_id ?? "") || !UUID.test(target_id ?? "") || !["expected", "receipt", "reconcile"].includes(operation))
      return reply({ error: "Operación o identificadores inválidos." }, 400);
    const { data, error } = await supabase.rpc("manage_commission", { request_id, operation, target_id, input });
    return error ? reply({ error: "No se guardó la revisión. Verificá bases, evidencia, versiones y asignaciones de Revenue." }, 409) : reply(data);
  } catch {
    return reply({ error: "Solicitud inválida o servicio no disponible." }, 400);
  }
}
