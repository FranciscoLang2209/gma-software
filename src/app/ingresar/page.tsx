import type { Metadata } from "next";
import { Button } from "@radix-ui/themes";
import { login } from "./actions";
import { getSupabaseConfig } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ingresar" };

const messages: Record<string, string> = {
  configuracion: "El acceso todavía no está configurado. Contactá al administrador.",
  sesion: "Ingresá con tu correo y contraseña para continuar.",
  error: "No se pudo ingresar. Revisá tus credenciales o contactá al administrador.",
  datos: "Revisá el correo y la contraseña ingresados.",
  salida: "Cerraste la sesión.",
};
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const configured = getSupabaseConfig().status === "configured";
  return (
    <main id="contenido" className="auth-panel" tabIndex={-1}>
      <h1>Ingresar a gma-software</h1>
      <p>Acceso exclusivo para cuentas habilitadas por el administrador.</p>
      <p role="status">
        {!configured ? messages.configuracion : messages[estado ?? ""]}
      </p>
      {configured && (
        <form action={login} className="auth-form">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required />
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="current-password" maxLength={4096} required />
          <Button type="submit" highContrast>Ingresar</Button>
          <p>Para solicitar una cuenta o recuperar tu acceso, contactá al administrador.</p>
        </form>
      )}
    </main>
  );
}
