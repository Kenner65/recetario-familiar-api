import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";

import { ApiError } from "./errors";

/**
 * Imágenes en Vercel Blob (store público). La app nunca conoce el token de
 * Blob: envía los bytes y recibe la URL. El pathname `usuarios/<uid>/…` permite
 * comprobar la propiedad al borrar.
 */

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Vercel limita el cuerpo a 4,5 MB; se valida por debajo de ese umbral.
const TAMANO_MAXIMO = 4 * 1024 * 1024;

export interface ImagenSubida {
  url: string;
  pathname: string;
}

export async function subirImagen(uid: string, bytes: ArrayBuffer, contentType: string): Promise<ImagenSubida> {
  const extension = TIPOS_PERMITIDOS[contentType];
  if (!extension) {
    throw new ApiError(415, "Tipo de imagen no permitido (usa image/jpeg, image/png o image/webp)");
  }
  if (bytes.byteLength === 0) {
    throw new ApiError(400, "La imagen está vacía");
  }
  if (bytes.byteLength > TAMANO_MAXIMO) {
    throw new ApiError(413, "La imagen supera el tamaño máximo permitido (4 MB)");
  }

  const blob = await put(`usuarios/${uid}/${randomUUID()}.${extension}`, bytes, {
    access: "public",
    addRandomSuffix: true,
    contentType,
  });

  return { url: blob.url, pathname: blob.pathname };
}

/** Borra solo imágenes propias: el pathname debe empezar por `usuarios/<uid>/`. */
export async function eliminarImagen(uid: string, url: string): Promise<void> {
  let pathname: string;
  try {
    pathname = new URL(url).pathname.replace(/^\//, "");
  } catch {
    throw new ApiError(400, "URL de imagen inválida");
  }

  if (!pathname.startsWith(`usuarios/${uid}/`)) {
    throw new ApiError(403, "No puedes borrar una imagen que no te pertenece");
  }

  await del(url);
}
