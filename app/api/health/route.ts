import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/health — verificación de estado. Incluye un reporte booleano de qué
 * credenciales están configuradas (sin exponer sus valores) para diagnosticar
 * despliegues sin filtrar secretos.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    servicio: "recetario-familiar-api",
    timestamp: new Date().toISOString(),
    configuracion: {
      firebase_web_api_key: Boolean(process.env.FIREBASE_WEB_API_KEY),
      firebase_admin: Boolean(
        process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY,
      ),
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    },
  });
}
