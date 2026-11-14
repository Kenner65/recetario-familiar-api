import { firestore } from "./firebase-admin";
import type { RecetaDocumento, RecetaInput } from "../schemas/receta";

/**
 * Acceso a Firestore para las recetas. Los datos privados viven en
 * `usuarios/{uid}/receta/{id}`; el aislamiento entre usuarios lo da la ruta
 * (el `uid` sale del token verificado, nunca del cliente).
 */

const COLECCION = "receta";
const LIMITE_PAGINA = 500;

function coleccion(uid: string) {
  return firestore().collection(`usuarios/${uid}/${COLECCION}`);
}

function aDocumento(id: string, campos: Record<string, unknown>): RecetaDocumento {
  return {
    id,
    nombre: campos.nombre as string,
    porciones: campos.porciones as number,
    minutos: (campos.minutos as number | null) ?? null,
    pasos: (campos.pasos as string[]) ?? [],
    favorita: Boolean(campos.favorita),
    ingredientes: (campos.ingredientes as RecetaDocumento["ingredientes"]) ?? [],
    ingredientes_nombres: (campos.ingredientes_nombres as string[]) ?? [],
    foto_url: (campos.foto_url as string | null) ?? null,
    created_at: campos.created_at as string,
    updated_at: campos.updated_at as string,
    deleted_at: (campos.deleted_at as string | null) ?? null,
  };
}

/** GET /api/recetas?since= — devuelve hasta 500 documentos, incluidos borrados. */
export async function listarRecetas(uid: string, since?: string): Promise<RecetaDocumento[]> {
  let query = coleccion(uid).orderBy("updated_at", "asc").limit(LIMITE_PAGINA);
  if (since) {
    query = query.where("updated_at", ">", since);
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => aDocumento(doc.id, doc.data() as Record<string, unknown>));
}

/**
 * PUT /api/recetas/[id] — crea o reemplaza (idempotente). Preserva `created_at`
 * si ya existía y regenera `ingredientes_nombres` desde `ingredientes`.
 */
export async function upsertReceta(uid: string, id: string, datos: RecetaInput): Promise<RecetaDocumento> {
  const ahora = new Date().toISOString();
  const ingredientes_nombres = datos.ingredientes.map((ing) => ing.nombre);

  const ref = coleccion(uid).doc(id);
  let created_at = ahora;
  await firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      created_at = (snap.data()?.created_at as string) ?? ahora;
    }
    tx.set(
      ref,
      {
        nombre: datos.nombre,
        porciones: datos.porciones,
        minutos: datos.minutos ?? null,
        pasos: datos.pasos,
        favorita: datos.favorita,
        ingredientes: datos.ingredientes,
        ingredientes_nombres,
        foto_url: datos.foto_url ?? null,
        created_at,
        updated_at: ahora,
        deleted_at: null,
      },
      { merge: true },
    );
  });

  return {
    id,
    nombre: datos.nombre,
    porciones: datos.porciones,
    minutos: datos.minutos ?? null,
    pasos: datos.pasos,
    favorita: datos.favorita,
    ingredientes: datos.ingredientes,
    ingredientes_nombres,
    foto_url: datos.foto_url ?? null,
    created_at,
    updated_at: ahora,
    deleted_at: null,
  };
}

/** DELETE /api/recetas/[id] — borrado lógico. Devuelve `false` si no existe. */
export async function softDeleteReceta(uid: string, id: string): Promise<boolean> {
  const ref = coleccion(uid).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return false;
  }
  const ahora = new Date().toISOString();
  await ref.update({ deleted_at: ahora, updated_at: ahora });
  return true;
}

/** GET /api/recetas/buscar?ingrediente= — búsqueda por `array-contains`. */
export async function buscarPorIngrediente(uid: string, ingrediente: string): Promise<RecetaDocumento[]> {
  const snapshot = await coleccion(uid)
    .where("ingredientes_nombres", "array-contains", ingrediente)
    .limit(100)
    .get();

  return snapshot.docs
    .map((doc) => aDocumento(doc.id, doc.data() as Record<string, unknown>))
    .filter((doc) => doc.deleted_at == null);
}
