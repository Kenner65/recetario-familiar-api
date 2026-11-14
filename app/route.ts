import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Ruta raíz informativa: la API es headless y no tiene interfaz web. */
export async function GET() {
  return NextResponse.json({
    servicio: "recetario-familiar-api",
    estado: "ok",
    mensaje: "Esta es una API sin interfaz web. Verifica el estado en GET /api/health.",
    salud: "/api/health",
  });
}
