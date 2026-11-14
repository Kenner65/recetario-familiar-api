# Recetario familiar — API

API REST en **Next.js (App Router, Route Handlers)** desplegada en Vercel. Es el único intermediario
entre la app móvil y los servicios: **Firebase** (Authentication + Firestore, vía Admin SDK) y
**Vercel Blob** (imágenes). Todas las credenciales viven solo en las variables de entorno de Vercel;
la app solo conoce la URL pública de esta API.

## Stack

- Next.js 16 (App Router, `runtime = "nodejs"`) + TypeScript estricto
- `firebase-admin` (Auth y Firestore)
- `@vercel/blob` (imágenes)
- `zod` (validación)
- `vitest` (pruebas, con Firebase simulado)

## Endpoints

| Método y ruta | Descripción |
|---|---|
| `GET /api/health` | Verificación de estado |
| `POST /api/auth/registro` | `{ email, password }` → `201 { token, refreshToken, expiraEnSeg, usuario }` |
| `POST /api/auth/login` | `{ email, password }` → `200` (igual que registro) |
| `POST /api/auth/refresh` | `{ refreshToken }` → `200 { token, refreshToken, expiraEnSeg }` |
| `GET /api/auth/yo` | (Bearer) → `200 { usuario }` |
| `GET /api/recetas?since=<ISO>` | `200 { items, servidor_ahora }` (máx. 500, incluye borrados) |
| `PUT /api/recetas/[id]` | Crea/reemplaza (idempotente) → `200` con el documento |
| `DELETE /api/recetas/[id]` | Borrado lógico → `200 { ok: true }` / `404` |
| `GET /api/recetas/buscar?ingrediente=arroz` | `200 { items }` (`array-contains`) |
| `POST /api/imagenes` | bytes de imagen → `201 { url, pathname }` |
| `DELETE /api/imagenes?url=` | Solo imágenes propias → `200 { ok: true }` / `403` |

Todas las rutas privadas exigen `Authorization: Bearer <idToken>` y verifican el token con
`verifyIdToken()`. El `uid` sale **del token**, nunca del cuerpo ni de la URL.

Formato de error (siempre): `{ "error": "mensaje", "detalles"?: [{ "campo", "mensaje" }] }`.
Errores internos → `500 { "error": "Error interno" }` (sin detalles).

## Variables de entorno (solo en Vercel)

Copia `.env.example` a `.env.local` para desarrollo local. En producción configúralas en
**Vercel → Settings → Environment Variables**:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL` (cuenta de servicio)
- `FIREBASE_PRIVATE_KEY` — en Vercel pégala con `\n` literales; la API los convierte en saltos al iniciar.
- `FIREBASE_WEB_API_KEY` (para la API REST de Firebase Auth)
- `BLOB_READ_WRITE_TOKEN` (`vercel blob create-store` → `vercel env pull`)

**Nunca** en Git. `.env*` está en `.gitignore` (`.env.example` sí se versiona).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena con tus credenciales
npm run dev                  # http://localhost:3000/api/health
```

Comandos:

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Inicia el build de producción |
| `npm test` | Pruebas (Vitest) |
| `npm run typecheck` | Verifica tipos (`tsc --noEmit`) |
| `npm run lint` | Linter (ESLint) |

## Configurar Firebase

1. Crea un proyecto en Firebase y habilita **Authentication → Email/Password**.
2. Habilita **Firestore** en modo producción con reglas que niegan todo:
   `rules_version = '2'; service cloud.firestore { match /databases/{db}/documents { match /{document=**} { allow read, write: if false; } } }`.
3. Genera una **cuenta de servicio** (Firebase → Configuración → Cuentas de servicio → Generar clave) y copia
   `project_id`, `client_email` y `private_key` en las variables de entorno.
4. Copia la **clave de API web** (Configuración del proyecto → General) en `FIREBASE_WEB_API_KEY`.

## Desplegar en Vercel

```bash
npx vercel              # enlaza el proyecto
npx vercel env add      # añade las variables de entorno (o en el panel)
npx vercel blob create-store
npx vercel env pull     # obtiene BLOB_READ_WRITE_TOKEN
npx vercel --prod
```

Comprueba `GET https://<tu-api>.vercel.app/api/health` desde el teléfono y pon esa URL en la app
(`EXPO_PUBLIC_API_URL`).

## Seguridad

- Todo se valida con **Zod**; solo se guardan los campos declarados (los extra se descartan).
- Los datos privados viven en `usuarios/{uid}/receta/{id}`; el aislamiento lo da la **ruta**.
- `ingredientes_nombres` se deriva en el servidor (no se confía en el cliente).
- Las imágenes se guardan en `usuarios/<uid>/<uuid>.<ext>` y solo el dueño puede borrarlas.
- Los errores internos no se exponen; no se registran contraseñas ni tokens.

## Estructura

```text
app/api/
├── health/route.ts
├── auth/{registro,login,refresh,yo}/route.ts
├── recetas/route.ts            # GET (listado ?since=)
├── recetas/[id]/route.ts       # PUT, DELETE
├── recetas/buscar/route.ts     # GET ?ingrediente=
└── imagenes/route.ts           # POST, DELETE
src/
├── lib/
│   ├── firebase-admin.ts       # Singleton Admin SDK
│   ├── auth-middleware.ts      # verificación Bearer
│   ├── firebase-rest.ts        # API REST de Firebase Auth
│   ├── recetas-repo.ts         # acceso a Firestore
│   ├── imagenes-repo.ts        # acceso a Vercel Blob
│   └── errors.ts               # ApiError + formato de errores
└── schemas/                    # Zod (auth, receta)
test/                           # pruebas (Vitest) + Firestore falso
```
