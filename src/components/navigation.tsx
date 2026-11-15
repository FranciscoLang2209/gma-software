"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const sections = [
  ["/", "Resumen"],
  ["/analisis-comercial", "Análisis comercial"],
  ["/cuentas", "Cuentas"],
  ["/importaciones", "Importaciones"],
  ["/correspondencias", "Correspondencias"],
  ["/configuracion", "Configuración"],
] as const;

export function Navigation({ role }: { role: "admin" | "reader" }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const filters = new URLSearchParams();
  for (const key of ["desde", "hasta", "custodio", "equipo", "comercial", "cliente", "cuenta", "servicio"]) {
    const value = search.get(key);
    if (value) filters.set(key, value);
  }
  return (
    <nav aria-label="Navegación principal" className="navigation">
      {sections
        .filter(
          ([href]) =>
            role === "admin" ||
            !["/importaciones", "/correspondencias"].includes(href),
        )
        .map(([href, label], index) => (
          <Link
            key={href}
            href={(href === "/" || href === "/analisis-comercial" || href === "/cuentas") && filters.size ? `${href}?${filters}` : href}
            aria-current={(pathname === href || (href === "/cuentas" && pathname.startsWith("/cuentas/"))) ? "page" : undefined}
          >
            <span aria-hidden="true" className="nav-number">
              0{index + 1}
            </span>
            {label}
          </Link>
        ))}
    </nav>
  );
}
