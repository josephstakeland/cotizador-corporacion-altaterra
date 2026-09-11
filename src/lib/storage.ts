import lotesCampoVerde from "../data/lotes-campo-verde.json";
import lotesParaiso from "../data/lotes-el-paraiso.json";
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
const PARAISO_PROJECT_ID = "project-el-paraiso-de-viru";
const CAMPO_VERDE_PROJECT_ID = "project-campo-verde-residencial";
const DEFAULT_COMPANY_RUC = "20614964325";

type LotSeed = { manzana: string; numero: number; area_m2: number; price: number };

function seedLots(projectId: string, idPrefix: string, rows: LotSeed[]): Lot[] {
  return rows.map((row) => ({
    id: `${idPrefix}-${row.manzana}-${row.numero}`,
    projectId,
    manzana: row.manzana,
    numero: row.numero,
    areaM2: row.area_m2,
    price: row.price,
    status: "disponible",
    polygon: null,
  }));
}

const EXTRA_PROJECTS: { project: Project; lots: Lot[] }[] = [
  {
    project: {
      id: PARAISO_PROJECT_ID,
      companyId: DEFAULT_COMPANY_ID,
      name: "Residencial El Paraíso de Virú",
      slug: "el-paraiso-de-viru",
      logoUrl: "/logos/el-paraiso-de-viru.png",
      planUrl: "/planos/el-paraiso-de-viru.jpg",
    },
    lots: seedLots(PARAISO_PROJECT_ID, "lot-el-paraiso", lotesParaiso as LotSeed[]),
  },
  {
    project: {
      id: CAMPO_VERDE_PROJECT_ID,
      companyId: DEFAULT_COMPANY_ID,
      name: "Campo Verde Residencial",
      slug: "campo-verde-residencial",
      logoUrl: "/logos/campo-verde-residencial.jpg",
      planUrl: "/planos/campo-verde-residencial.jpg",
    },
    lots: seedLots(CAMPO_VERDE_PROJECT_ID, "lot-campo-verde", lotesCampoVerde as LotSeed[]),
  },
];

function ensureCatalog(store: LocalStore) {
  for (const extra of EXTRA_PROJECTS) {
    const existing = store.projects.find((project) => project.id === extra.project.id || project.slug === extra.project.slug);
    if (!existing) store.projects.push({ ...extra.project });
    else {
      if (!existing.logoUrl) existing.logoUrl = extra.project.logoUrl;
      if (!existing.planUrl) existing.planUrl = extra.project.planUrl;
    }
    const projectId = existing?.id || extra.project.id;
    if (!store.lots.some((lot) => lot.projectId === projectId)) {
      store.lots.push(...extra.lots.map((lot) => ({ ...lot, projectId })));
    }
  }
}

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
      ruc: DEFAULT_COMPANY_RUC,
      phone: "",
      logoUrl: "/logos/altaterra.png",
    },
    projects: [
      {
        id: DEFAULT_PROJECT_ID,
        companyId: DEFAULT_COMPANY_ID,
        name: "Bosques del Sol II",
        slug: "bosques-del-sol-ii",
        logoUrl: "/logos/bosques-del-sol-ii.png",
        planUrl: "/planos/bosques-del-sol-ii-h2.jpg",
      },
      ...EXTRA_PROJECTS.map((item) => ({ ...item.project })),
    ],
    lots: [...lots, ...EXTRA_PROJECTS.flatMap((item) => item.lots.map((lot) => ({ ...lot })))],
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
      const flippedFromInverted = memory.projects.some((project) => project.planUrl.endsWith("bosques-del-sol-ii-h.jpg"));
      memory.projects = memory.projects.map((project) =>
        project.planUrl.includes("bosques-del-sol-ii") && !project.planUrl.includes("h2")
          ? { ...project, planUrl: "/planos/bosques-del-sol-ii-h2.jpg" }
          : project,
      );
      if (flippedFromInverted) {
        memory.lots = memory.lots.map((lot) => ({
          ...lot,
          polygon: lot.polygon ? lot.polygon.map((point) => ({ x: 1 - point.x, y: 1 - point.y })) : null,
        }));
      }
      if (!memory.company.ruc) {
        memory.company = { ...memory.company, ruc: DEFAULT_COMPANY_RUC };
      }
      if (memory.company.phone == null) {
        memory.company = { ...memory.company, phone: "" };
      }
      ensureCatalog(memory);
      localStorage.setItem(KEY, JSON.stringify(memory));
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
