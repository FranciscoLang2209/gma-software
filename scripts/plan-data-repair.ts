import { readFile, mkdir, writeFile, stat, realpath } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { planRepair, type RepairInput } from "../src/lib/data/repair.ts";

// Solo archivos locales; deliberadamente no acepta credenciales, SQL ni --apply.
async function main() {
  const [mode, input, output, ...extra] = process.argv.slice(2);
  if (mode !== "--dry-run" || !input || !output || extra.length)
    throw new Error("Uso: node scripts/plan-data-repair.ts --dry-run entrada.json directorio-nuevo-privado");
  const repository = await realpath(fileURLToPath(new URL("../", import.meta.url)));
  const parent = await realpath(dirname(resolve(output)));
  if (parent === repository || parent.startsWith(repository + sep)) throw new Error("La salida privada debe quedar fuera del repositorio.");
  if ((await stat(input)).size > 64 * 1024 * 1024) throw new Error("Snapshot demasiado grande.");
  const result = planRepair(JSON.parse(await readFile(input, "utf8")) as RepairInput);
  // Exige directorio nuevo; no sobrescribir una revisión o backup anterior.
  await mkdir(output, { mode: 0o700 });
  for (const [name, data] of Object.entries({ manifest: { ...result.manifest, manifestHash: result.manifestHash }, backup: result.backup, rollback: result.rollback })) {
    await writeFile(resolve(output, `${name}.json`), JSON.stringify(data, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  }
  console.log(JSON.stringify({ mode: "dry-run", status: result.manifest.status,
    changes: result.manifest.changes.length, blockers: result.manifest.blockers.length }));
}
main().catch(() => { console.error("Dry-run no completado. Revisá entrada, controles y directorio nuevo; no se modificaron datos remotos. Puede haber artefactos locales parciales que deben conservarse para inspección."); process.exitCode = 1; });
