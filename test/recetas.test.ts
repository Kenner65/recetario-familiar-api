import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeFirestore } from "./helpers/fake-firestore";

vi.mock("@/lib/firebase-admin");

import { authAdmin, firestore } from "@/lib/firebase-admin";
import { GET as GETBuscar } from "../app/api/recetas/buscar/route";
import { GET as GETLista } from "../app/api/recetas/route";
import { DELETE, PUT } from "../app/api/recetas/[id]/route";

let db: FakeFirestore;

function peticion(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function autenticada(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: "Bearer token-ok" },
  });
}

function autenticarComo(uid: string) {
  vi.mocked(authAdmin).mockReturnValue({
    verifyIdToken: vi.fn().mockResolvedValue({ uid, email: `${uid}@example.com` }),
  } as unknown as ReturnType<typeof authAdmin>);
}

const recetaValida = {
  nombre: "Arroz de la abuela",
  porciones: 4,
  minutos: 30,
  pasos: ["Cocer el arroz", "Servir"],
  favorita: false,
  ingredientes: [{ nombre: "arroz", cantidad: 200, unidad: "g" }],
  foto_url: null,
};

beforeEach(() => {
  db = new FakeFirestore();
  vi.mocked(firestore).mockReturnValue(db as unknown as ReturnType<typeof firestore>);
  vi.mocked(authAdmin).mockReset();
});

describe("GET /api/recetas", () => {
  it("responde 401 sin token", async () => {
    const res = await GETLista(peticion("/api/recetas"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Token no proporcionado");
  });

  it("responde 401 con token inválido", async () => {
    vi.mocked(authAdmin).mockReturnValue({
      verifyIdToken: vi.fn().mockRejectedValue(new Error("invalid")),
    } as unknown as ReturnType<typeof authAdmin>);

    const res = await GETLista(peticion("/api/recetas", { headers: { authorization: "Bearer malo" } }));
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/recetas/[id]", () => {
  it("responde 400 con un cuerpo inválido", async () => {
    autenticarComo("user-A");
    const res = await PUT(
      autenticada("/api/recetas/u1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nombre: "Sin pasos" }),
      }),
      { params: Promise.resolve({ id: "u1" }) },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.detalles).toBeDefined();
  });

  it("escribe en la ruta del usuario del token (aislamiento)", async () => {
    autenticarComo("user-A");
    const res = await PUT(
      autenticada("/api/recetas/u1", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(recetaValida),
      }),
      { params: Promise.resolve({ id: "u1" }) },
    );

    expect(res.status).toBe(200);

    // El uid NO viene del cuerpo (no lo hay): la escritura fue a la ruta del token.
    const escritura = db.escrituras[0];
    expect(escritura?.ruta).toBe("usuarios/user-A/receta");
    expect(escritura?.id).toBe("u1");
    // `ingredientes_nombres` se deriva en el servidor a partir de `ingredientes`.
    expect(escritura?.datos.ingredientes_nombres).toEqual(["arroz"]);

    const documento = await res.json();
    expect(documento.id).toBe("u1");
  });
});

describe("DELETE /api/recetas/[id]", () => {
  it("responde 404 si la receta no existe", async () => {
    autenticarComo("user-A");
    const res = await DELETE(autenticada("/api/recetas/inexistente", { method: "DELETE" }), {
      params: Promise.resolve({ id: "inexistente" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/recetas/buscar", () => {
  it("responde 400 sin el parámetro ingrediente", async () => {
    autenticarComo("user-A");
    const res = await GETBuscar(autenticada("/api/recetas/buscar"));
    expect(res.status).toBe(400);
  });
});
