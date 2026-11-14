"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { ApiError, apiFetch, cerrarSesion as apiCerrarSesion } from "@/web/api";
import { snapshotSesion, suscribirSesion } from "@/web/auth";
import { AuthPanel } from "@/web/components/AuthPanel";
import { RecetaCard } from "@/web/components/RecetaCard";
import { RecetaDetalle } from "@/web/components/RecetaDetalle";
import { RecetaForm } from "@/web/components/RecetaForm";
import type { Receta, RecetaInput, Sesion } from "@/web/types";
import { nuevoId } from "@/web/utils";

function aInput(receta: Receta): RecetaInput {
  return {
    nombre: receta.nombre,
    porciones: receta.porciones,
    minutos: receta.minutos,
    pasos: receta.pasos,
    favorita: receta.favorita,
    ingredientes: receta.ingredientes.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, unidad: i.unidad })),
    foto_url: receta.foto_url,
  };
}

function parsearSesion(raw: string | null): Sesion | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Sesion;
  } catch {
    return null;
  }
}

export default function Page() {
  const sesionRaw = useSyncExternalStore(suscribirSesion, snapshotSesion, () => null);
  const sesion = useMemo(() => parsearSesion(sesionRaw), [sesionRaw]);

  const [recetas, setRecetas] = useState<Receta[] | null>(null);
  const [texto, setTexto] = useState("");
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Receta | null>(null);
  const [detalle, setDetalle] = useState<Receta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const datos = await apiFetch<{ items: Receta[] }>("/api/recetas");
      setRecetas(datos.items.filter((r) => r.deleted_at == null));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // La sesión ya se limpió en el cliente HTTP; el store reactivo lo refleja.
        return;
      }
      setError(e instanceof Error ? e.message : "No se pudieron cargar las recetas.");
    }
  }, []);

  useEffect(() => {
    if (!sesion) {
      return;
    }
    // Carga de datos desde la API al iniciar sesión (patrón estándar de fetch
    // en un efecto; el estado se actualiza tras el await, no de forma síncrona).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [sesion, cargar]);

  const recetasFiltradas = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return (recetas ?? []).filter((r) => {
      if (soloFavoritas && !r.favorita) return false;
      if (!t) return true;
      return r.nombre.toLowerCase().includes(t) || r.ingredientes_nombres.some((n) => n.toLowerCase().includes(t));
    });
  }, [recetas, texto, soloFavoritas]);

  function salir() {
    apiCerrarSesion();
    setRecetas(null);
    setDetalle(null);
    setFormAbierto(false);
  }

  function abrirForm(receta: Receta | null) {
    setEditando(receta);
    setFormAbierto(true);
    setDetalle(null);
  }

  async function guardarReceta(input: RecetaInput) {
    const id = editando?.id ?? nuevoId();
    await apiFetch(`/api/recetas/${id}`, { method: "PUT", body: JSON.stringify(input) });
    setFormAbierto(false);
    setEditando(null);
    await cargar();
  }

  async function alternarFavorita(receta: Receta) {
    setError(null);
    try {
      await apiFetch(`/api/recetas/${receta.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...aInput(receta), favorita: !receta.favorita }),
      });
      setRecetas((prev) => (prev ? prev.map((r) => (r.id === receta.id ? { ...r, favorita: !r.favorita } : r)) : prev));
      setDetalle((prev) => (prev && prev.id === receta.id ? { ...prev, favorita: !prev.favorita } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar la favorita.");
    }
  }

  async function eliminar(receta: Receta) {
    if (!window.confirm(`¿Seguro que quieres eliminar «${receta.nombre}»?`)) {
      return;
    }
    setError(null);
    try {
      await apiFetch(`/api/recetas/${receta.id}`, { method: "DELETE" });
      setRecetas((prev) => (prev ? prev.filter((r) => r.id !== receta.id) : prev));
      setDetalle((prev) => (prev && prev.id === receta.id ? null : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la receta.");
    }
  }

  if (!sesion) {
    return (
      <div className="app">
        <header className="header">
          <div className="brand">
            <span className="brand-logo" aria-hidden>
              🍲
            </span>
            <div>
              <h1>Recetario familiar</h1>
              <p>Las recetas de la familia, en la web</p>
            </div>
          </div>
        </header>
        <AuthPanel onAuth={() => {}} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-logo" aria-hidden>
            🍲
          </span>
          <div>
            <h1>Recetario familiar</h1>
            <p>{sesion.usuario.email}</p>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {error ? (
        <div className="error" role="alert" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Cerrar aviso"
            style={{ border: "none", background: "transparent", color: "inherit" }}
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="toolbar">
        <div className="search">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre o ingrediente…"
            aria-label="Buscar recetas"
          />
        </div>
        <label className="filtro">
          <input type="checkbox" checked={soloFavoritas} onChange={(e) => setSoloFavoritas(e.target.checked)} />
          Solo favoritas
        </label>
        <button type="button" className="btn btn-primary" onClick={() => abrirForm(null)}>
          + Nueva receta
        </button>
      </div>

      {recetas === null ? (
        <div className="center">
          <span className="spinner" />
        </div>
      ) : recetasFiltradas.length === 0 ? (
        <div className="empty">
          <div className="big">🍽️</div>
          <h2>{texto || soloFavoritas ? "Sin resultados" : "Aún no hay recetas"}</h2>
          <p>
            {texto || soloFavoritas
              ? "Prueba con otra búsqueda."
              : "Crea tu primera receta con el botón «Nueva receta»."}
          </p>
        </div>
      ) : (
        <div className="grid">
          {recetasFiltradas.map((receta) => (
            <RecetaCard
              key={receta.id}
              receta={receta}
              onAbrir={() => setDetalle(receta)}
              onFavorita={() => alternarFavorita(receta)}
              onEditar={() => abrirForm(receta)}
              onEliminar={() => eliminar(receta)}
            />
          ))}
        </div>
      )}

      {formAbierto ? (
        <RecetaForm
          receta={editando}
          onGuardar={guardarReceta}
          onCerrar={() => {
            setFormAbierto(false);
            setEditando(null);
          }}
        />
      ) : null}

      {detalle ? (
        <RecetaDetalle
          receta={detalle}
          onCerrar={() => setDetalle(null)}
          onFavorita={() => alternarFavorita(detalle)}
          onEditar={() => abrirForm(detalle)}
          onEliminar={() => eliminar(detalle)}
        />
      ) : null}
    </div>
  );
}
