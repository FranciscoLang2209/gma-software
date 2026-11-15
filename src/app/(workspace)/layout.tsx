import Link from "next/link";
import { Badge, Button } from "@radix-ui/themes";
import { Navigation } from "@/components/navigation";
import { requireAccess } from "@/lib/auth/access";
import { logout } from "@/app/ingresar/actions";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requireAccess();
  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <Link href="/" className="brand" aria-label="App Papá, inicio">
            <span className="brand-monogram" aria-hidden="true">
              AP
            </span>
            <span>
              App Papá<small>Análisis de inversiones</small>
            </span>
          </Link>
          <p className="sidebar-label">ESPACIO DE TRABAJO</p>
          <Navigation role={access.role} />
          <div className="sidebar-note">
            <span className="status-dot" />
            Acceso por invitación<small>Consultas de datos publicados</small>
          </div>
        </aside>
        <div className="workspace">
          <div className="topbar">
            <span>Visión del negocio</span>
            <div>
              <Badge color="gray" variant="outline">
                USD
              </Badge>
              <Badge color="amber">
                {access.role === "admin" ? "Administrador" : "Lector"}
              </Badge>
              <form action={logout}>
                <Button type="submit" highContrast>
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>
          <main id="contenido" tabIndex={-1}>
            {children}
          </main>
          <footer>
            App Papá <span>Información no disponible ≠ cero · Moneda: USD</span>
          </footer>
        </div>
      </div>
    </>
  );
}
