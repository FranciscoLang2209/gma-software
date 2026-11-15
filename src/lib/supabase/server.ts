import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers.js";
import { parseSupabaseConfig } from "./config.ts";

export function getSupabaseConfig() {
  return parseSupabaseConfig({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  });
}

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (config.status !== "configured")
    throw new Error("Supabase no tiene una configuración válida.");
  const store = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Los Server Components no escriben cookies; proxy.ts ya las refrescó.
        }
      },
    },
  });
}
