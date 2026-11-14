import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase-admin");

import { authAdmin } from "@/lib/firebase-admin";
import { POST as POSTLogin } from "../app/api/auth/login/route";
import { POST as POSTRefresh } from "../app/api/auth/refresh/route";
import { POST as POSTRegistro } from "../app/api/auth/registro/route";
import { GET as GETYo } from "../app/api/auth/yo/route";

function peticion(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  process.env.FIREBASE_WEB_API_KEY = "test-web-key";
  vi.mocked(authAdmin).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/auth/yo", () => {
  it("responde 401 sin token", async () => {
    const res = await GETYo(peticion("/api/auth/yo"));
    expect(res.status).toBe(401);
  });

  it("devuelve el usuario del token verificado", async () => {
    vi.mocked(authAdmin).mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "user-A", email: "a@example.com" }),
    } as unknown as ReturnType<typeof authAdmin>);

    const res = await GETYo(peticion("/api/auth/yo", { headers: { authorization: "Bearer token-ok" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.usuario).toEqual({ id: "user-A", email: "a@example.com" });
  });
});

describe("POST /api/auth/registro", () => {
  it("responde 400 con contraseña corta (validación)", async () => {
    const res = await POSTRegistro(
      peticion("/api/auth/registro", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "123" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("responde 409 si el correo ya existe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ error: { message: "EMAIL_EXISTS" } }, 400)));

    const res = await POSTRegistro(
      peticion("/api/auth/registro", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "password123" }),
      }),
    );
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("responde 401 con el mismo mensaje para credenciales inválidas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json({ error: { message: "INVALID_LOGIN_CREDENTIALS" } }, 400)),
    );

    const res = await POSTLogin(
      peticion("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "wrong-password" }),
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Credenciales inválidas");
  });

  it("responde 200 con la sesión en credenciales correctas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({
          idToken: "id-token-123",
          refreshToken: "refresh-123",
          expiresIn: "3600",
          localId: "user-A",
          email: "a@example.com",
        }),
      ),
    );

    const res = await POSTLogin(
      peticion("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", password: "password123" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("id-token-123");
    expect(body.usuario).toEqual({ id: "user-A", email: "a@example.com" });
  });
});

describe("POST /api/auth/refresh", () => {
  it("responde 200 con el nuevo token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({ id_token: "nuevo-id-token", refresh_token: "nuevo-refresh", expires_in: "3600" }),
      ),
    );

    const res = await POSTRefresh(
      peticion("/api/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: "refresh-123" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("nuevo-id-token");
  });
});
