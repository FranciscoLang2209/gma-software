import { parseSupabaseConfig } from "../src/lib/supabase/config.ts";

type Target = {
  supabaseProjectRef: string;
  vercelProjectId: string;
  vercelTeamId: string;
  origin: string;
};

export function checkDeployment(
  env: Record<string, string | undefined>,
  targets: Record<string, Target>,
) {
  const name = env.VERCEL_ENV;
  if (!name || !["development", "preview", "production"].includes(name))
    throw new Error("Falta un entorno Vercel admitido.");
  const target = targets[name];
  if (
    !target ||
    !/^[a-z]{20}$/.test(target.supabaseProjectRef) ||
    !/^prj_[A-Za-z0-9]+$/.test(target.vercelProjectId) ||
    !/^team_[A-Za-z0-9]+$/.test(target.vercelTeamId)
  ) throw new Error("Completar el destino revisado en config/deployment-targets.json.");
  let origin;
  try { origin = new URL(target.origin); } catch {
    throw new Error("Falta el origen HTTPS revisado para Auth.");
  }
  if (origin.protocol !== "https:" || origin.origin !== target.origin ||
      ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))
    throw new Error("Auth requiere un origen HTTPS exacto sin ruta ni credenciales.");
  if (Object.entries(targets).some(([other, value]) =>
    other !== name && value.supabaseProjectRef === target.supabaseProjectRef))
    throw new Error("Desarrollo, prueba y producción requieren Supabase separados.");
  if (env.VERCEL_PROJECT_ID !== target.vercelProjectId ||
      env.VERCEL_ORG_ID !== target.vercelTeamId)
    throw new Error("El proyecto/equipo Vercel no coincide con el destino revisado.");
  const config = parseSupabaseConfig(env);
  if (config.status !== "configured" ||
      config.url !== `https://${target.supabaseProjectRef}.supabase.co`)
    throw new Error("Las variables Supabase no corresponden al destino revisado.");
  if (Object.keys(env).some((key) => env[key] && (
    /^SUPABASE_.*(SECRET|SERVICE_ROLE)/i.test(key) ||
    /^NEXT_PUBLIC_.*(SUPABASE|SECRET|SERVICE_ROLE)/i.test(key)
  ))) throw new Error("Quitar variables privilegiadas o públicas del runtime de App Papá.");
  return name;
}
