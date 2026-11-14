import { authAdmin } from "./firebase-admin";
import { ApiError } from "./errors";

export interface Identidad {
  uid: string;
  /** Custom claim opcional de rol (p. ej. "admin"). */
  rol?: string;
  email?: string;
}

/**
 * Verifica el `Authorization: Bearer <idToken>` y devuelve el `uid` extraído
 * del token verificado (nunca del cuerpo ni de la URL).
 */
export async function verificarToken(request: Request): Promise<Identidad> {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Token no proporcionado");
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = await authAdmin().verifyIdToken(token);
    const rol = (decoded as { rol?: string }).rol;
    return { uid: decoded.uid, rol, email: decoded.email };
  } catch {
    throw new ApiError(401, "Token inválido o expirado");
  }
}

/** Igual que `verificarToken`, pero además exige un custom claim de rol. */
export async function verificarRol(request: Request, rolRequerido: string): Promise<Identidad> {
  const identidad = await verificarToken(request);
  if (identidad.rol !== rolRequerido) {
    throw new ApiError(403, "No autorizado");
  }
  return identidad;
}
