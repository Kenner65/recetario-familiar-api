import { z } from "zod";

/**
 * Esquema del documento de receta. Campos en snake_case con los mismos nombres
 * que las columnas de SQLite. `ingredientes_nombres` se deriva en el servidor
 * (no se acepta del cliente); `id`, `created_at`, `updated_at` y `deleted_at`
 * los pone el servidor.
 */

const ingredienteSchema = z.object({
  nombre: z.string().min(1, "El nombre del ingrediente es obligatorio"),
  cantidad: z.number().positive("La cantidad debe ser mayor que 0"),
  unidad: z.string().min(1, "La unidad es obligatoria"),
});

export const recetaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  porciones: z.number().int("Las porciones deben ser un entero").positive("Las porciones deben ser mayores que 0"),
  minutos: z.number().int().nonnegative().nullable(),
  pasos: z.array(z.string().min(1)).min(1, "Debe haber al menos 1 paso"),
  favorita: z.boolean(),
  ingredientes: z.array(ingredienteSchema).min(1, "Debe haber al menos 1 ingrediente"),
  foto_url: z.string().url("foto_url debe ser una URL").nullable().optional(),
});

export type RecetaInput = z.infer<typeof recetaSchema>;

export interface RecetaDocumento {
  id: string;
  nombre: string;
  porciones: number;
  minutos: number | null;
  pasos: string[];
  favorita: boolean;
  ingredientes: { nombre: string; cantidad: number; unidad: string }[];
  ingredientes_nombres: string[];
  foto_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
