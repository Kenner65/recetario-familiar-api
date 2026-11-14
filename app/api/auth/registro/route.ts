import { NextResponse } from "next/server";

import { manejar, parsearCuerpo } from "@/lib/errors";
import { registrar } from "@/lib/firebase-rest";
import { registroSchema } from "@/schemas/auth";

export const runtime = "nodejs";

/** POST /api/auth/registro — crea un usuario de Firebase Auth. */
export async function POST(request: Request) {
  return manejar(async () => {
    const { email, password } = await parsearCuerpo(request, registroSchema);
    const sesion = await registrar(email, password);

    return NextResponse.json(
      {
        token: sesion.idToken,
        refreshToken: sesion.refreshToken,
        expiraEnSeg: sesion.expiraEnSeg,
        usuario: { id: sesion.localId, email: sesion.email },
      },
      { status: 201 },
    );
  });
}
