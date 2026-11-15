import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSupabaseConfig } from "../src/lib/supabase/config.ts";
import { createSupabaseServerClient } from "../src/lib/supabase/server.ts";
import { getWorkspaceStatus } from "../src/lib/data/workspace.ts";

test("configuración ausente, incompleta y claves privilegiadas", () => {
  assert.deepEqual(parseSupabaseConfig({}), { status: "missing" });
  assert.deepEqual(parseSupabaseConfig({ SUPABASE_URL: " " }), {
    status: "missing",
  });
  for (const key of [
    undefined,
    "sb_secret_synthetic",
    "legacy-jwt",
    "sb_publishable_",
  ]) {
    assert.deepEqual(
      parseSupabaseConfig({
        SUPABASE_URL: "https://example.invalid",
        SUPABASE_PUBLISHABLE_KEY: key,
      }),
      { status: "invalid" },
    );
  }
});

test("solo HTTPS remoto u HTTP local, sin credenciales ni componentes ajenos al origen", () => {
  for (const url of [
    "incorrecta",
    "http://example.invalid",
    "ftp://localhost",
    "https://user:pass@example.invalid",
    "https://example.invalid/path",
    "https://example.invalid?key=private",
    "https://example.invalid#key",
  ]) {
    assert.deepEqual(
      parseSupabaseConfig({
        SUPABASE_URL: url,
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic",
      }),
      { status: "invalid" },
    );
  }
  for (const url of [
    "https://example.invalid",
    "http://localhost:54321",
    "http://127.0.0.1:54321",
  ]) {
    assert.equal(
      parseSupabaseConfig({
        SUPABASE_URL: url,
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic",
      }).status,
      "configured",
    );
  }
});

test("el acceso permanece cerrado sin conexión, con error y con variables válidas; nunca hay fallback", async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    assert.equal(getWorkspaceStatus().title, "Sin conexión configurada");
    await assert.rejects(createSupabaseServerClient, /configuración válida/);
    process.env.SUPABASE_URL = "incorrecta";
    assert.equal(getWorkspaceStatus().kind, "error");
    process.env.SUPABASE_URL = "https://example.invalid";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_synthetic";
    assert.equal(getWorkspaceStatus().title, "Variables configuradas");
    assert.equal(getWorkspaceStatus().kind, "unavailable");
  } finally {
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});
