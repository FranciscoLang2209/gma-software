import { getAccess } from "@/lib/auth/access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  };
  const access = await getAccess().catch(() => null);
  if (!access)
    return Response.json(
      { error: "No se pudo validar el acceso" },
      { status: 503, headers },
    );
  if (access.status !== "authorized")
    return Response.json(
      { error: "Acceso no autorizado" },
      {
        status:
          access.status === "unavailable"
            ? 503
            : access.status === "anonymous"
              ? 401
              : 403,
        headers,
      },
    );
  if (access.role !== "admin")
    return Response.json(
      { error: "Acceso no autorizado" },
      { status: 403, headers },
    );
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return Response.json(
      { error: "Identificador inválido" },
      { status: 400, headers },
    );
  const { data, error } = await access.supabase.rpc("source_file", {
    target_id: id,
  });
  if (error)
    return Response.json(
      { error: "No se pudo consultar el archivo" },
      { status: 502, headers },
    );
  const file = data?.[0];
  if (!file)
    return Response.json(
      { error: "Archivo no disponible" },
      { status: 404, headers },
    );
  // Descarga autenticada; nunca se emite una URL firmada reutilizable por un lector.
  const download = await access.supabase.storage
    .from(file.bucket)
    .download(file.object_path);
  if (download.error || !download.data)
    return Response.json(
      { error: "No se pudo descargar el archivo" },
      { status: 502, headers },
    );
  return new Response(download.data, {
    headers: {
      ...headers,
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="fuente"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}
