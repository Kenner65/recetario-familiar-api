import { NextResponse } from "next/server";

import { manejar, parsearCuerpo } from "@/lib/errors";
import { refrescar } from "@/lib/firebase-rest";
import { refreshSchema } from "@/schemas/auth";

export const runtime = "nodejs";

/** POST /api/auth/refresh — renueva el ID token con el refresh token. */
export async function POST(request: Request) {
  return manejar(async () => {
    const { refreshToken } = await parsearCuerpo(request, refreshSchema);
    const resultado = await refrescar(refreshToken);

    return NextResponse.json({
      token: resultado.token,
      refreshToken: resultado.refreshToken,
      expiraEnSeg: resultado.expiraEnSeg,
    });
  });
}
