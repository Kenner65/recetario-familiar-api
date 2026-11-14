import { NextResponse } from "next/server";

import { verificarToken } from "@/lib/auth-middleware";
import { ApiError, manejar } from "@/lib/errors";
import { eliminarImagen, subirImagen } from "@/lib/imagenes-repo";

export const runtime = "nodejs";

/** POST /api/imagenes — sube una imagen a Vercel Blob (store público). */
export async function POST(request: Request) {
  return manejar(async () => {
    const { uid } = await verificarToken(request);
    const rawContentType = request.headers.get("content-type") ?? "";
    const contentType = rawContentType.split(";")[0]?.trim().toLowerCase() ?? "";

    const bytes = await request.arrayBuffer();
    const resultado = await subirImagen(uid, bytes, contentType);

    return NextResponse.json(
      { url: resultado.url, pathname: resultado.pathname },
      { status: 201 },
    );
  });
}

/** DELETE /api/imagenes?url= — borra solo imágenes propias. */
export async function DELETE(request: Request) {
  return manejar(async () => {
    const { uid } = await verificarToken(request);
    const url = new URL(request.url).searchParams.get("url");

    if (!url) {
      throw new ApiError(400, 'Parámetro "url" requerido');
    }

    await eliminarImagen(uid, url);
    return NextResponse.json({ ok: true });
  });
}
