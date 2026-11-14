"use client";

import { useState } from "react";

import type { Receta, RecetaInput } from "../types";

interface FilaIngrediente {
  nombre: string;
  cantidad: string;
  unidad: string;
}

interface Props {
  receta?: Receta | null;
  onGuardar: (input: RecetaInput) => Promise<void>;
  onCerrar: () => void;
}

export function RecetaForm({ receta, onGuardar, onCerrar }: Props) {
  const [nombre, setNombre] = useState(receta?.nombre ?? "");
  const [porciones, setPorciones] = useState(String(receta?.porciones ?? 4));
  const [minutos, setMinutos] = useState(receta?.minutos != null ? String(receta.minutos) : "");
  const [pasos, setPasos] = useState<string[]>(receta?.pasos.length ? receta.pasos : [""]);
  const [fotoUrl, setFotoUrl] = useState(receta?.foto_url ?? "");
  const [ingredientes, setIngredientes] = useState<FilaIngrediente[]>(
    receta?.ingredientes.length
      ? receta.ingredientes.map((i) => ({ nombre: i.nombre, cantidad: String(i.cantidad), unidad: i.unidad }))
      : [{ nombre: "", cantidad: "1", unidad: "g" }],
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiarIngrediente = (indice: number, campo: keyof FilaIngrediente, valor: string) => {
    setIngredientes((prev) => prev.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)));
  };

  const agregarIngrediente = () => setIngredientes((prev) => [...prev, { nombre: "", cantidad: "1", unidad: "g" }]);
  const quitarIngrediente = (indice: number) => setIngredientes((prev) => prev.filter((_, i) => i !== indice));

  const cambiarPaso = (indice: number, valor: string) =>
    setPasos((prev) => prev.map((p, i) => (i === indice ? valor : p)));
  const agregarPaso = () => setPasos((prev) => [...prev, ""]);
  const quitarPaso = (indice: number) => setPasos((prev) => prev.filter((_, i) => i !== indice));

  const construirInput = (): RecetaInput => ({
    nombre: nombre.trim(),
    porciones: parseInt(porciones, 10) || 0,
    minutos: minutos.trim() ? parseInt(minutos, 10) || 0 : null,
    pasos: pasos.map((p) => p.trim()).filter((p) => p.length > 0),
    favorita: receta?.favorita ?? false,
    ingredientes: ingredientes
      .filter((i) => i.nombre.trim().length > 0)
      .map((i) => ({
        nombre: i.nombre.trim(),
        cantidad: parseFloat(i.cantidad.replace(",", ".")) || 0,
        unidad: i.unidad.trim(),
      })),
    foto_url: fotoUrl.trim() ? fotoUrl.trim() : null,
  });

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await onGuardar(construirInput());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la receta.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{receta ? "Editar receta" : "Nueva receta"}</h2>
          <button type="button" className="modal-close" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <form onSubmit={enviar}>
          <div className="field">
            <label htmlFor="nombre">Nombre de la receta</label>
            <input
              id="nombre"
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Arroz de la abuela"
              required
            />
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="porciones">Porciones</label>
              <input
                id="porciones"
                className="input"
                type="number"
                min={1}
                value={porciones}
                onChange={(e) => setPorciones(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="minutos">Minutos (opcional)</label>
              <input
                id="minutos"
                className="input"
                type="number"
                min={0}
                value={minutos}
                onChange={(e) => setMinutos(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="foto">URL de la foto (opcional)</label>
            <input
              id="foto"
              className="input"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="field">
            <label>Ingredientes</label>
            <div className="dinamica">
              {ingredientes.map((ing, i) => (
                <div className="dinamica-row" key={i}>
                  <input
                    className="input"
                    value={ing.nombre}
                    onChange={(e) => cambiarIngrediente(i, "nombre", e.target.value)}
                    placeholder="Ingrediente"
                    aria-label={`Nombre del ingrediente ${i + 1}`}
                  />
                  <input
                    className="input cantidad"
                    value={ing.cantidad}
                    onChange={(e) => cambiarIngrediente(i, "cantidad", e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    aria-label={`Cantidad del ingrediente ${i + 1}`}
                  />
                  <input
                    className="input unidad"
                    value={ing.unidad}
                    onChange={(e) => cambiarIngrediente(i, "unidad", e.target.value)}
                    placeholder="unidad"
                    aria-label={`Unidad del ingrediente ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => quitarIngrediente(i)}
                    disabled={ingredientes.length <= 1}
                    aria-label={`Quitar ingrediente ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="add-btn" onClick={agregarIngrediente}>
                + Agregar ingrediente
              </button>
            </div>
          </div>

          <div className="field">
            <label>Pasos</label>
            <div className="dinamica">
              {pasos.map((paso, i) => (
                <div className="dinamica-row" key={i}>
                  <span className="num">{i + 1}.</span>
                  <textarea
                    className="textarea"
                    value={paso}
                    onChange={(e) => cambiarPaso(i, e.target.value)}
                    placeholder="Describe este paso…"
                    aria-label={`Paso ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => quitarPaso(i)}
                    disabled={pasos.length <= 1}
                    aria-label={`Quitar paso ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="add-btn" onClick={agregarPaso}>
                + Agregar paso
              </button>
            </div>
          </div>

          <div className="row" style={{ marginTop: 20 }}>
            <button type="button" className="btn" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando} style={{ justifyContent: "center" }}>
              {guardando ? <span className="spinner" /> : null}
              Guardar receta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
