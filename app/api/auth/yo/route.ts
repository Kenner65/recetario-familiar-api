import { NextResponse } from "next/server";

import { verificarToken } from "@/lib/auth-middleware";
import { manejar } from "@/lib/errors";

export const runtime = "nodejs";

/** GET /api/auth/yo — devuelve el usuario del token verificado. */
export async function GET(request: Request) {
  return manejar(async () => {
    const identidad = await verificarToken(request);
    return NextResponse.json({
      usuario: { id: identidad.uid, email: identidad.email ?? "" },
    });
  });
}
