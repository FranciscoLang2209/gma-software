import "server-only";
import { getSupabaseConfig } from "../supabase/server.ts";

// El formato de las variables no acredita conectividad ni cobertura.
export function getWorkspaceStatus() {
  const { status } = getSupabaseConfig();
  if (status === "invalid") {
    return {
      kind: "error",
      title: "Revisar configuración",
      description:
        "La configuración de Supabase está incompleta o no es válida. Revisá las variables del servidor siguiendo el README.",
    } as const;
  }
  if (status === "configured") {
    return {
      kind: "unavailable",
      title: "Variables configuradas",
      description:
        "Las variables están configuradas. Resumen y Análisis comercial consultan exclusivamente datos publicados; la conectividad y la cobertura se informan en cada consulta.",
    } as const;
  }
  return {
    kind: "unavailable",
    title: "Sin conexión configurada",
    description: "Configurá Supabase para habilitar el acceso por invitación.",
  } as const;
}
