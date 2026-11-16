import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDeployment } from "../scripts/deployment-config.ts";

const target = {
  supabaseProjectRef: "abcdefghijklmnopqrst",
  vercelProjectId: "prj_SYNTHETIC",
  vercelTeamId: "team_SYNTHETIC",
  origin: "https://app-papa.example.invalid",
};
const env = {
  VERCEL_ENV: "preview",
  VERCEL_PROJECT_ID: target.vercelProjectId,
  VERCEL_ORG_ID: target.vercelTeamId,
  SUPABASE_URL: `https://${target.supabaseProjectRef}.supabase.co`,
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_SYNTHETIC",
};

test("build remoto exige destino revisado y variables solo servidor", () => {
  assert.equal(checkDeployment(env, { preview: target }), "preview");
  assert.throws(() => checkDeployment(env, {}));
  assert.throws(() => checkDeployment(env, { preview: target, production: target }));
  for (const patch of [
    { VERCEL_ENV: undefined },
    { VERCEL_PROJECT_ID: "prj_OTHER" },
    { VERCEL_ORG_ID: "team_OTHER" },
    { SUPABASE_URL: "https://other.invalid" },
    { SUPABASE_PUBLISHABLE_KEY: "sb_secret_SYNTHETIC" },
    { SUPABASE_SERVICE_ROLE_KEY: "SYNTHETIC" },
    { NEXT_PUBLIC_SUPABASE_URL: env.SUPABASE_URL },
  ]) assert.throws(() => checkDeployment({ ...env, ...patch }, { preview: target }));
  for (const origin of ["", "http://localhost:3000", "https://localhost", `${target.origin}/`, `${target.origin}/invitacion`, "https://user:pass@example.invalid"])
    assert.throws(() => checkDeployment(env, { preview: { ...target, origin } }));
});

test("Preview y Production comparten base solo con autorización mutua y mismo proyecto", () => {
  const shared = { ...target, sharedSupabase: true };
  const targets = { preview: shared, production: shared };
  assert.equal(checkDeployment(env, targets), "preview");
  assert.equal(checkDeployment({ ...env, VERCEL_ENV: "production" }, targets), "production");
  assert.throws(() => checkDeployment(env, { preview: shared, production: target }));
  assert.throws(() => checkDeployment(env, { preview: target, production: shared }));
  assert.throws(() => checkDeployment(env, { ...targets, development: shared }));
  assert.throws(() => checkDeployment(env, { preview: shared, production: { ...shared, vercelProjectId: "prj_OTHER" } }));
  assert.throws(() => checkDeployment(env, { preview: shared, production: { ...shared, vercelTeamId: "team_OTHER" } }));
});
