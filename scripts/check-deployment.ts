import { readFileSync } from "node:fs";
import { checkDeployment } from "./deployment-config.ts";

// El build local sin conexión y los arneses sintéticos siguen disponibles.
if (process.env.VERCEL === "1" || process.argv.includes("--required")) {
  try {
    const targets = JSON.parse(readFileSync(new URL("../config/deployment-targets.json", import.meta.url), "utf8"));
    console.log(`Destino ${checkDeployment(process.env, targets)} verificado por configuración; servicios remotos pendientes.`);
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}
