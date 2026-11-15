import Link from "next/link";
import { Button } from "@radix-ui/themes";

export default function NotFound() {
  return (
    <section className="panel error-state">
      <p className="eyebrow">PÁGINA NO ENCONTRADA</p>
      <h1>Esta sección no existe</h1>
      <p>Usá la navegación para continuar.</p>
      <Button asChild highContrast>
        <Link href="/">Volver al resumen</Link>
      </Button>
    </section>
  );
}
