import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./lib/supabase/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const finish = (next = response) => {
    if (next !== response)
      response.cookies.getAll().forEach((cookie) => next.cookies.set(cookie));
    next.headers.set("Cache-Control", "private, no-store, max-age=0");
    next.headers.set("Pragma", "no-cache");
    next.headers.set("Expires", "0");
    next.headers.set("Referrer-Policy", "no-referrer");
    return next;
  };
  const pathname = request.nextUrl.pathname;
  const protectedPage =
    !["/ingresar", "/invitacion", "/sin-acceso"].includes(pathname) &&
    !pathname.startsWith("/api/");
  const config = getSupabaseConfig();
  if (config.status !== "configured") {
    return finish(
      protectedPage
        ? NextResponse.redirect(
            new URL("/ingresar?estado=configuracion", request.url),
          )
        : response,
    );
  }
  const supabase = createServerClient(config.url, config.publishableKey, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
  // Refresco oficial; la autorización se verifica también dentro de páginas y operaciones.
  await supabase.auth.getClaims();
  if (protectedPage) {
    const { data, error } = await supabase.auth.getUser();
    if (
      error &&
      error.status !== 400 &&
      error.status !== 401 &&
      error.status !== 403 &&
      error.name !== "AuthSessionMissingError"
    ) {
      return finish(
        NextResponse.json(
          { error: "No se pudo validar el acceso. Reintentá más tarde." },
          { status: 503 },
        ),
      );
    }
    if (!data.user || error)
      return finish(
        NextResponse.redirect(new URL("/ingresar?estado=sesion", request.url)),
      );
    const { data: role, error: roleError } =
      await supabase.rpc("current_access");
    if (roleError)
      return finish(
        NextResponse.json(
          { error: "No se pudieron verificar los permisos." },
          { status: 503 },
        ),
      );
    const adminPage = /^\/(importaciones|correspondencias)(\/|$)/.test(pathname);
    if (
      (role !== "admin" && role !== "reader") ||
      (adminPage && role !== "admin")
    ) {
      return finish(NextResponse.redirect(new URL("/sin-acceso", request.url)));
    }
  }
  return finish();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
