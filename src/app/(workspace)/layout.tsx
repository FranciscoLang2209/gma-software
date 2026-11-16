import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
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
          <Link href="/" className="brand" aria-label="gma-software, inicio">
            <span className="brand-monogram" aria-hidden="true">
              GMA
            </span>
            <span>
              GMA<small>Investment analytics</small>
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
            <span className="workspace-context"><ShieldCheck size={15} aria-hidden="true" /> Espacio privado <span className="context-divider">/</span> Análisis de inversiones</span>
            <div>
              <Badge color="gray" variant="outline">
                USD
              </Badge>
              <Badge color="blue">
                {access.role === "admin" ? "Administrador" : "Lector"}
              </Badge>
              <form action={logout}>
                <Button type="submit" variant="ghost" color="gray">
                  <LogOut size={15} aria-hidden="true" />
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>
          <main id="contenido" tabIndex={-1}>
            {children}
          </main>
          <footer>
            gma-software <span>Información no disponible ≠ cero · Moneda: USD</span>
          </footer>
        </div>
      </div>
    </>
  );
}
