import type { Sesion } from "./types";

const CLAVE = "recetario.web.sesion";
const EVENTO = "recetario:sesion";

function notificar(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO));
  }
}

/** Snapshot crudo (string) para `useSyncExternalStore`. */
export function snapshotSesion(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function getSesion(): Sesion | null {
  const raw = snapshotSesion();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Sesion;
  } catch {
    return null;
  }
}

export function setSesion(sesion: Sesion): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CLAVE, JSON.stringify(sesion));
  notificar();
}

export function clearSesion(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(CLAVE);
  notificar();
}

/** Suscripción a cambios de sesión (entre pestañas y dentro de la misma). */
export function suscribirSesion(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO, callback);
  };
}
