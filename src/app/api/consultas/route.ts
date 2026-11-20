import { getAccess } from "@/lib/auth/access";
import { privateHeaders, reply } from "@/lib/imports/server";
import { parseReportParameters, reportCsv } from "@/lib/queries/contracts";
import { queryReport, REPORT_TIMEOUT_MESSAGE } from "@/lib/queries/server";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const access = await getAccess().catch(() => null);
  if (!access || access.status === "unavailable") return reply({ error: "No se pudo verificar el acceso." }, 503);
  if (access.status !== "authorized") return reply({ error: "Acceso no autorizado." }, access.status === "anonymous" ? 401 : 403);
  let parsed;
  try {
    parsed = parseReportParameters(new URL(request.url).searchParams);
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : "Filtros inválidos." }, 400);
  }
  try {
    const complete = parsed.format === "csv-completo";
    const parameters = complete ? { ...parsed.parameters, page_size: 250 } : parsed.parameters;
    const { data, error } = await queryReport(access.supabase, parameters);
    if (error || !data) {
      if (error?.code === "40001") return reply({ error: "Los datos cambiaron. Reiniciá la consulta y la exportación." }, 409);
      if (error?.code === "57014") return reply({ error: REPORT_TIMEOUT_MESSAGE }, 504);
      if (error?.code === "42501") return reply({ error: "Acceso no autorizado." }, 403);
      return reply({ error: "No se pudo consultar la información publicada." }, 503);
    }
    if (parsed.format === "json") return reply(data);
    if (complete) {
      // shortcut: descarga en memoria hasta 10.000 filas; ampliar con exportación por jobs si el volumen lo exige.
      if (data.row_count > 10000) return reply({ error: "La exportación supera 10.000 filas. Acotá los filtros y reintentá; no se descargó un resultado parcial." }, 422);
      const rows = [...data.rows];
      for (let offset = data.limit; offset < data.row_count; offset += data.limit) {
        const page = await queryReport(access.supabase, { ...parameters, page_offset: offset, expected_revision: data.revision });
        if (page.error?.code === "40001") return reply({ error: "Los datos cambiaron. Reiniciá la consulta y la exportación." }, 409);
        if (page.error?.code === "57014") return reply({ error: REPORT_TIMEOUT_MESSAGE }, 504);
        if (page.error?.code === "42501") return reply({ error: "Acceso no autorizado." }, 403);
        if (page.error || !page.data) return reply({ error: "No se pudo completar la exportación. Reintentá más tarde." }, 503);
        if (page.data.revision !== data.revision || page.data.row_count !== data.row_count)
          return reply({ error: "Los datos cambiaron. Reiniciá la consulta y la exportación." }, 409);
        rows.push(...page.data.rows);
      }
      if (rows.length !== data.row_count) return reply({ error: "No se pudo completar la exportación. Reintentá más tarde." }, 503);
      data.rows = rows;
      data.limit = data.row_count;
    }
    return new Response(reportCsv(data), {
      headers: { ...privateHeaders, "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="consulta-${data.period.from}-${data.period.to}-${data.offset}.csv"`,
        "X-Report-Revision": data.revision, "X-Report-Row-Count": String(data.row_count),
        "X-Report-Scope": complete ? "complete" : "page",
        "X-Next-Offset": data.offset + data.limit < data.row_count ? String(data.offset + data.limit) : "",
      },
    });
  } catch {
    return reply({ error: "No se pudo consultar la información publicada." }, 503);
  }
}
