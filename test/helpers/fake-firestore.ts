/**
 * Firestore falso en memoria con la superficie mínima que usa la API. Sirve
 * para simular Firebase en los tests sin emulador (sección 11 del enunciado).
 */

type Datos = Record<string, unknown>;

export interface FakeSnapshot {
  exists: boolean;
  data(): Datos | undefined;
}

export class FakeFirestore {
  /** Documentos por `${rutaColeccion}/${id}`. */
  readonly documentos = new Map<string, Datos>();
  /** Escrituras registradas (para verificar aislamiento por ruta). */
  readonly escrituras: Array<{ ruta: string; id: string; datos: Datos }> = [];
  /** Rutas de colección consultadas. */
  readonly colecciones: string[] = [];

  collection(ruta: string) {
    this.colecciones.push(ruta);
    return new FakeCollectionRef(this, ruta);
  }

  async runTransaction<T>(fn: (tx: FakeTransaction) => Promise<T> | T): Promise<T> {
    return fn(new FakeTransaction(this));
  }
}

export class FakeCollectionRef {
  private filtros: Array<{ campo: string; op: string; valor: unknown }> = [];
  private limite: number | null = null;

  constructor(
    private db: FakeFirestore,
    private ruta: string,
  ) {}

  doc(id: string) {
    return new FakeDocRef(this.db, this.ruta, id);
  }

  where(campo: string, op: string, valor: unknown) {
    this.filtros.push({ campo, op, valor });
    return this;
  }

  orderBy() {
    return this;
  }

  limit(n: number) {
    this.limite = n;
    return this;
  }

  async get() {
    const docs: Array<{ id: string; data(): Datos | undefined }> = [];
    for (const [clave, datos] of this.db.documentos) {
      const [ruta, id] = this.separarClave(clave);
      if (ruta !== this.ruta) continue;
      if (!this.cumpleFiltros(datos)) continue;
      docs.push({ id, data: () => datos });
      if (this.limite != null && docs.length >= this.limite) break;
    }
    return { docs };
  }

  private cumpleFiltros(datos: Datos): boolean {
    return this.filtros.every((f) => {
      if (f.op === "array-contains") {
        const arr = datos[f.campo] as unknown[] | undefined;
        return Array.isArray(arr) && arr.includes(f.valor);
      }
      if (f.op === ">") {
        return (datos[f.campo] as string) > (f.valor as string);
      }
      return true;
    });
  }

  private separarClave(clave: string): [string, string] {
    const idx = clave.lastIndexOf("/");
    return [clave.slice(0, idx), clave.slice(idx + 1)];
  }
}

export class FakeDocRef {
  constructor(
    private db: FakeFirestore,
    private ruta: string,
    private id: string,
  ) {}

  private clave() {
    return `${this.ruta}/${this.id}`;
  }

  async get(): Promise<FakeSnapshot> {
    const datos = this.db.documentos.get(this.clave());
    return { exists: datos !== undefined, data: () => datos };
  }

  async update(datos: Datos) {
    this.db.escrituras.push({ ruta: this.ruta, id: this.id, datos });
    const previo = this.db.documentos.get(this.clave()) ?? {};
    this.db.documentos.set(this.clave(), { ...previo, ...datos });
  }

  async set(datos: Datos) {
    this.db.escrituras.push({ ruta: this.ruta, id: this.id, datos });
    this.db.documentos.set(this.clave(), datos);
  }
}

export class FakeTransaction {
  constructor(private db: FakeFirestore) {}

  async get(ref: FakeDocRef): Promise<FakeSnapshot> {
    return ref.get();
  }

  async set(ref: FakeDocRef, datos: Datos) {
    await ref.set(datos);
  }
}
