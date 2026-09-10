import { createClient } from "@supabase/supabase-js";
import { computeQuote } from "./quote";
import { supabase, useSupabase } from "./supabase";
import { getStore, toPublicUser, updateStore } from "./storage";
import { fileToDataUrl, newId, sha256 } from "./money";
import type { Company, Lot, LotStatus, Point, Profile, Project, Quote, QuoteItem, Role } from "./types";

export async function login(email: string, password: string): Promise<Profile> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error(error?.message || "No se pudo iniciar sesión");
    const profile = await fetchSupabaseProfile(data.user.id, email);
    return profile;
  }
  const store = await getStore();
  const hash = await sha256(password);
  const user = store.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.passwordHash === hash);
  if (!user) throw new Error("Correo o contraseña incorrectos");
  sessionStorage.setItem("altaterra-user", user.id);
  return toPublicUser(user);
}

export async function register(email: string, password: string, fullName: string): Promise<Profile> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error || !data.user) throw new Error(error?.message || "No se pudo crear la cuenta");
    return fetchSupabaseProfile(data.user.id, email, fullName);
  }
  const store = await getStore();
  if (store.users.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Ese correo ya está registrado");
  }
  const role: Role = store.users.length === 0 ? "admin" : "asesor";
  const user = {
    id: newId(),
    email,
    fullName,
    role,
    passwordHash: await sha256(password),
  };
  await updateStore((current) => {
    current.users.push(user);
  });
  sessionStorage.setItem("altaterra-user", user.id);
  return toPublicUser(user);
}

export async function logout() {
  if (useSupabase && supabase) await supabase.auth.signOut();
  sessionStorage.removeItem("altaterra-user");
}

export async function currentUser(): Promise<Profile | null> {
  if (useSupabase && supabase) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return fetchSupabaseProfile(data.user.id, data.user.email || "");
  }
  const id = sessionStorage.getItem("altaterra-user");
  if (!id) return null;
  const store = await getStore();
  const user = store.users.find((item) => item.id === id);
  return user ? toPublicUser(user) : null;
}

export async function getCompany(): Promise<Company> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.from("companies").select("*").limit(1).single();
    if (error) throw error;
    return mapCompany(data);
  }
  return (await getStore()).company;
}

export async function updateCompany(patch: Partial<Company>): Promise<Company> {
  if (useSupabase && supabase) {
    const current = await getCompany();
    const { data, error } = await supabase
      .from("companies")
      .update({
        name: patch.name ?? current.name,
        ruc: patch.ruc ?? current.ruc,
        logo_url: patch.logoUrl ?? current.logoUrl,
      })
      .eq("id", current.id)
      .select()
      .single();
    if (error) throw error;
    return mapCompany(data);
  }
  const store = await updateStore((current) => {
    current.company = { ...current.company, ...patch };
  });
  return store.company;
}

export async function listProjects(): Promise<Project[]> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.from("projects").select("*").order("name");
    if (error) throw error;
    return (data || []).map(mapProject);
  }
  return (await getStore()).projects;
}

export async function createProject(input: {
  name: string;
  logoFile?: File | null;
  planFile?: File | null;
}): Promise<Project> {
  const company = await getCompany();
  const logoUrl = input.logoFile ? await fileToDataUrl(input.logoFile) : "/logos/bosques-del-sol-ii.png";
  const planUrl = input.planFile ? await fileToDataUrl(input.planFile) : "";
  const project: Project = {
    id: newId(),
    companyId: company.id,
    name: input.name,
    slug: input.name.toLowerCase().replace(/\s+/g, "-"),
    logoUrl,
    planUrl,
  };
  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        id: project.id,
        company_id: company.id,
        name: project.name,
        slug: project.slug,
        logo_url: project.logoUrl,
        plan_url: project.planUrl,
      })
      .select()
      .single();
    if (error) throw error;
    return mapProject(data);
  }
  await updateStore((current) => {
    current.projects.push(project);
  });
  return project;
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from("projects")
      .update({
        name: patch.name,
        logo_url: patch.logoUrl,
        plan_url: patch.planUrl,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapProject(data);
  }
  let updated: Project | undefined;
  await updateStore((current) => {
    current.projects = current.projects.map((project) => {
      if (project.id !== id) return project;
      updated = { ...project, ...patch };
      return updated;
    });
  });
  if (!updated) throw new Error("Proyecto no encontrado");
  return updated;
}

export async function listLots(projectId?: string): Promise<Lot[]> {
  if (useSupabase && supabase) {
    let query = supabase.from("lots").select("*").order("manzana").order("numero");
    if (projectId) query = query.eq("project_id", projectId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapLot);
  }
  const lots = (await getStore()).lots;
  return projectId ? lots.filter((lot) => lot.projectId === projectId) : lots;
}

export async function updateLot(id: string, patch: Partial<Lot>): Promise<Lot> {
  if (useSupabase && supabase) {
    const payload: Record<string, unknown> = {};
    if (patch.areaM2 !== undefined) payload.area_m2 = patch.areaM2;
    if (patch.price !== undefined) payload.price = patch.price;
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.polygon !== undefined) payload.polygon = patch.polygon;
    if (patch.manzana !== undefined) payload.manzana = patch.manzana;
    if (patch.numero !== undefined) payload.numero = patch.numero;
    const { data, error } = await supabase.from("lots").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return mapLot(data);
  }
  let updated: Lot | undefined;
  await updateStore((current) => {
    current.lots = current.lots.map((lot) => {
      if (lot.id !== id) return lot;
      updated = { ...lot, ...patch };
      return updated;
    });
  });
  if (!updated) throw new Error("Lote no encontrado");
  return updated;
}

