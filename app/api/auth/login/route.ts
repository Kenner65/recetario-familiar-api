import { NextResponse } from "next/server";

import { manejar, parsearCuerpo } from "@/lib/errors";
import { iniciarSesion } from "@/lib/firebase-rest";
import { loginSchema } from "@/schemas/auth";

export const runtime = "nodejs";

/** POST /api/auth/login — valida credenciales contra Firebase Auth. */
export async function POST(request: Request) {
  return manejar(async () => {
    const { email, password } = await parsearCuerpo(request, loginSchema);
    const sesion = await iniciarSesion(email, password);

    return NextResponse.json({
      token: sesion.idToken,
      refreshToken: sesion.refreshToken,
      expiraEnSeg: sesion.expiraEnSeg,
      usuario: { id: sesion.localId, email: sesion.email },
    });
  });
}
