-- El ejecutor necesita resolver auth.uid()/auth.jwt() en las operaciones revisadas.
-- USAGE no concede lectura de usuarios/sesiones ni cambia roles de aplicación o RLS.
grant usage on schema auth to app_papa_executor;
