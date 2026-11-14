/** Escala una cantidad al cambiar las porciones (misma lógica que la app móvil). */
export function escalar(cantidad: number, porcionesBase: number, porcionesNuevas: number): number {
  if (porcionesBase <= 0 || porcionesNuevas <= 0) {
    return cantidad;
  }
  return Math.round((cantidad * (porcionesNuevas / porcionesBase) + Number.EPSILON) * 100) / 100;
}

/** Formatea una cantidad: entero sin decimales, o hasta 2 decimales. */
export function formatearCantidad(valor: number): string {
  const redondeado = Math.round((valor + Number.EPSILON) * 100) / 100;
  if (Number.isInteger(redondeado)) {
    return String(redondeado);
  }
  return redondeado.toFixed(2).replace(/\.?0+$/, "");
}

/** UUID v4 en el navegador (id del documento en Firestore). */
export function nuevoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
