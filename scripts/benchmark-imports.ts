// SOLO SINTÉTICOS: parser real, sin Auth/Storage/SQL/red ni datos del negocio.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { HEADERS, LIMITS, type Source } from "../src/lib/imports/contracts.ts";
import { readBook } from "../src/lib/imports/read.ts";
import { prepare } from "../src/lib/imports/validate.ts";
import { csv, xlsx, revenueRow } from "../tests/fixtures/imports/build.ts";

const [mode, source, path] = process.argv.slice(2);
if (mode === "--worker") {
  assert.ok(source === "aum" || source === "revenue" || source === "fa");
  const bytes = readFileSync(path);
  const form = new FormData();
  form.set("file", new File([bytes], "SINTETICO" + path.slice(path.lastIndexOf("."))));
  form.set("options", JSON.stringify({ source, period: "2026-01-01" }));
  form.set("requestId", "00000000-0000-4000-8000-000000000001");
  const multipartBytes = (await new Response(form).arrayBuffer()).byteLength;
  assert.ok(multipartBytes <= LIMITS.bytes + 64 * 1024);
  assert.ok(multipartBytes < 4_500_000);
  let cursor = 0, calls = 0, totalMs = 0, maxMs = 0, maxChunkBytes = 0;
  while (cursor < LIMITS.rows) {
    const started = performance.now();
    const book = await readBook(bytes, path, ",");
    const report = prepare(book, {
      source, period: "2026-01-01", custodianId: "00000000-0000-4000-8000-000000000001",
      custodianCode: "SYN-A", sheet: book.sheets[0].name, numericFormat: "dot", delimiter: ",",
    });
    assert.equal(report.blockingErrors, 0);
    assert.equal(report.rows.length, LIMITS.rows);
    assert.equal(report.total, source === "fa" ? null : "500");
    let chunkBytes = 0, count = 0;
    for (const row of report.rows.slice(cursor, cursor + LIMITS.chunk)) {
      const size = Buffer.byteLength(JSON.stringify(row));
      if (count && chunkBytes + size > LIMITS.chunkBytes) break;
      chunkBytes += size;
      count++;
    }
    assert.ok(count > 0 && count <= LIMITS.chunk);
    assert.ok(chunkBytes <= LIMITS.chunkBytes);
    cursor += count;
    calls++;
    const elapsed = performance.now() - started;
    totalMs += elapsed;
    maxMs = Math.max(maxMs, elapsed);
    maxChunkBytes = Math.max(maxChunkBytes, chunkBytes);
  }
  console.log(JSON.stringify({ source, format: path.split(".").at(-1), rows: cursor,
    originalBytes: bytes.length, multipartBytes, calls, maxChunkBytes,
    parserTotalMs: Math.round(totalMs), parserMaxMs: Math.round(maxMs),
    peakRssMiB: Math.ceil(process.resourceUsage().maxRSS / 1024) }));
} else {
  const root = mkdtempSync(join(tmpdir(), "app-papa-benchmark-SYNTHETIC-"));
  try {
    for (const source of Object.keys(HEADERS) as Source[]) {
      const rows = Array.from({ length: LIMITS.rows }, (_, i) => {
        const id = String(i + 1).padStart(12, "0");
        if (source === "aum") return ["SINTETICO", id, id, "0.10", "1", "2026"];
        if (source === "fa") return [id, id, "Owner SINTETICO", "Equipo SINTETICO", "", "Cliente SINTETICO", "Broker SINTETICO"];
        const row = revenueRow(id, "0.10");
        row[HEADERS.revenue.indexOf("DESCRIPTION")] = "SINTETICO ".repeat(24);
        return row;
      });
      for (const format of ["csv", "xlsx"]) {
        const file = join(root, `SINTETICO-${source}.${format}`);
        const bytes = format === "csv" ? csv(source, rows) : xlsx([{ name: "SINTETICO", rows: [[...HEADERS[source]], ...rows] }]);
        assert.ok(bytes.length <= LIMITS.bytes);
        writeFileSync(file, bytes, { mode: 0o600 });
        const child = spawnSync(process.execPath, ["--conditions=react-server", import.meta.filename, "--worker", source, file], { encoding: "utf8" });
        assert.equal(child.status, 0, child.stderr);
        console.log(child.stdout.trim());
      }
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
}
