import { Button } from "@radix-ui/themes";
import { acceptInvitation } from "../ingresar/actions";
export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash } = await searchParams;
  return (
    <main id="contenido" className="auth-panel">
      <h1>Aceptar invitación</h1>
      <p>
        Continuá solo si solicitaste acceso a App Papá. El enlace es de un solo
        uso.
      </p>
      <form action={acceptInvitation}>
        <input type="hidden" name="token_hash" value={token_hash ?? ""} />
        <Button type="submit" highContrast>
          Aceptar e ingresar
        </Button>
      </form>
    </main>
  );
}
