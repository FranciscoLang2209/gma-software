"use server";

import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getSupabaseConfig,
} from "@/lib/supabase/server";

export async function login(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length === 0 || password.length > 4096)
    redirect("/ingresar?estado=datos");
  if (getSupabaseConfig().status !== "configured")
    redirect("/ingresar?estado=configuracion");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Respuesta genérica: no revela si existe la cuenta ni registra credenciales.
  if (error) redirect("/ingresar?estado=error");
  redirect("/");
}

export async function acceptInvitation(form: FormData) {
  const token_hash = String(form.get("token_hash") ?? "");
  if (!/^[a-zA-Z0-9_-]{20,256}$/.test(token_hash))
    redirect("/ingresar?estado=error");
  if (getSupabaseConfig().status !== "configured")
    redirect("/ingresar?estado=configuracion");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: "invite",
  });
  if (error) redirect("/ingresar?estado=error");
  redirect("/");
}

export async function logout() {
  if (getSupabaseConfig().status !== "configured")
    redirect("/ingresar?estado=configuracion");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/sin-acceso?estado=logout");
  redirect("/ingresar?estado=salida");
}
