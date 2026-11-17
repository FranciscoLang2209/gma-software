"use client";

import Link from "next/link";
import { LayoutDashboard, ChartNoAxesCombined, Wallet, Upload, GitCompareArrows, Settings2, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

const sections = [
  ["/", "Resumen", LayoutDashboard],
  ["/analisis-comercial", "Análisis comercial", ChartNoAxesCombined],
  ["/cuentas", "Cuentas", Wallet],
  ["/importaciones", "Importaciones", Upload],
  ["/comisiones", "Comisiones", GitCompareArrows],
  ["/correspondencias", "Correspondencias", GitCompareArrows],
  ["/configuracion", "Configuración", Settings2],
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
            !["/importaciones", "/correspondencias", "/comisiones"].includes(href),
        )
        .map(([href, label, Icon]) => (
          <Link
            key={href}
            href={(href === "/" || href === "/analisis-comercial" || href === "/cuentas") && filters.size ? `${href}?${filters}` : href}
            aria-current={(pathname === href || (href === "/cuentas" && pathname.startsWith("/cuentas/"))) ? "page" : undefined}
          >
            <Icon size={18} aria-hidden="true" strokeWidth={1.7} />
            <span>{label}</span><ChevronRight size={14} className="nav-chevron" aria-hidden="true" />
          </Link>
        ))}
    </nav>
  );
}