export async function createLot(input: {
  projectId: string;
  manzana: string;
  numero: number;
  areaM2: number;
  price: number;
  status?: LotStatus;
}): Promise<Lot> {
  const lot: Lot = {
    id: newId(),
    projectId: input.projectId,
    manzana: input.manzana.toUpperCase(),
    numero: input.numero,
    areaM2: input.areaM2,
    price: input.price,
    status: input.status || "disponible",
    polygon: null,
  };
  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from("lots")
      .insert({
        id: lot.id,
        project_id: lot.projectId,
        manzana: lot.manzana,
        numero: lot.numero,
        area_m2: lot.areaM2,
        price: lot.price,
        status: lot.status,
        polygon: lot.polygon,
      })
      .select()
      .single();
    if (error) throw error;
    return mapLot(data);
  }
  await updateStore((current) => {
    current.lots.push(lot);
  });
  return lot;
}

export async function saveQuote(input: {
  projectId: string;
  advisorId: string;
  clientName: string;
  downPayment: number;
  items: QuoteItem[];
}): Promise<Quote> {
  const totals = computeQuote(input.items, input.downPayment);
  const quote: Quote = {
    id: newId(),
    projectId: input.projectId,
    advisorId: input.advisorId,
    clientName: input.clientName,
    downPayment: input.downPayment,
    items: input.items,
    totalList: totals.totalList,
    totalDiscount: totals.totalDiscount,
    totalFinal: totals.totalFinal,
    balance: totals.balance,
    createdAt: new Date().toISOString(),
  };
  if (useSupabase && supabase) {
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        id: quote.id,
        project_id: quote.projectId,
        advisor_id: quote.advisorId,
        client_name: quote.clientName,
        down_payment: quote.downPayment,
        items: quote.items,
        total_list: quote.totalList,
        total_discount: quote.totalDiscount,
        total_final: quote.totalFinal,
        balance: quote.balance,
      })
      .select()
      .single();
    if (error) throw error;
    return mapQuote(data);
  }
  await updateStore((current) => {
    current.quotes.unshift(quote);
  });
  return quote;
}

export async function listQuotes(projectId?: string): Promise<Quote[]> {
  if (useSupabase && supabase) {
    let query = supabase.from("quotes").select("*").order("created_at", { ascending: false });
    if (projectId) query = query.eq("project_id", projectId);
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(mapQuote);
  }
  const quotes = (await getStore()).quotes;
  return projectId ? quotes.filter((quote) => quote.projectId === projectId) : quotes;
}

export async function listProfiles(): Promise<Profile[]> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.from("profiles").select("*").order("full_name");
    if (error) throw error;
    return (data || []).map(mapProfile);
  }
  return (await getStore()).users.map(toPublicUser);
}

export async function updateProfileRole(id: string, role: Role): Promise<Profile> {
  if (useSupabase && supabase) {
    const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select().single();
    if (error) throw error;
    return mapProfile(data);
  }
  let updated: Profile | undefined;
  await updateStore((current) => {
    current.users = current.users.map((user) => {
      if (user.id !== id) return user;
      const next = { ...user, role };
      updated = toPublicUser(next);
      return next;
    });
  });
  if (!updated) throw new Error("Usuario no encontrado");
  return updated;
}

export async function createAdvisor(email: string, password: string, fullName: string): Promise<Profile> {
  if (useSupabase) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const helper = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await helper.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error || !data.user) throw new Error(error?.message || "No se pudo crear el asesor");
    return fetchSupabaseProfile(data.user.id, email, fullName);
  }
  const store = await getStore();
  if (store.users.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Ese correo ya está registrado");
  }
  const user = {
    id: newId(),
    email,
    fullName,
    role: "asesor" as Role,
    passwordHash: await sha256(password),
  };
  await updateStore((current) => {
    current.users.push(user);
  });
  return toPublicUser(user);
}

async function fetchSupabaseProfile(id: string, email: string, fullName = ""): Promise<Profile> {
  if (!supabase) throw new Error("Supabase no configurado");
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (data) return mapProfile({ ...data, email });
  return { id, email, fullName, role: "asesor" };
}

function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    ruc: String(row.ruc || ""),
    logoUrl: String(row.logo_url || "/logos/altaterra.png"),
  };
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    slug: String(row.slug),
    logoUrl: String(row.logo_url || ""),
    planUrl: String(row.plan_url || ""),
  };
}

function mapLot(row: Record<string, unknown>): Lot {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    manzana: String(row.manzana),
    numero: Number(row.numero),
    areaM2: Number(row.area_m2),
    price: Number(row.price),
    status: (row.status as LotStatus) || "disponible",
    polygon: (row.polygon as Point[] | null) || null,
  };
}

function mapQuote(row: Record<string, unknown>): Quote {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    advisorId: String(row.advisor_id),
    clientName: String(row.client_name),
    downPayment: Number(row.down_payment),
    items: (row.items as QuoteItem[]) || [],
    totalList: Number(row.total_list),
    totalDiscount: Number(row.total_discount),
    totalFinal: Number(row.total_final),
    balance: Number(row.balance),
    createdAt: String(row.created_at),
  };
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    email: String(row.email || ""),
    fullName: String(row.full_name || ""),
    role: (row.role as Role) || "asesor",
  };
}
