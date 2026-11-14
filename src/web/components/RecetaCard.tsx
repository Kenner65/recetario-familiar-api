"use client";

import type { Receta } from "../types";

interface Props {
  receta: Receta;
  onAbrir: () => void;
  onFavorita: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}

export function RecetaCard({ receta, onAbrir, onFavorita, onEditar, onEliminar }: Props) {
  const resumen = receta.ingredientes
    .slice(0, 3)
    .map((i) => `${i.nombre}`)
    .join(" · ");

  return (
    <article className="card">
      <div className="card-img" onClick={onAbrir} style={{ cursor: "pointer" }}>
        {receta.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receta.foto_url} alt={`Foto de ${receta.nombre}`} />
        ) : (
          <span aria-hidden>🍲</span>
        )}
        <button
          type="button"
          className="star"
          onClick={(e) => {
            e.stopPropagation();
            onFavorita();
          }}
          aria-label={receta.favorita ? "Quitar de favoritas" : "Marcar como favorita"}
          title={receta.favorita ? "Quitar de favoritas" : "Marcar como favorita"}
        >
          {receta.favorita ? "⭐" : "☆"}
        </button>
      </div>

      <div className="card-body">
        <h3 className="card-title">{receta.nombre}</h3>
        <span className="card-meta">
          {receta.porciones} porciones
          {receta.minutos != null ? ` · ${receta.minutos} min` : ""}
        </span>
        {resumen ? <span className="card-meta">{resumen}…</span> : null}

        <div className="card-actions">
          <button type="button" className="btn btn-sm btn-primary" onClick={onAbrir}>
            Ver
          </button>
          <button type="button" className="btn btn-sm" onClick={onEditar}>
            Editar
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={onEliminar}>
            Borrar
          </button>
        </div>
      </div>
    </article>
  );
}
