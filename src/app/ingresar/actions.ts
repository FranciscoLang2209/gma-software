"use server";

import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getSupabaseConfig,
} from "@/lib/supabase/server";

export async function requestCode(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    redirect("/ingresar?estado=datos");
  if (getSupabaseConfig().status !== "configured")
    redirect("/ingresar?estado=configuracion");
  const supabase = await createSupabaseServerClient();
  // El mensaje es igual para cuentas existentes e inexistentes.
  await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  redirect("/ingresar?estado=codigo");
}

export async function verifyCode(form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  const token = String(form.get("token") ?? "").trim();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^\d{6,8}$/.test(token)
  )
    redirect("/ingresar?estado=datos");
  if (getSupabaseConfig().status !== "configured")
    redirect("/ingresar?estado=configuracion");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
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
