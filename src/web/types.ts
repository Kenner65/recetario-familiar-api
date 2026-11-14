export interface Usuario {
  id: string;
  email: string;
}

export interface Ingrediente {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface Receta {
  id: string;
  nombre: string;
  porciones: number;
  minutos: number | null;
  pasos: string[];
  favorita: boolean;
  ingredientes: Ingrediente[];
  ingredientes_nombres: string[];
  foto_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RecetaInput {
  nombre: string;
  porciones: number;
  minutos: number | null;
  pasos: string[];
  favorita: boolean;
  ingredientes: Ingrediente[];
  foto_url: string | null;
}

export interface Sesion {
  token: string;
  refreshToken: string;
  usuario: Usuario;
}
