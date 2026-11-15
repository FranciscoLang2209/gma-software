import { Button } from "@radix-ui/themes";
import Link from "next/link";
import { logout } from "../ingresar/actions";
export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  return (
    <main id="contenido" className="auth-panel">
      <h1>Acceso no autorizado</h1>
      <p>
        Tu cuenta no tiene permiso para esta sección. Contactá al administrador.
      </p>
      {estado === "logout" && (
        <p role="alert">
          No se pudo cerrar la sesión. Reintentá antes de abandonar un equipo
          compartido.
        </p>
      )}
      <Link href="/">Volver al Resumen</Link>
      <form action={logout}>
        <Button type="submit" highContrast>
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
