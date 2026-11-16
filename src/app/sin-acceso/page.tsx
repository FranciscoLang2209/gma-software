import type { Metadata } from "next";
import { Button } from "@radix-ui/themes";
import { ArrowRight, CircleHelp, Info, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { logout } from "../ingresar/actions";

export const metadata: Metadata = { title: "Sin acceso" };
export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  return (
    <main id="contenido" className="login-page" tabIndex={-1}>
      <section className="access-denied-card" aria-labelledby="access-denied-title">
        <div className="brand access-denied-brand">
          <span className="brand-monogram" aria-hidden="true">GMA</span>
          <span>GMA<small>Investment analytics</small></span>
        </div>
        <div className="access-denied-content">
          <span className="login-access-icon"><ShieldAlert size={24} aria-hidden="true" /></span>
          <p className="eyebrow">ESPACIO PRIVADO</p>
          <h1 id="access-denied-title">Acceso no autorizado</h1>
          <p className="login-description">Tu cuenta no tiene permiso para esta sección. Contactá al administrador para revisar tu acceso.</p>
          {estado === "logout" && (
            <div className="login-notice login-notice-error" role="alert">
              <Info size={18} aria-hidden="true" />
              <span>No se pudo cerrar la sesión. Reintentá antes de abandonar un equipo compartido.</span>
            </div>
          )}
          <div className="access-denied-actions">
            <Button asChild highContrast size="3"><Link href="/">Volver al Resumen<ArrowRight size={17} aria-hidden="true" /></Link></Button>
            <form action={logout}>
              <Button type="submit" variant="outline" highContrast size="3"><LogOut size={17} aria-hidden="true" />Cerrar sesión</Button>
            </form>
          </div>
          <div className="login-help"><CircleHelp size={18} aria-hidden="true" /><p><strong>¿Ingresaste con otra cuenta?</strong>Cerrá la sesión e ingresá con una cuenta habilitada por el administrador.</p></div>
        </div>
      </section>
      <footer className="login-footer">gma-software<span>Análisis de inversiones · USD</span></footer>
    </main>
  );
}
