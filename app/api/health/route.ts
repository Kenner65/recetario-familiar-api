import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/health — verificación de estado. Incluye qué credenciales están
 * configuradas (sin exponer valores) y un diagnóstico del Admin SDK para
 * localizar fallos de configuración sin filtrar secretos.
 */
export async function GET() {
  const configuracion = {
    firebase_web_api_key: Boolean(process.env.FIREBASE_WEB_API_KEY),
    firebase_admin: Boolean(
      process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY,
    ),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };

  // Diagnóstico del Admin SDK. Carga dinámica para que /health no se rompa
  // aunque el módulo no cargue.
  const admin: {
    carga: boolean;
    inicializa: boolean;
    error: string | null;
    verify: string | null;
  } = { carga: false, inicializa: false, error: null, verify: null };

  try {
    const { authAdmin } = await import("@/lib/firebase-admin");
    admin.carga = true;
    try {
      const auth = authAdmin();
      admin.inicializa = true;
      // Token con formato JWT válido pero inválido en contenido: obliga a
      // verifyIdToken a usar la cuenta de servicio (revela si la clave privada
      // es válida sin exponerla).
      const tokenFalso = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.invalido";
      try {
        await auth.verifyIdToken(tokenFalso);
        admin.verify = "inesperado: aceptó un token inválido";
      } catch (e) {
        admin.verify = (e as Error).message;
      }
    } catch (e) {
      admin.error = (e as Error).message;
    }
  } catch (e) {
    admin.error = "No se pudo cargar firebase-admin: " + (e as Error).message;
  }

  return NextResponse.json({
    ok: true,
    servicio: "recetario-familiar-api",
    timestamp: new Date().toISOString(),
    configuracion,
    firebase_admin: admin,
  });
}
