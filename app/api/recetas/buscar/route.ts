import { NextResponse } from "next/server";

import { verificarToken } from "@/lib/auth-middleware";
import { ApiError, manejar } from "@/lib/errors";
import { buscarPorIngrediente } from "@/lib/recetas-repo";

export const runtime = "nodejs";

/** GET /api/recetas/buscar?ingrediente=arroz — búsqueda por `array-contains`. */
export async function GET(request: Request) {
  return manejar(async () => {
    const { uid } = await verificarToken(request);
    const url = new URL(request.url);
    const ingrediente = url.searchParams.get("ingrediente")?.trim();

    if (!ingrediente) {
      throw new ApiError(400, 'Parámetro "ingrediente" requerido');
    }

    const items = await buscarPorIngrediente(uid, ingrediente);
    return NextResponse.json({ items });
  });
}
