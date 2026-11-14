"use client";

import { useState } from "react";

import type { Receta } from "../types";
import { escalar, formatearCantidad } from "../utils";

interface Props {
  receta: Receta;
  onCerrar: () => void;
  onFavorita: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}

export function RecetaDetalle({ receta, onCerrar, onFavorita, onEditar, onEliminar }: Props) {
  const [porciones, setPorciones] = useState(receta.porciones);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2>{receta.nombre}</h2>
            <span className="card-meta">
              {receta.minutos != null ? `${receta.minutos} min · ` : ""}
              Porciones base: {receta.porciones}
            </span>
          </div>
          <button type="button" className="modal-close" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {receta.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="detalle-foto" src={receta.foto_url} alt={`Foto de ${receta.nombre}`} />
        ) : null}

        <div className="detalle-seccion">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Ingredientes</h3>
            <div className="stepper" aria-label="Ajustar porciones">
              <button type="button" onClick={() => setPorciones((p) => Math.max(1, p - 1))} aria-label="Disminuir porciones">
                −
              </button>
              <span aria-live="polite">{porciones}</span>
              <button type="button" onClick={() => setPorciones((p) => p + 1)} aria-label="Aumentar porciones">
                +
              </button>
            </div>
          </div>

          {receta.ingredientes.map((ing, i) => (
            <div className="ingrediente-linea" key={i}>
              <span>{ing.nombre}</span>
              <span className="cant">
                {formatearCantidad(escalar(ing.cantidad, receta.porciones, porciones))} {ing.unidad}
              </span>
            </div>
          ))}
        </div>

        <div className="detalle-seccion">
          <h3>Preparación</h3>
          {receta.pasos.map((paso, i) => (
            <div className="paso-linea" key={i}>
              <span className="n">{i + 1}.</span>
              <span>{paso}</span>
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: 24 }}>
          <button type="button" className="btn" onClick={onFavorita}>
            {receta.favorita ? "⭐ Quitar de favoritas" : "☆ Marcar favorita"}
          </button>
          <button type="button" className="btn btn-primary" onClick={onEditar}>
            Editar
          </button>
          <button type="button" className="btn btn-danger" onClick={onEliminar}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
