export type SupabaseConfig =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "configured"; url: string; publishableKey: string };

export function parseSupabaseConfig(env: {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
}): SupabaseConfig {
  const url = env.SUPABASE_URL?.trim();
  const publishableKey = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !publishableKey) return { status: "missing" };
  if (
    !url ||
    !publishableKey ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)
  ) {
    return { status: "invalid" };
  }
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (
      (parsed.protocol !== "https:" &&
        !(local && parsed.protocol === "http:")) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== "/"
    ) {
      return { status: "invalid" };
    }
    return { status: "configured", url: parsed.origin, publishableKey };
  } catch {
    return { status: "invalid" };
  }
}
