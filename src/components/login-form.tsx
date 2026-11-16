"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { login } from "@/app/ingresar/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" highContrast disabled={pending} className="login-submit">
      {pending ? "Ingresando…" : "Ingresar"}
      {pending ? <LoaderCircle size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
    </Button>
  );
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={login} className="login-form">
      <div className="login-field">
        <label htmlFor="email">Correo electrónico</label>
        <div className="login-input">
          <Mail size={18} aria-hidden="true" />
          <input id="email" name="email" type="email" autoComplete="username" placeholder="nombre@empresa.com" maxLength={254} required />
        </div>
      </div>
      <div className="login-field">
        <label htmlFor="password">Contraseña</label>
        <div className="login-input">
          <LockKeyhole size={18} aria-hidden="true" />
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Ingresá tu contraseña" maxLength={4096} required />
          <button type="button" className="login-password-toggle" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-controls="password" aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
            {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
