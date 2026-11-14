import { clearSesion, getSesion, setSesion } from "./auth";
import type { Sesion, Usuario } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly detalles?: { campo: string; mensaje: string }[];

  constructor(status: number, mensaje: string, detalles?: { campo: string; mensaje: string }[]) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.detalles = detalles;
  }
}

interface RespuestaAuth {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: Usuario;
}

async function errorDe(resp: Response): Promise<ApiError> {
  let mensaje = "Error de red";
  let detalles: { campo: string; mensaje: string }[] | undefined;
  try {
    const datos = (await resp.json()) as { error?: string; detalles?: typeof detalles };
    if (datos?.error) mensaje = datos.error;
    detalles = datos?.detalles;
  } catch {
    // cuerpo no JSON
  }
  return new ApiError(resp.status, mensaje, detalles);
}

async function autenticar(ruta: "/api/auth/login" | "/api/auth/registro", email: string, password: string): Promise<Usuario> {
  const resp = await fetch(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) {
    throw await errorDe(resp);
  }
  const datos = (await resp.json()) as RespuestaAuth;
  setSesion({ token: datos.token, refreshToken: datos.refreshToken, usuario: datos.usuario });
  return datos.usuario;
}

export function login(email: string, password: string): Promise<Usuario> {
  return autenticar("/api/auth/login", email, password);
}

export function registrar(email: string, password: string): Promise<Usuario> {
  return autenticar("/api/auth/registro", email, password);
}

export function cerrarSesion(): void {
  clearSesion();
}

async function renovarToken(): Promise<string | null> {
  const sesion = getSesion();
  if (!sesion) {
    return null;
  }
  const resp = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: sesion.refreshToken }),
  });
  if (!resp.ok) {
    clearSesion();
    return null;
  }
  const datos = (await resp.json()) as { token: string; refreshToken: string };
  const actualizada: Sesion = { ...sesion, token: datos.token, refreshToken: datos.refreshToken };
  setSesion(actualizada);
  return datos.token;
}

/** Cliente HTTP de la web: mismo origen, Bearer token y refresco ante 401. */
export async function apiFetch<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const hacer = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (typeof init.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(ruta, { ...init, headers });
  };

  const sesion = getSesion();
  let resp = await hacer(sesion?.token ?? null);

  if (resp.status === 401 && sesion) {
    const token = await renovarToken();
    if (token) {
      resp = await hacer(token);
    }
  }

  if (!resp.ok) {
    throw await errorDe(resp);
  }
  if (resp.status === 204) {
    return undefined as T;
  }
  return (await resp.json()) as T;
}
