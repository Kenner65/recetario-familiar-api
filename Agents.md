# AGENTS.md — 07-recetario-familiar-api

## 1. Propósito y alcance
API REST backend en Next.js (App Router) desplegada en Vercel que actúa como único intermediario entre la app móvil, Firebase (Auth + Firestore) y Vercel Blob.
- **Regla de alcance:** Proyecto atómico. Implementa estrictamente los endpoints, esquemas y reglas de seguridad definidos aquí y en `07-recetario-familiar.md`.
- **Límite de entorno:** Trabaja exclusivamente dentro de la raíz de este repositorio (`07-recetario-familiar-api`).

## 2. Stack tecnológico
- **Framework:** Next.js (App Router, Route Handlers en `app/api/**/route.ts`) con TypeScript estricto.
- **Runtime:** Node.js obligatorio en todos los Route Handlers (`export const runtime = "nodejs";`).
- **Servicios:** `firebase-admin` (Auth y Firestore), `@vercel/blob` (imágenes).
- **Validación:** `zod`.
- **Pruebas:** `vitest` (Firebase simulado con `vi.mock`).

## 3. Comandos del proyecto
- Servidor local: `npm run dev`
- Ejecutar pruebas: `npm test` (o `npx vitest run`)
- Verificar tipos: `npm run typecheck` (o `npx tsc --noEmit`)
- Build de producción: `npm run build`
- Linter: `npm run lint`

## 4. Estructura
```text
app/api/
├── health/route.ts               # GET /api/health
├── auth/
│   ├── registro/route.ts         # POST /api/auth/registro
│   ├── login/route.ts            # POST /api/auth/login
│   ├── refresh/route.ts          # POST /api/auth/refresh
│   └── yo/route.ts               # GET /api/auth/yo
├── recetas/
│   ├── route.ts                  # GET /api/recetas?since=<ISO>
│   ├── [id]/route.ts             # PUT y DELETE /api/recetas/[id]
│   └── buscar/route.ts           # GET /api/recetas/buscar?ingrediente=
└── imagenes/route.ts             # POST y DELETE /api/imagenes
src/
├── lib/
│   ├── firebase-admin.ts         # Singleton Admin SDK (convierte \n en FIREBASE_PRIVATE_KEY)
│   ├── auth-middleware.ts        # Extracción y verificación de Bearer ID token
│   ├── firebase-rest.ts          # API REST de Firebase Auth (signUp/signIn/refresh)
│   ├── recetas-repo.ts           # Acceso a Firestore
│   ├── imagenes-repo.ts          # Acceso a Vercel Blob
│   └── errors.ts                 # ApiError + formato estándar de errores
└── schemas/                      # Esquemas Zod estrictos (auth, receta)
test/                             # Pruebas (Vitest) + Firestore falso en memoria
```

## 5. Convenciones de código
- Cada ruta privada verifica el ID token (`verificarToken`) y el `uid` sale **del token**, nunca del cuerpo ni de la URL.
- Validar **todo** con Zod; se guardan solo los campos declarados (los extra se descartan).
- Campos de Firestore en `snake_case` con los mismos nombres que SQLite; fechas ISO 8601 UTC; sin `undefined` (usar `null`).
- Documento privado: `usuarios/{uid}/receta/{id}` con `created_at`, `updated_at`, `deleted_at` puestos por el servidor.
- Borrado lógico (`deleted_at`); `GET /api/recetas?since=` incluye los borrados.
- Errores: `{ error, detalles? }` con códigos 400/401/403/404/409/413/415/429; internos → `500 Error interno` sin detalles.

## 6. Restricciones de seguridad (para la IA y para el equipo)
- **No leer** `.env`, `.env.local`, `.env.production` ni credenciales. Están en `.gitignore` y solo viven en Vercel.
- **No salir de la carpeta** del repositorio.
- `FIREBASE_PRIVATE_KEY`, `FIREBASE_WEB_API_KEY` y `BLOB_READ_WRITE_TOKEN` **nunca** en Git ni en la app.
- No registrar contraseñas, tokens ni datos personales en los logs.
- Acciones con efecto fuera de la máquina (deploy, push a remoto, `vercel`, `firebase`) requieren permiso explícito.
- Limitar la tasa de intentos de login (Firewall de Vercel) antes de usar datos reales.
