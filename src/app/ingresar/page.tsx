import type { Metadata } from "next";
import Image from "next/image";
import { CircleCheck, CircleHelp, Info, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getSupabaseConfig } from "@/lib/supabase/server";
import loginOverview from "./login-overview.svg";

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
  const message = !configured ? messages.configuracion : messages[estado ?? ""];
  const hasError = !configured || estado === "error" || estado === "datos" || estado === "configuracion";
  return (
    <main id="contenido" className="login-page" tabIndex={-1}>
      <div className="login-shell">
        <section className="login-story" aria-labelledby="login-story-title">
          <div className="brand login-brand">
            <span className="brand-monogram" aria-hidden="true">GMA</span>
            <span>GMA<small>Investment analytics</small></span>
          </div>
          <div className="login-story-content">
            <p className="eyebrow">UNA VISIÓN INTEGRAL DEL NEGOCIO</p>
            <h2 id="login-story-title">La información conecta.<br />Las decisiones avanzan.</h2>
            <p>AUM, Revenue y análisis comercial en un mismo espacio de trabajo.</p>
            <Image className="login-art" src={loginOverview} alt="" width={480} height={280} priority />
            <div className="login-topics"><span>AUM</span><span>Revenue</span><span>Análisis comercial</span></div>
          </div>
          <p className="login-private"><ShieldCheck size={16} aria-hidden="true" /> Espacio privado · Acceso restringido</p>
        </section>
        <section className="login-access" aria-labelledby="login-title">
          <div className="login-card">
            <span className="login-access-icon"><ShieldCheck size={24} aria-hidden="true" /></span>
            <p className="eyebrow">BIENVENIDO A GMA</p>
            <h1 id="login-title">Ingresá a tu espacio</h1>
            <p className="login-description">Usá tu correo y contraseña para acceder a gma-software.</p>
            {message && <div className={`login-notice${hasError ? " login-notice-error" : ""}`} role={hasError ? "alert" : "status"}>
              {estado === "salida" && configured ? <CircleCheck size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
              <span>{message}</span>
            </div>}
            {configured && <LoginForm />}
            <div className="login-help"><CircleHelp size={18} aria-hidden="true" /><p><strong>¿Necesitás ayuda para ingresar?</strong>Para solicitar una cuenta o recuperar tu acceso, contactá al administrador.</p></div>
          </div>
          <p className="login-access-note"><ShieldCheck size={14} aria-hidden="true" /> Solo para cuentas habilitadas por el administrador</p>
        </section>
      </div>
      <footer className="login-footer">gma-software<span>Análisis de inversiones · USD</span></footer>
    </main>
  );
}
