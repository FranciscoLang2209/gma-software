import { Button } from "@radix-ui/themes";
import { requestCode, verifyCode } from "./actions";
import { getSupabaseConfig } from "@/lib/supabase/server";

const messages: Record<string, string> = {
  configuracion:
    "El acceso todavía no está configurado. Contactá al administrador.",
  sesion:
    "Ingresá con una invitación vigente. Si tu sesión venció, solicitá otro código.",
  codigo:
    "Si tu cuenta está invitada, recibirás un código. Revisá tu correo e ingresalo abajo.",
  error:
    "El código o la invitación no es válido o venció. Solicitá un nuevo acceso.",
  datos: "Revisá el correo y el código ingresados.",
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
      <h1>Ingresar a App Papá</h1>
      <p>Acceso exclusivo por invitación.</p>
      <p role="status">
        {!configured ? messages.configuracion : messages[estado ?? ""]}
      </p>
      {configured && (
        <>
          <form action={requestCode} className="auth-form">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
            <Button type="submit" highContrast>
              Solicitar código
            </Button>
          </form>
          <h2>Ya tengo un código</h2>
          <form action={verifyCode} className="auth-form">
            <label htmlFor="verify-email">Correo electrónico</label>
            <input
              id="verify-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
            <label htmlFor="token">Código del correo</label>
            <input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              required
            />
            <Button type="submit" highContrast>
              Ingresar
            </Button>
          </form>
        </>
      )}
    </main>
  );
}
