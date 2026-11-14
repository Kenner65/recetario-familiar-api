import { NextResponse } from "next/server";

import { verificarToken } from "@/lib/auth-middleware";
import { manejar } from "@/lib/errors";
import { listarRecetas } from "@/lib/recetas-repo";

export const runtime = "nodejs";

/** GET /api/recetas?since=<ISO> — cambios desde la última sincronización. */
export async function GET(request: Request) {
  return manejar(async () => {
    const { uid } = await verificarToken(request);
    const url = new URL(request.url);
    const since = url.searchParams.get("since") ?? undefined;

    const items = await listarRecetas(uid, since);
    return NextResponse.json({ items, servidor_ahora: new Date().toISOString() });
  });
}
