import type { Metadata } from "next";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Resumen | gma-software", template: "%s | gma-software" },
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
          accentColor="blue"
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
