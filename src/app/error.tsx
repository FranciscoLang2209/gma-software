"use client";

import { Button } from "@radix-ui/themes";
import Link from "next/link";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <section className="panel error-state" role="alert">
      <p className="eyebrow">NO SE PUDO CARGAR LA SECCIÓN</p>
      <h1>Ocurrió un error</h1>
      <p>No pudimos mostrar el contenido. Intentá nuevamente.</p>
      <div className="error-actions">
        <Button onClick={retry} highContrast>
          Reintentar
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Volver al resumen</Link>
        </Button>
      </div>
    </section>
  );
}
