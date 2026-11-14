import { z } from "zod";

/** POST /api/auth/registro — contraseña de al menos 8 caracteres. */
export const registroSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

/** POST /api/auth/login — la contraseña no puede ir vacía. */
export const loginSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

/** POST /api/auth/refresh */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken requerido"),
});
