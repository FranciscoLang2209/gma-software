import "server-only";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getSupabaseConfig,
} from "../supabase/server.ts";

export async function getAccess() {
  if (getSupabaseConfig().status !== "configured")
    return { status: "unavailable" } as const;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403 ||
      error.name === "AuthSessionMissingError"
    ) {
      return { status: "anonymous" } as const;
    }
    throw new Error("No se pudo validar la identidad. Reintentá más tarde.");
  }
  if (!data.user) return { status: "anonymous" } as const;
  const { data: role, error: roleError } = await supabase.rpc("current_access");
  if (roleError) throw new Error("No se pudieron verificar los permisos.");
  if (role !== "admin" && role !== "reader")
    return { status: "forbidden" } as const;
  return { status: "authorized", role, supabase } as const;
}

export async function requireAccess(admin = false) {
  const access = await getAccess();
  if (access.status === "unavailable")
    redirect("/ingresar?estado=configuracion");
  if (access.status === "anonymous") redirect("/ingresar?estado=sesion");
  if (access.status === "forbidden" || (admin && access.role !== "admin"))
    redirect("/sin-acceso");
  return access;
}
