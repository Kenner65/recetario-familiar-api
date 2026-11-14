import { NextResponse } from "next/server";

import { verificarToken } from "@/lib/auth-middleware";
import { ApiError, manejar, parsearCuerpo } from "@/lib/errors";
import { softDeleteReceta, upsertReceta } from "@/lib/recetas-repo";
import { recetaSchema } from "@/schemas/receta";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

/** PUT /api/recetas/[id] — crea o reemplaza (idempotente). */
export async function PUT(request: Request, { params }: Contexto) {
  return manejar(async () => {
    const { uid } = await verificarToken(request);
    const { id } = await params;
    const datos = await parsearCuerpo(request, recetaSchema);

    const documento = await upsertReceta(uid, id, datos);
    return NextResponse.json(documento);
  });
}

/** DELETE /api/recetas/[id] — borrado lógico. */
export async function DELETE(request: Request, { params }: Contexto) {
  return manejar(async () => {
    const { uid } = await verificarToken(request);
    const { id } = await params;

    const borrado = await softDeleteReceta(uid, id);
    if (!borrado) {
      throw new ApiError(404, "Receta no encontrada");
    }
    return NextResponse.json({ ok: true });
  });
}
