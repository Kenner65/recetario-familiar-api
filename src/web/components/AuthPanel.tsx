"use client";

import { useState } from "react";

import { ApiError, login, registrar } from "../api";

export function AuthPanel({ onAuth }: { onAuth: () => void }) {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      if (modo === "login") {
        await login(email.trim(), password);
      } else {
        await registrar(email.trim(), password);
      }
      onAuth();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar con la API.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Recetario familiar</h2>
        <p className="sub">
          {modo === "login" ? "Inicia sesión para ver tus recetas." : "Crea tu cuenta para empezar."}
        </p>

        <div className="auth-tabs">
          <button type="button" className={modo === "login" ? "activo" : ""} onClick={() => setModo("login")}>
            Iniciar sesión
          </button>
          <button type="button" className={modo === "registro" ? "activo" : ""} onClick={() => setModo("registro")}>
            Crear cuenta
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <form onSubmit={enviar}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              required
              minLength={modo === "registro" ? 8 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={modo === "registro" ? "Al menos 8 caracteres" : "Tu contraseña"}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={cargando}>
            {cargando ? <span className="spinner" /> : null}
            {modo === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <p className="hint" style={{ marginTop: 16, textAlign: "center" }}>
          Usa la misma cuenta que en la app móvil.
        </p>
      </div>
    </div>
  );
}
