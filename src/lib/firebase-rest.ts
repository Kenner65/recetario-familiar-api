import { ApiError } from "./errors";

/**
 * Cliente de la API REST de Firebase Auth. La app móvil no conoce ninguna
 * clave: el login/registro se hace en el servidor usando `FIREBASE_WEB_API_KEY`
 * (que solo existe en Vercel).
 */

const IDENTITY_URL = "https://identitytoolkit.googleapis.com/v1";
const TOKEN_URL = "https://securetoken.googleapis.com/v1";

export interface ResultadoSesion {
  idToken: string;
  refreshToken: string;
  expiraEnSeg: number;
  localId: string;
  email: string;
}

export interface ResultadoRefresh {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
}

function apiKey(): string {
  return process.env.FIREBASE_WEB_API_KEY ?? "";
}

async function publicar(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mapearErrorAuth(datos: Record<string, unknown>): ApiError {
  const codigo = (datos.error as { message?: string } | undefined)?.message ?? "";
  switch (codigo) {
    case "EMAIL_EXISTS":
      return new ApiError(409, "El correo ya está registrado");
    case "WEAK_PASSWORD":
      return new ApiError(400, "La contraseña es demasiado débil");
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return new ApiError(429, "Demasiados intentos. Inténtalo más tarde");
    case "INVALID_LOGIN_CREDENTIALS":
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
      // Mismo mensaje exista o no el correo (sección 9.1).
      return new ApiError(401, "Credenciales inválidas");
    case "INVALID_REFRESH_TOKEN":
    case "TOKEN_EXPIRED":
      return new ApiError(401, "Token de actualización inválido o expirado");
    default:
      return new ApiError(500, "Error interno");
  }
}

async function parsearOError(resp: Response): Promise<Record<string, unknown>> {
  const datos = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  if (!resp.ok) {
    throw mapearErrorAuth(datos);
  }
  return datos;
}

/** POST `accounts:signUp` → crea un usuario de Firebase Auth. */
export async function registrar(email: string, password: string): Promise<ResultadoSesion> {
  const resp = await publicar(`${IDENTITY_URL}/accounts:signUp?key=${apiKey()}`, {
    email,
    password,
    returnSecureToken: true,
  });
  const datos = await parsearOError(resp);
  return {
    idToken: datos.idToken as string,
    refreshToken: datos.refreshToken as string,
    expiraEnSeg: Number(datos.expiresIn),
    localId: datos.localId as string,
    email: datos.email as string,
  };
}

/** POST `accounts:signInWithPassword` → valida credenciales. */
export async function iniciarSesion(email: string, password: string): Promise<ResultadoSesion> {
  const resp = await publicar(`${IDENTITY_URL}/accounts:signInWithPassword?key=${apiKey()}`, {
    email,
    password,
    returnSecureToken: true,
  });
  const datos = await parsearOError(resp);
  return {
    idToken: datos.idToken as string,
    refreshToken: datos.refreshToken as string,
    expiraEnSeg: Number(datos.expiresIn),
    localId: datos.localId as string,
    email: datos.email as string,
  };
}

/** POST `securetoken` → renueva el ID token a partir del refresh token. */
export async function refrescar(refreshToken: string): Promise<ResultadoRefresh> {
  const resp = await publicar(`${TOKEN_URL}/token?key=${apiKey()}`, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const datos = await parsearOError(resp);
  return {
    token: (datos.id_token ?? datos.access_token) as string,
    refreshToken: datos.refresh_token as string,
    expiraEnSeg: Number(datos.expires_in),
  };
}
