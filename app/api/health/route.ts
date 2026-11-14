import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/health — verificación de estado (sección 13). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    servicio: "recetario-familiar-api",
    timestamp: new Date().toISOString(),
  });
}
