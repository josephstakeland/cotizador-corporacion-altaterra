import lotesSeed from "../data/lotes.json";
import { newId, sha256 } from "./money";
import type { Company, Lot, Profile, Project, Quote } from "./types";

const KEY = "altaterra-cotizador-v1";

type LocalUser = Profile & { passwordHash: string };

export type LocalStore = {
  company: Company;
  projects: Project[];
  lots: Lot[];
  users: LocalUser[];
  quotes: Quote[];
};

const DEFAULT_COMPANY_ID = "company-altaterra";
const DEFAULT_PROJECT_ID = "project-bosques-del-sol-ii";

function defaultStore(adminHash: string, advisorHash: string): LocalStore {
  const lots: Lot[] = (lotesSeed as { manzana: string; numero: number; area_m2: number; price: number }[]).map(
    (row) => ({
      id: newId(),
      projectId: DEFAULT_PROJECT_ID,
      manzana: row.manzana,
      numero: row.numero,
      areaM2: row.area_m2,
      price: row.price,
      status: "disponible",
      polygon: null,
    }),
  );

  return {
    company: {
      id: DEFAULT_COMPANY_ID,
      name: "Corporación Altaterra",
      ruc: "",
      logoUrl: "/logos/altaterra.png",
    },
    projects: [
      {
        id: DEFAULT_PROJECT_ID,
        companyId: DEFAULT_COMPANY_ID,
        name: "Bosques del Sol II",
        slug: "bosques-del-sol-ii",
        logoUrl: "/logos/bosques-del-sol-ii.png",
        planUrl: "/planos/bosques-del-sol-ii.jpg",
      },
    ],
    lots,
    users: [
      {
        id: newId(),
        email: "admin@altaterra.pe",
        fullName: "Administrador",
        role: "admin",
        passwordHash: adminHash,
      },
      {
        id: newId(),
        email: "asesor@altaterra.pe",
        fullName: "Asesor",
        role: "asesor",
        passwordHash: advisorHash,
      },
    ],
    quotes: [],
  };
}

let memory: LocalStore | null = null;
let seedPromise: Promise<LocalStore> | null = null;

export async function loadStore(): Promise<LocalStore> {
  if (memory) return memory;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      memory = JSON.parse(raw) as LocalStore;
      return memory;
    }
    const store = defaultStore(await sha256("Admin123!"), await sha256("Asesor123!"));
    memory = store;
    localStorage.setItem(KEY, JSON.stringify(store));
    return store;
  })();
  return seedPromise;
}

function persist(store: LocalStore) {
  memory = store;
  localStorage.setItem(KEY, JSON.stringify(store));
}

export async function getStore(): Promise<LocalStore> {
  return loadStore();
}

export async function updateStore(mutator: (store: LocalStore) => void): Promise<LocalStore> {
  const store = await loadStore();
  mutator(store);
  persist(store);
  return store;
}

export function toPublicUser(user: LocalUser): Profile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}
