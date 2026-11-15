import type { Metadata } from "next";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Resumen | App Papá", template: "%s | App Papá" },
  description: "Análisis interno de AUM, Revenue y distribución comercial.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <body>
        <Theme
          accentColor="jade"
          grayColor="slate"
          radius="medium"
          appearance="light"
        >
          <a className="skip-link" href="#contenido">
            Ir al contenido
          </a>
          {children}
        </Theme>
      </body>
    </html>
  );
}
