import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/**
 * Error normalizado de la API. Toda respuesta de error usa el formato
 * `{ error, detalles? }` (sección 9.3 del enunciado).
 */
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

/** Convierte cualquier error en una respuesta HTTP con el formato estándar. */
export function responderError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    const body: { error: string; detalles?: { campo: string; mensaje: string }[] } = {
      error: error.message,
    };
    if (error.detalles && error.detalles.length > 0) {
      body.detalles = error.detalles;
    }
    return NextResponse.json(body, { status: error.status });
  }

  // Errores internos: sin detalles, sin filtrar mensajes internos.
  console.error("[api] error interno:", error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

/**
 * Lee y valida el cuerpo JSON con un esquema Zod. Descarta campos no declarados
 * (comportamiento por defecto de Zod) y lanza `ApiError(400)` con `detalles`.
 */
export async function parsearCuerpo<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ApiError(400, "Cuerpo JSON inválido");
  }

  const resultado = schema.safeParse(cuerpo);
  if (!resultado.success) {
    throw new ApiError(
      400,
      "Datos inválidos",
      resultado.error.issues.map((issue) => ({
        campo: issue.path.join("."),
        mensaje: issue.message,
      })),
    );
  }
  return resultado.data;
}

/** Envuelve un manejador para convertir excepciones en respuestas de error. */
export async function manejar(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    return responderError(error);
  }
}
